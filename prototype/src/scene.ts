import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { dimensions } from './model.ts';
import type { Configuration } from './model.ts';
import type { Snapshot, Sample } from './engine.ts';
import { PoseStream, damping } from './motion.ts';
import { PARTS } from './parts.ts';
import { RenderStats } from './render-stats.ts';
import { finishes } from './finishes.ts';
import { batchStaticMeshes } from './batching.ts';
import { ServiceLoop, contactCenters, plugHousing, socketHousing } from './mechanism.ts';
import type { PartId } from './parts.ts';

export type View = 'overview' | 'side' | 'top' | 'connector' | 'flight' | 'part';
export type Mode = 'machine' | 'inside' | 'parts';
export interface Hud { labels: HTMLElement; tooltip: HTMLElement; onPick?: (id: PartId) => void; onDirector?: (on: boolean) => void }

const FONT = "Geist, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'IBM Plex Mono', 'SFMono-Regular', Menlo, monospace";
const mat = (color: number, metalness: number, roughness: number, extra: THREE.MeshStandardMaterialParameters = {}) =>
  new THREE.MeshStandardMaterial({ color, metalness, roughness, ...extra });
const M = finishes;
const shared = new Set<THREE.Material>(Object.values(M));

const geometries = new Map<string, THREE.BufferGeometry>();
const cachedSet = new Set<THREE.BufferGeometry>();
function cached(key: string, make: () => THREE.BufferGeometry) {
  if (!geometries.has(key)) { const g = make(); geometries.set(key, g); cachedSet.add(g); }
  return geometries.get(key)!;
}
function box(parent: THREE.Object3D, name: string, size: number[], pos: number[], material: THREE.Material, radius = 0.3) {
  const r = Math.min(radius, size[0] / 3, size[1] / 3, size[2] / 3);
  const geo = cached(`b${size}${r}`, () => r > 0.02 ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, r) : new THREE.BoxGeometry(size[0], size[1], size[2]));
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
function cylinder(parent: THREE.Object3D, radius: number, height: number, pos: number[], material: THREE.Material, segments = 24, axis: 'z' | 'x' = 'z') {
  const mesh = new THREE.Mesh(cached(`c${radius},${height},${segments}`, () => new THREE.CylinderGeometry(radius, radius, height, segments)), material);
  if (axis === 'z') mesh.rotation.x = Math.PI / 2; else mesh.rotation.z = Math.PI / 2;
  mesh.position.set(pos[0], pos[1], pos[2]); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh);
  return mesh;
}
function screw(parent: THREE.Object3D, x: number, y: number, z: number) {
  cylinder(parent, 1.4, 0.45, [x, y, z], M.silver, 16);
  cylinder(parent, 0.58, 0.1, [x, y, z + 0.26], M.dark, 6);
}
function line(parent: THREE.Object3D, points: THREE.Vector3[], color: number, opacity = 1) {
  const obj = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  parent.add(obj); return obj;
}
function cable(parent: THREE.Object3D, points: number[][], color: number, radius = 0.32) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 28, radius, 8, false), new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.1 }));
  mesh.castShadow = true; parent.add(mesh);
}
function canvasTexture(w: number, h: number) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8;
  return { canvas, texture, ctx: canvas.getContext('2d')! };
}
function print(c: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, weight = 500, font = FONT) {
  c.fillStyle = color; c.font = `${weight} ${size}px ${font}`; c.fillText(text, x, y);
}

const EXPLODE_ORDER: PartId[] = ['socket', 'tester', 'connector', 'gripper', 'zaxis', 'carriage', 'gantry'];
const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const step = (value: number, goal: number, amount: number) => value < goal ? Math.min(goal, value + amount) : Math.max(goal, value - amount);
const toY = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0)), fromY = toY.clone().invert();
const sa = new THREE.Spherical(), sb = new THREE.Spherical();
function orbitBlend(a: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  sa.setFromVector3(a.applyQuaternion(toY)); sb.setFromVector3(b.applyQuaternion(toY));
  let turn = sb.theta - sa.theta; turn -= Math.round(turn / (Math.PI * 2)) * Math.PI * 2;
  out.setFromSphericalCoords(Math.exp(THREE.MathUtils.lerp(Math.log(sa.radius), Math.log(sb.radius), t)), THREE.MathUtils.lerp(sa.phi, sb.phi, t), sa.theta + turn * t).applyQuaternion(fromY);
}

interface Part { id: PartId; name: string; line: string; group: THREE.Group; offset: THREE.Vector3; anchor: THREE.Vector3; side: 1 | -1; label: HTMLElement }

export class WorkcellScene {
  renderer: THREE.WebGLRenderer;
  stats: RenderStats;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 1, 4000);
  controls: OrbitControls;
  cell = new THREE.Group();
  fixture = new THREE.Group();
  socket = new THREE.Group();
  tool = new THREE.Group();
  carriage = new THREE.Group();
  ySlide = new THREE.Group();
  serviceLoop = new ServiceLoop(M.rubber);
  screwRotor = new THREE.Group();
  plug = new THREE.Group();
  parts = new Map<PartId, Part>();
  trail: THREE.Line;
  shells: THREE.Mesh[] = [];
  socketCover: THREE.Mesh[] = [];
  plugCover: THREE.Mesh[] = [];
  ledMaterial = mat(0xe7aa45, 0.1, 0.4, { emissive: 0xc77917, emissiveIntensity: 0.5 });
  stack = [0x4fd08a, 0xffb02e, 0xff4b3a].map(c => mat(c, 0.1, 0.35, { emissive: c, emissiveIntensity: 0.08, transparent: true, opacity: 0.92 }));
  hmi = canvasTexture(640, 420);
  plate = canvasTexture(1536, 172);
  config: Configuration;
  state: Snapshot | null = null;
  mode: Mode = 'machine';
  viewMode: View = 'overview';
  focus: PartId = 'socket';
  spread = 0;
  cut = 0;
  poses = new PoseStream();
  trailPositions = new Float32Array(1500);
  trailStart = -1;
  trailCount = 0;
  lastVariant: Configuration['variant'] | null = null;
  connectorMaterials = new Set<THREE.Material>();
  resizeObserver: ResizeObserver;
  intersection: IntersectionObserver;
  container: HTMLElement;
  hud: Hud | null;
  frame = 0;
  lastFrame = performance.now();
  lastHmi = 0;
  visible = true;
  width = 1;
  height = 1;
  baseDistance = 260;
  shift = 0;
  desiredPosition = new THREE.Vector3();
  desiredTarget = new THREE.Vector3(0, 0, 30);
  animating = false;
  tween: { from: THREE.Vector3; fromTarget: THREE.Vector3; start: number; duration: number } | null = null;
  autoSpin = 0;
  shadowPose = '';
  dragging = false;
  lastInteraction = performance.now();
  flightTime = 0;
  flightBlend = 0;
  overviewDir: THREE.Vector3 | null = null;
  hovered: PartId | null = null;
  pointer: { x: number; y: number } | null = null;
  pointerMoved = false;
  down: { x: number; y: number; moved: boolean; pointerId: number | null } = { x: 0, y: 0, moved: false, pointerId: null };
  reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  embed: boolean;
  pixelRatio: number;
  frames = 0;
  measured = 0;
  renderCost = 0;
  slow = 0;
  raycaster = new THREE.Raycaster();
  direction = new THREE.Vector3(0.62, -0.78, 0.5).normalize();
  labelWidths = new Map<PartId, number>();
  director = false;
  directorHasRun = false;
  dirPos = new THREE.Vector3();
  dirTarget = new THREE.Vector3();
  phase = 'ready';
  phaseStart = performance.now();
  clickAt = -1e9;
  latched = false;
  latchParts: { mesh: THREE.Mesh; y: number }[] = [];
  flex = 0;
  playing = false;
  visualTime = 0;
  playbackSpeed = 1;
  disposed = false;
  rendering = false;
  afterRender: (() => void) | null = null;
  lastLabels = 0;
  onContextLost = (event: Event) => {
    event.preventDefault();
    this.container.dispatchEvent(new CustomEvent('renderer-lost'));
  };

  constructor(container: HTMLElement, config: Configuration, hud: Hud | null = null, embed = false) {
    this.container = container; this.config = config; this.hud = hud; this.embed = embed;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    this.stats = new RenderStats(container, this.renderer);
    this.pixelRatio = Math.min(devicePixelRatio, 2);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap; this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12;
    container.append(this.renderer.domElement);
    this.renderer.domElement.setAttribute('aria-label', 'Interactive 3D simulation of a connector workcell. Drag to rotate, scroll to zoom, hover a part to name it.');
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.07, enablePan: false, minDistance: 45, maxDistance: 520, maxPolarAngle: Math.PI * 0.49, minPolarAngle: 0.02, rotateSpeed: 0.55, zoomSpeed: 0.7, autoRotateSpeed: 0.35 });
    if (embed) this.controls.enableZoom = false;
    if (matchMedia('(pointer: coarse)').matches) { this.controls.touches = { ONE: -1 as THREE.TOUCH, TWO: THREE.TOUCH.DOLLY_ROTATE }; this.renderer.domElement.style.touchAction = 'pan-y'; }
    this.controls.addEventListener('start', () => { this.direct(false); this.flightBlend = 0; this.dragging = true; this.animating = false; this.tween = null; this.autoSpin = 0; this.lastInteraction = performance.now(); });
    this.controls.addEventListener('end', () => { this.dragging = false; this.lastInteraction = performance.now(); });
    this.controls.addEventListener('change', this.wake);

    const env = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(env, 0.04).texture; this.scene.environmentIntensity = 0.9; this.scene.environmentRotation.set(Math.PI / 2, 0, 0); env.dispose(); pmrem.dispose();
    const hemi = new THREE.HemisphereLight(0xe5e9ed, 0x252321, 1.2); hemi.position.set(0, 0, 1); this.scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff5e9, 3.1); key.position.set(-40, -70, 140); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -95, right: 95, top: 95, bottom: -95, near: 20, far: 320 });
    key.shadow.normalBias = 0.12; key.shadow.bias = -0.0002; key.shadow.radius = 3; this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xe1eafa, 2.5); rim.position.set(60, 90, 80); this.scene.add(rim);
    const front = new THREE.DirectionalLight(0xffffff, 1); front.position.set(90, -120, 40); this.scene.add(front);

    this.renderer.toneMappingExposure = 1.05; this.backdrop();
    this.scene.add(this.cell);
    this.buildGround(); this.buildTable(); this.buildGantry(); this.buildTool(); this.buildTester(); this.buildConnector();
    batchStaticMeshes(this.cell, new Set([...this.shells, ...this.socketCover, ...this.plugCover, ...this.latchParts.map(p => p.mesh)])); this.tagParts();
    this.cell.add(this.serviceLoop.mesh); this.serviceLoop.update(0, 0, 42);
    this.trail = line(this.cell, [new THREE.Vector3(0, 0, 27)], 0xff8a3a, 0.8);
    this.trail.geometry.setAttribute('position', new THREE.BufferAttribute(this.trailPositions, 3).setUsage(THREE.DynamicDrawUsage));
    this.trail.geometry.setDrawRange(0, 0); this.trail.frustumCulled = false;
    this.trail.visible = false;
    this.tool.position.z = 42;
    this.drawPlate(); this.drawHmi();
    document.fonts?.ready.then(() => { if (!this.disposed) { this.drawPlate(); this.drawHmi(); this.wake(); } });
    this.measureAnchors();
    this.cut = 1; this.applyCut(true); this.renderer.compile(this.scene, this.camera); this.cut = 0; this.applyCut(true);

    this.resizeObserver = new ResizeObserver(() => this.layout()); this.resizeObserver.observe(container);
    this.intersection = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; this.wake(); }, { threshold: 0.01 });
    this.intersection.observe(container);
    document.addEventListener('visibilitychange', this.wake);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    this.layout();
    this.camera.position.copy(this.desiredPosition); this.controls.target.copy(this.desiredTarget); this.controls.update();
    this.wake();
  }

  backdrop() {
    const bg = canvasTexture(1280, 800), g = bg.ctx.createRadialGradient(704, 440, 0, 704, 440, 900);
    g.addColorStop(0, '#303432'); g.addColorStop(0.5, '#1b1e1d'); g.addColorStop(1, '#0c0e0e');
    bg.ctx.fillStyle = g; bg.ctx.fillRect(0, 0, 1280, 800);
    const pixels = bg.ctx.getImageData(0, 0, 1280, 800);
    for (let i = 0; i < pixels.data.length; i += 4) { const n = (Math.random() - 0.5) * 3; pixels.data[i] += n; pixels.data[i + 1] += n; pixels.data[i + 2] += n; }
    bg.ctx.putImageData(pixels, 0, 0); bg.texture.needsUpdate = true;
    this.scene.background = bg.texture;
  }

  part(id: PartId) {
    const info = PARTS.find(p => p.id === id)!;
    const group = new THREE.Group(); group.name = info.name;
    const label = document.createElement('div');
    label.className = 'part-label';
    label.innerHTML = `<div class="stem"></div><div class="label-card"><div class="label-title"><span>${String(PARTS.indexOf(info) + 1).padStart(2, '0')}</span>${info.name}</div></div>`;
    const side = (['gantry', 'zaxis', 'connector', 'tester'] as PartId[]).includes(id) ? 1 : -1;
    label.classList.add(side > 0 ? 'right' : 'left');
    this.hud?.labels.append(label);
    const offsets: Record<PartId, number[]> = { socket: [0, 0, 8], connector: [0, 0, 22], gripper: [0, 0, 36], zaxis: [0, 0, 52], carriage: [0, 0, 66], gantry: [0, 0, 74], tester: [22, -14, 6] };
    this.parts.set(id, { ...info, group, offset: new THREE.Vector3(...offsets[id]), anchor: new THREE.Vector3(), side, label });
    return group;
  }
  shell(mesh: THREE.Mesh) {
    mesh.material = (mesh.material as THREE.Material).clone(); this.shells.push(mesh); return mesh;
  }

  buildGround() {
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.ShadowMaterial({ opacity: 0.18 }));
    floor.position.z = -10.4; floor.receiveShadow = true; this.scene.add(floor);
    const shadow = canvasTexture(128, 128), g = shadow.ctx.createRadialGradient(64, 64, 10, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(.55, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    shadow.ctx.fillStyle = g; shadow.ctx.fillRect(0, 0, 128, 128); shadow.texture.needsUpdate = true;
    const contact = new THREE.Mesh(new THREE.PlaneGeometry(170, 135), new THREE.MeshBasicMaterial({ map: shadow.texture, transparent: true, depthWrite: false, opacity: 0.7 }));
    contact.position.z = -10.3; this.scene.add(contact);
  }

  buildTable() {
    const t = this.cell;
    box(t, 'Machine table', [112, 86, 5], [0, 0, -3.2], M.base, 1.6);
    box(t, 'Table edge', [110.6, 84.6, 0.55], [0, 0, -0.55], M.edge, 1.2);
    box(t, 'Table top', [109.2, 83.2, 0.8], [0, 0, -0.1], M.base, 0.2);
    box(t, 'Table underside', [110, 84, 0.5], [0, 0, -5.9], M.dark, 0.6);
    box(t, 'Front edge inset', [104, 0.4, 1.2], [0, -43.05, -3.6], M.dark, 0.08);
    for (const x of [-48, 48]) for (const y of [-34, 34]) {
      cylinder(t, 4.2, 3.6, [x, y, -7.9], M.rubber); cylinder(t, 3.1, 1, [x, y, -10], M.dark);
    }
    for (const x of [-52, 52]) for (const y of [-39, 39]) screw(t, x, y, 0.5);
    for (let x = -50; x <= 50; x += 10) for (let y = -35; y <= 35; y += 10) {
      if ((Math.abs(x) < 36 && Math.abs(y) < 30) || (Math.abs(Math.abs(x) - 27) < 9 && y > 5) || (y < -30 && x < 25) || (x > 36 && y < -12) || (x > 36 && y > 22)) continue;
      cylinder(t, 0.9, 0.12, [x, y, 0.32], M.dark, 12);
    }
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(56, 6.3), new THREE.MeshBasicMaterial({ map: this.plate.texture, toneMapped: false }));
    plate.position.set(-8, -36.6, 0.34); t.add(plate);
    for (let i = 0; i < 16; i++) box(t, 'Scale mark', [0.18, 0.8 + (i % 4) * 0.35, 0.1], [-50 + i * 0.9, -36.6, 0.34], M.edge, 0);
  }

  drawPlate() {
    const c = this.plate.ctx, w = 1536, h = 172;
    c.fillStyle = '#20252b'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#4d545c'; c.lineWidth = 3; c.strokeRect(3, 3, w - 6, h - 6);
    print(c, 'DEFEX', 44, 80, 46, '#e4e2d8', 700);
    print(c, '·  connector lab  ·  insert  ·  test  ·  reset', 250, 80, 38, '#b8bdc1', 450);
    print(c, 'SELF-TEACHING ROBOTS FOR MANUFACTURING   /   SIMULATION', 46, 134, 21, '#737e88', 500, MONO);
    print(c, 'No. 001', 1350, 132, 26, '#ff7a1a', 500, MONO);
    this.plate.texture.needsUpdate = true;
  }

  buildGantry() {
    const g = this.part('gantry'); this.cell.add(g);
    for (const x of [-27, 27]) {
      box(g, 'Gantry upright', [6, 7, 65], [x, 17, 36.5], M.silver, 0.18);
      box(g, 'Upright face', [0.2, 2.2, 59], [x - Math.sign(x) * 3.02, 17, 36.5], M.dark, 0.03);
      for (const y of [13.45, 20.55]) {
        box(g, 'Extrusion channel', [2.1, 0.18, 59], [x, y, 36.5], M.dark, 0);
        for (const dx of [-1.05, 1.05]) box(g, 'Channel lip', [.24, .32, 59], [x + dx, y, 36.5], M.edge, .04);
      }
      for (const zz of [14, 62]) {
        const bolt = new THREE.Group(); bolt.position.set(x, 13.3, zz); bolt.rotation.x = Math.PI / 2; g.add(bolt); screw(bolt, 0, 0, 0);
      }
      box(g, 'Gantry foot', [11, 12, 5], [x, 17, 6.5], M.body, 0.6);
      box(g, 'Foot plate', [13, 14, 0.8], [x, 17, 0.6], M.edge, 0.3);
      for (const dx of [-4.2, 4.2]) screw(g, x + dx, 12.2, 9.2);
      box(g, 'Corner bracket', [6.4, 7.4, 6], [x, 17, 64.2], M.edge, 0.4);
    }
    this.shell(box(g, 'Cross rail', [64, 9, 8], [0, 17, 69], M.body, 0.25));
    box(g, 'Belt', [54, 0.8, 4.4], [0, 17, 69], M.dark, 0);
    for (const x of [-27, 27]) cylinder(g, 2.2, 5, [x, 17, 69], M.edge, 20);
    box(g, 'Linear track', [55, 1.2, 2.2], [0, 11.9, 69.1], M.dark, 0.1);
    for (let i = 0; i < 18; i++) box(g, 'Track bolt', [0.5, 0.2, 0.5], [-26 + i * 3.06, 11.25, 69.1], M.silver, 0);
    this.shell(box(g, 'Drive cover', [15, 12, 13], [-26, 17, 69], M.body, 1));
    box(g, 'Drive label', [5, 0.12, 2.3], [-26, 10.93, 69], M.silver, 0.05);
    cylinder(g, 4.2, 9, [-38, 17, 69], M.dark, 28, 'x');
    cylinder(g, 4.5, 1.2, [-42.8, 17, 69], M.silver, 28, 'x');
    for (let i = 0; i < 17; i++) box(g, 'Cable chain link', [2.6, 4.2, 2.2], [-22 + i * 2.75, 19, 74.2], i % 2 ? M.dark : M.base, 0.3);
    cable(g, [[-26, 22, 75], [-32, 24, 70], [-34, 24, 40], [-30, 24, 6]], 0x1a1f24, 0.7);
  }

  buildTool() {
    const carriage = this.part('carriage'), z = this.part('zaxis');
    this.cell.add(this.carriage); this.carriage.add(carriage, this.ySlide); this.ySlide.add(z);
    box(carriage, 'X carriage', [13, 10, 11], [0, 16, 66.5], M.body, 0.6);
    box(carriage, 'Carriage plate', [13.4, 0.6, 9], [0, 10.8, 66.5], M.edge, 0.2);
    for (const x of [-4.5, 4.5]) for (const zz of [63, 70]) { const bolt = new THREE.Group(); bolt.position.set(x, 10.4, zz); bolt.rotation.x = Math.PI / 2; carriage.add(bolt); screw(bolt, 0, 0, 0); }
    box(carriage, 'Y slide', [10, 25, 5], [0, 6, 63], M.silver, 0.4);
    box(carriage, 'Y rail', [3, 22, 0.8], [0, 6, 65.8], M.dark, 0.1);
    box(z, 'Y bearing block', [10, 9, 3], [0, 6, 66], M.body, 0.35);
    this.shell(box(z, 'Z axis housing', [10, 5, 43], [0, 8, 48.5], M.body, 0.5));
    for (const x of [-3.4, 3.4]) {
      box(z, 'Z linear guide', [1.4, 1.4, 39], [x, 4.8, 48.5], M.silver, 0.12);
      for (const height of [31, 42, 54, 66]) cylinder(z, .42, .35, [x, 4.8, height], M.dark, 12, 'x');
    }
    z.add(this.screwRotor); this.screwRotor.position.set(0, 6, 48.5);
    cylinder(this.screwRotor, .8, 39, [0, 0, 0], M.silver, 20);
    const helix: THREE.Vector3[] = [];
    for (let i = 0; i <= 520; i++) {
      const a = i / 20 * Math.PI * 2;
      helix.push(new THREE.Vector3(Math.cos(a) * .9, Math.sin(a) * .9, -19.5 + i / 520 * 39));
    }
    line(this.screwRotor, helix, 0x3b4146);
    cylinder(z, 3.1, 7, [0, 6, 74], M.dark, 28);
    cylinder(z, 3.3, .7, [0, 6, 78], M.silver, 28);
    box(z, 'Z drive end bearing', [10, 6, 2.8], [0, 7, 69.2], M.silver, .35);
    box(z, 'Z lower end bearing', [10, 6, 2], [0, 7, 27], M.silver, .25);
    box(z, 'Drive ID', [3, .12, 1.4], [0, 5.45, 65], M.silver, .05);

    const grip = this.part('gripper'), connector = this.part('connector');
    this.cell.add(this.tool); this.tool.add(grip, connector); connector.add(this.plug);
    box(grip, 'Tool flange', [10, 11, 4], [0, 0, 18], M.silver, 0.5);
    box(grip, 'Parallel gripper', [16, 12, 6], [0, 0, 13], M.body, 0.6);
    box(grip, 'Gripper rail', [15, 1.2, 1], [0, -6.1, 13.5], M.dark, 0.1);
    for (const x of [-7.1, 7.1]) {
      box(grip, 'Gripper finger', [2.4, 5.2, 7], [x, 0, 12], M.silver, 0.3);
      box(grip, 'Soft jaw insert', [0.8, 4.5, 3], [x - Math.sign(x) * 1.2, 0, 9.8], M.rubber, 0.2);
      screw(grip, x, -2.6, 13.5);
    }
    box(grip, 'Z moving saddle', [10.6, 3.3, 8], [0, 3.2, 19.5], M.edge, .25);
    box(grip, 'Saddle bracket', [10.6, 8, 2], [0, 1.2, 21], M.silver, .25);
    for (const x of [-3.4, 3.4]) box(grip, 'Linear bearing shoe', [2.1, 2.7, 6], [x, 4, 19.5], M.dark, .2);
    cylinder(grip, 3.7, 1.4, [0, 0, 15.6], M.edge);
    box(grip, 'Harness strain relief', [5.5, 2, 3], [0, 6, 15.5], M.rubber, .3);
    cylinder(grip, 1, 2.4, [8, 4, 17], M.edge, 16, 'x');
  }

  buildTester() {
    const f = this.fixture, tester = this.part('tester'), socket = this.part('socket');
    this.cell.add(f, tester, socket); socket.add(this.socket);
    box(f, 'Aluminium fixture', [62, 48, 4], [0, 0, 2], M.silver, 0.7);
    box(f, 'Fixture footing', [59, 45, 1.2], [0, 0, 0.7], M.body, 0.4);
    for (const x of [-26, 26]) for (const y of [-19, 19]) screw(f, x, y, 4.25);
    for (const x of [-22, -16, 16]) for (const y of [-12, -6, 0, 6, 12]) cylinder(f, 0.52, 0.12, [x, y, 4.1], M.dark, 12);
    box(f, 'Socket carrier', [29, 23, 4.5], [0, 0, 6.25], M.body, 0.4);
    for (const x of [-12, 12]) for (const y of [-9, 9]) screw(f, x, y, 8.5);
    line(f, [new THREE.Vector3(-8, -19, 4.1), new THREE.Vector3(8, -19, 4.1)], 0x8a949c, 0.7);
    for (let x = -8; x <= 8; x += 2) line(f, [new THREE.Vector3(x, -19, 4.1), new THREE.Vector3(x, -20, 4.1)], 0x8a949c, 0.7);

    box(tester, 'Test module', [8, 17, 7], [22, -5, 7.5], M.body, 0.6);
    box(tester, 'Indicator window', [4, 7, 0.2], [22, -5, 11.1], M.dark, 0.2);
    cylinder(tester, 0.8, 0.3, [22, -3.5, 11.25], this.ledMaterial);
    for (const x of [-3, 0, 3]) cable(tester, [[x, 7, 9], [x, 12, 8], [15, 13, 6], [20, 3, 7]], 0x2a3036, 0.3);
    cable(tester, [[26, -5, 6], [34, -8, 3], [40, -18, 1.2], [46, -24, 3]], 0x1a1f24, 0.45);
    const hmi = new THREE.Group(); hmi.position.set(45, -27, 0); hmi.rotation.z = 0.67; tester.add(hmi);
    cylinder(hmi, 3.4, 1.2, [0, 0, 0.9], M.body, 28);
    cylinder(hmi, 1, 15, [0, 3, 8.5], M.silver, 16);
    const head = new THREE.Group(); head.position.set(0, 3, 22); head.rotation.x = -0.24; hmi.add(head);
    box(head, 'Screen bezel', [27, 1.8, 18.4], [0, 0.4, 0], M.dark, 0.7);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(25, 16.4), new THREE.MeshBasicMaterial({ map: this.hmi.texture, toneMapped: false }));
    screen.rotation.x = Math.PI / 2; screen.position.y = -0.55; head.add(screen);

    const tower = new THREE.Group(); tower.position.set(44, 30, 0); tester.add(tower);
    cylinder(tower, 2.6, 2, [0, 0, 1.1], M.body, 28);
    cylinder(tower, 0.9, 24, [0, 0, 14], M.silver, 16);
    [2, 1, 0].forEach((i, k) => {
      cylinder(tower, 2.5, 4, [0, 0, 28.3 + k * 4.4], this.stack[i], 28);
      cylinder(tower, 2.7, 0.4, [0, 0, 26.1 + k * 4.4], M.edge, 28);
    });
    cylinder(tower, 2.7, 1.2, [0, 0, 41], M.dark, 28);
    this.stack.forEach(m => { m.toneMapped = false; });
  }

  drawHmi() {
    const c = this.hmi.ctx, w = 640, h = 420, s = this.state;
    c.fillStyle = '#0f1519'; c.fillRect(0, 0, w, h);
    print(c, 'DEFEX · CONNECTOR LAB', 30, 48, 20, '#8e9aa0', 600, MONO);
    c.fillStyle = s && s.phase !== 'ready' && s.phase !== 'complete' ? '#ff7a1a' : '#4a555c'; c.beginPath(); c.arc(600, 41, 7, 0, Math.PI * 2); c.fill();
    const phaseName: Record<string, string> = { ready: 'READY', approach: 'INSERT', insert: 'INSERT', backoff: 'BLOCKED', move: 'NEW TRY', electrical: 'CONNECTION', retention: 'PULL TEST', reset: 'RESET', complete: 'DONE' };
    const done = s?.phase === 'complete', label = done ? (s!.accepted ? 'PASS' : s!.continuity === false || s!.retention === false ? 'REJECT' : 'STUCK') : phaseName[s?.phase ?? 'ready'];
    print(c, label, 30, 128, 64, done ? (s!.accepted ? '#58d494' : '#ff5a45') : s?.phase === 'backoff' ? '#ff9b5c' : '#f1eee5', 650);
    print(c, `${(s?.force ?? 0).toFixed(1)} N`, 30, 186, 34, '#ff7a1a', 500, MONO);
    print(c, `${(s?.depth ?? 0).toFixed(1)} mm`, 250, 186, 34, '#c9ced2', 500, MONO);
    print(c, `TRY ${s && s.phase !== 'ready' ? Math.max(1, s.probes) : 0}`, 470, 186, 34, '#c9ced2', 500, MONO);
    const row = (name: string, value: boolean | null, y: number) => {
      c.fillStyle = '#1b252b'; c.beginPath(); c.roundRect(24, y, 592, 64, 10); c.fill();
      print(c, name, 46, y + 42, 26, '#b9c2c4', 500);
      const text = value === true ? 'PASS' : value === false ? 'FAIL' : '—';
      print(c, text, 480, y + 42, 28, value === true ? '#58d494' : value === false ? '#ff5a45' : '#5b676d', 650, MONO);
    };
    row('Connection', s?.continuity ?? null, 222);
    row('Lock', s?.retention ?? null, 298);
    c.fillStyle = '#26323a'; c.fillRect(24, 390, 592, 6);
    const order = ['ready', 'approach', 'electrical', 'retention', 'reset', 'complete'];
    const k = Math.max(0, order.indexOf(s?.phase === 'insert' || s?.phase === 'backoff' || s?.phase === 'move' ? 'approach' : s?.phase ?? 'ready'));
    c.fillStyle = '#ff7a1a'; c.fillRect(24, 390, 592 * k / 5, 6);
    this.hmi.texture.needsUpdate = true;
  }

  buildConnector() {
    const remove = (group: THREE.Group) => { for (const child of [...group.children]) { child.traverse(o => { if (o instanceof THREE.Mesh && !cachedSet.has(o.geometry)) o.geometry.dispose(); }); group.remove(child); } };
    remove(this.socket); remove(this.plug); this.socketCover = []; this.plugCover = [];
    this.connectorMaterials.forEach(material => material.dispose()); this.connectorMaterials.clear();
    const d = dimensions(this.config.variant), sx = d.socketX * 1000, sy = d.socketY * 1000;
    const socketBody = new THREE.Mesh(cached(`socket-${d.pins}`, () => socketHousing(sx, sy)), M.dark.clone());
    socketBody.name = 'Molded socket housing'; socketBody.position.z = 10.2; socketBody.castShadow = true; socketBody.receiveShadow = true;
    this.socket.add(socketBody); this.socketCover.push(socketBody);
    box(this.socket, 'Socket floor', [sx * 2 + 8, sy * 2 + 8, 4], [0, 0, 9], M.dark, 0.2);
    box(this.socket, 'Polarizing key', [2.4, .8, 2.8], [0, -sy - 4, 18.4], M.dark, .12);
    for (const x of [-sx - 3.9, sx + 3.9]) for (const y of [-sy + 1, 0, sy - 1]) box(this.socket, 'Socket molding rib', [.65, .7, 9.2], [x, y, 16], M.dark, .1);
    box(this.socket, 'Mold parting line', [sx * 2 + 7.9, .08, .12], [0, -sy - 3.8, 12], M.body, 0);
    for (const [i, [x, y]] of contactCenters(d.pins).entries()) {
      cylinder(this.socket, 0.37, 5, [x, y, 13], M.gold, 16);
      const sleeve = new THREE.Mesh(cached('female-contact', () => {
        const section = new THREE.Shape(); section.absarc(0, 0, .56, 0, Math.PI * 2, false);
        const hole = new THREE.Path(); hole.absarc(0, 0, .39, 0, Math.PI * 2, true); section.holes.push(hole);
        return new THREE.ExtrudeGeometry(section, { depth: 4.2, bevelEnabled: false, curveSegments: 12 });
      }), M.gold);
      sleeve.name = 'Female crimp contact'; sleeve.position.set(x, y, -4.05); this.plug.add(sleeve);
      cylinder(this.plug, .39, .05, [x, y, .12], M.dark, 16);
      cylinder(this.plug, 0.7, 0.3, [x, y, 4.3], M.body, 16);
      cable(this.plug, [[x, y, 4.4], [x, y + 3, 7], [x * .7, 7.8, 10], [x * .5, 8, 13.5], [x * .35, 6, 15.5]], i % 3 === 0 ? 0xb35725 : i % 3 === 1 ? 0x343b40 : 0xbcb8a7, 0.24);
    }
    const housing = M.ivory.clone();
    const plugBody = new THREE.Mesh(cached(`plug-${d.pins}`, () => plugHousing(d.halfX * 1000, d.halfY * 1000, d.pins)), housing);
    plugBody.name = 'Molded connector with contact bores'; plugBody.position.z = -3.9; plugBody.castShadow = true; plugBody.receiveShadow = true;
    this.plug.add(plugBody); this.plugCover.push(plugBody);
    box(this.plug, 'Grasp bridge', [11.2, 1.5, 6.5], [0, 0, 7.25], M.ivory, 0.25);
    for (const x of [-d.halfX * 1000 + .6, d.halfX * 1000 - .6]) box(this.plug, 'Mold rib', [.5, .55, 6], [x, -d.halfY * 1000 - .1, 0], M.ivory, .14);
    this.latchParts = [box(this.plug, 'Latch tab', [2, .7, 5], [0, -d.halfY * 1000 - .45, -.3], M.ivory, .15), box(this.plug, 'Latch hook', [2.3, 1, 1], [0, -d.halfY * 1000 - .55, -2.6], M.ivory, .2)].map(mesh => ({ mesh, y: mesh.position.y }));
    for (const group of [this.socket, this.plug]) group.traverse(object => {
      if (object instanceof THREE.Mesh) for (const m of [object.material].flat()) if (!shared.has(m)) this.connectorMaterials.add(m);
    });
    this.socket.position.set(this.config.offsetX, this.config.offsetY, 0); this.socket.rotation.z = this.config.yaw * Math.PI / 180;
    this.tagParts(); this.applyCut(true);
    this.latchParts.forEach(({mesh}) => { mesh.visible = this.config.fault !== 'latch'; });
    batchStaticMeshes(this.socket, new Set(this.socketCover));
    batchStaticMeshes(this.plug, new Set([...this.plugCover, ...this.latchParts.map(p => p.mesh)])); this.tagParts();
    this.lastVariant = this.config.variant;
  }

  tagParts() {
    for (const p of this.parts.values()) p.group.traverse(o => { o.userData.part = p.id; });
  }
  measureAnchors() {
    const anchors: Record<PartId, [number, number, number]> = {
      gantry: [27, 13, 63], carriage: [-5, 10, 67], zaxis: [4, 4, 45],
      gripper: [-8, -3, 13], connector: [5, -3, 0], socket: [-9, -4, 17], tester: [47, -27, 23],
    };
    for (const p of this.parts.values()) p.anchor.set(...anchors[p.id]);
  }

  configure(config: Configuration) {
    this.config = config;
    if (this.lastVariant !== config.variant) this.buildConnector();
    this.socket.position.set(config.offsetX, config.offsetY, 0); this.socket.rotation.z = config.yaw * Math.PI / 180;
    this.latchParts.forEach(({mesh}) => { mesh.visible = config.fault !== 'latch'; });
    this.measureAnchors();
    this.renderer.shadowMap.needsUpdate = true;
    this.wake();
  }
  applyCut(force = false) {
    const on = this.cut > 0.5, opacity = 1 - this.cut * 0.84;
    for (const mesh of [...this.socketCover, ...this.plugCover, ...this.shells]) {
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (force || m.transparent !== this.cut > 0.01) { m.transparent = this.cut > 0.01; m.needsUpdate = true; }
      m.opacity = opacity; m.depthWrite = !on; mesh.castShadow = !on;
    }
  }
  setMode(mode: Mode) {
    this.mode = mode; this.lastInteraction = performance.now();
    this.trail.visible = mode === 'inside';
    if (this.viewMode !== 'part' && this.viewMode !== 'connector') this.goal();
    this.startTween(); this.wake();
  }
  setInspect(on: boolean) { this.setMode(on ? 'inside' : 'machine'); }
  view(mode: View | 'cell' | 'close') {
    this.direct(false);
    const next = mode === 'cell' ? 'overview' : mode === 'close' ? 'connector' : mode;
    if (this.viewMode === 'flight' && next === 'overview') {
      const b = this.camera.position.clone().sub(this.controls.target).setZ(0).normalize(), flat = Math.hypot(this.direction.x, this.direction.y);
      this.overviewDir = new THREE.Vector3(b.x * flat, b.y * flat, this.direction.z).normalize();
    } else if (next !== 'overview') this.overviewDir = null;
    if (next === 'overview') this.overviewDir = null;
    this.viewMode = next;
    this.lastInteraction = performance.now(); this.flightTime = 0;
    this.goal(); this.startTween();
    if (this.reduceMotion && this.viewMode !== 'flight') this.snap();
    this.wake();
  }
  direct(on: boolean) {
    const next = on && !this.reduceMotion;
    if (next) this.directorHasRun = false;
    if (next && !this.director) { this.viewMode = 'overview'; this.overviewDir = null; this.tween = null; this.dirPos.copy(this.camera.position); this.dirTarget.copy(this.controls.target); }
    if (next !== this.director) { this.director = next; this.hud?.onDirector?.(next); }
    this.wake();
  }
  directorGoal(now: number) {
    const age = (now - this.phaseStart) / 1000, k = Math.max(1, 0.92 / this.camera.aspect), socket = this.socket.getWorldPosition(new THREE.Vector3());
    let az = 0, el = 0.5, dist = this.baseDistance, target = new THREE.Vector3(0, 0, 30);
    if (this.phase === 'approach') { target.set(socket.x, socket.y, 28); dist = (195 - Math.min(1, age / 1.4) * 35) * k; az = -0.18; el = 0.43; }
    else if (['insert', 'backoff', 'move', 'electrical', 'retention'].includes(this.phase)) { target.set(socket.x, socket.y, 25); dist = 155 * k; az = -0.18; el = 0.43; }
    else { this.desiredTarget.copy(target); this.desiredPosition.copy(this.direction).multiplyScalar(dist).add(target); return; }
    if (this.width < 700) target.z -= 5;
    const b = Math.atan2(this.direction.y, this.direction.x) + az;
    this.desiredTarget.copy(target);
    this.desiredPosition.set(Math.cos(b) * Math.cos(el), Math.sin(b) * Math.cos(el), Math.sin(el)).multiplyScalar(dist).add(target);
  }
  focusPart(id: PartId) { this.focus = id; this.view('part'); }
  snap() { this.camera.position.copy(this.desiredPosition); this.controls.target.copy(this.desiredTarget); this.animating = false; this.tween = null; }
  startTween() {
    if (this.viewMode === 'flight' && !this.director && !this.dragging) { this.tween = null; this.animating = false; this.flightBlend = performance.now() + 700; return; }
    this.animating = true; this.autoSpin = 0;
    const from = this.camera.position.clone().sub(this.controls.target), to = this.desiredPosition.clone().sub(this.desiredTarget);
    const turn = from.angleTo(to), zoom = Math.abs(Math.log(to.length() / Math.max(1, from.length())));
    this.tween = { from: this.camera.position.clone(), fromTarget: this.controls.target.clone(), start: performance.now(), duration: this.reduceMotion ? 0 : THREE.MathUtils.clamp(360 + turn * 160 + zoom * 180, 360, 780) };
  }

  goal() {
    const expand = this.mode === 'parts' ? (this.width < 700 ? 1.3 : 1.42) : 1, d = this.baseDistance * expand;
    const lift = this.mode === 'parts' ? 34 : 0;
    if (this.viewMode === 'part' || this.viewMode === 'connector') {
      const p = this.parts.get(this.viewMode === 'connector' ? 'socket' : this.focus)!;
      this.scene.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(p.group), size = bounds.getSize(new THREE.Vector3()).length();
      bounds.getCenter(this.desiredTarget);
      if (this.viewMode === 'connector') this.desiredTarget.set(this.desiredTarget.x, this.desiredTarget.y, 30 + (this.mode === 'parts' ? 8 : 0));
      const fit = Math.max(1, 0.95 / this.camera.aspect);
      const dist = (this.viewMode === 'connector' ? 155 : Math.max(95, size * 2.6)) * fit;
      const dir = this.viewMode === 'connector' ? new THREE.Vector3(0.18, -0.9, 0.5).normalize() : this.direction;
      this.desiredPosition.copy(this.desiredTarget).addScaledVector(dir, Math.min(dist, d));
      return;
    }
    this.desiredTarget.set(0, 0, 30 + lift);
    if (this.viewMode === 'flight') {
      const bearing = this.camera.position.clone().sub(this.controls.target).setZ(0).normalize();
      const flat = Math.hypot(this.direction.x, this.direction.y);
      this.desiredPosition.set(bearing.x * flat, bearing.y * flat, this.direction.z).normalize().multiplyScalar(d).add(this.desiredTarget);
      return;
    }
    const dir = this.viewMode === 'side' ? new THREE.Vector3(1, -0.16, 0.2) : this.viewMode === 'top' ? new THREE.Vector3(0.001, -0.08, 1) : this.overviewDir ?? this.direction;
    this.desiredPosition.copy(dir).normalize().multiplyScalar(this.viewMode === 'top' ? this.baseDistance * (this.mode === 'parts' ? 1.02 : 0.92) : d).add(this.desiredTarget);
  }

  layout() {
    const r = this.container.getBoundingClientRect();
    if (!r.width || !r.height) return;
    this.width = r.width; this.height = r.height;
    this.renderer.setSize(r.width, r.height);
    this.labelWidths.clear();
    this.camera.aspect = r.width / r.height;
    const wide = r.width > 1100 && !this.embed;
    this.shift = wide ? -r.width * 0.095 : 0;
    this.camera.setViewOffset(r.width, r.height, this.shift, r.width > 900 ? r.height * 0.025 : -r.height * 0.025, r.width, r.height);
    this.camera.updateProjectionMatrix();
    const t = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)), radius = 70;
    const usableW = r.width > 900 ? 0.78 : 0.94, usableH = r.width > 900 ? 0.83 : 0.62;
    this.baseDistance = Math.max(radius / (t * this.camera.aspect * usableW), radius / (t * usableH));
    this.controls.maxDistance = Math.max(600, this.baseDistance * 2.5);
    this.goal();
    if (this.frames || this.measured) this.startTween(); else this.snap();
    this.wake();
  }

  update(state: Snapshot, samples: Sample[], epoch: number, playing = false, speed = 1) {
    this.playing = playing; this.playbackSpeed = speed;
    if (this.director && playing && state.phase !== 'ready' && state.phase !== 'complete') this.directorHasRun = true;
    const now0 = this.visualTime;
    if (state.phase !== this.phase) { this.phase = state.phase; this.phaseStart = now0; }
    if (state.latchEngaged && !this.latched) this.clickAt = now0;
    this.latched = state.latchEngaged;
    this.state = state;
    if (epoch !== this.poses.epoch) { this.trailStart = -1; this.trailCount = 0; }
    this.poses.push(state.pose, performance.now(), epoch);
    const c = state.accepted === true ? 0x4fd08a : state.accepted === false ? 0xff4b3a : state.phase === 'electrical' ? 0xffc04a : 0x8a918b;
    this.ledMaterial.color.setHex(c); this.ledMaterial.emissive.setHex(c);
    const count = Math.min(500, Math.ceil(samples.length / 3)), start = samples[0]?.t ?? -1;
    const from = start === this.trailStart ? this.trailCount : 0;
    for (let i = from; i < count; i++) { const p = samples[i * 3]; this.trailPositions.set([p.x * 1000, p.y * 1000, p.z * 1000], i * 3); }
    this.trailStart = start; this.trailCount = count;
    if (count !== from) this.trail.geometry.attributes.position.needsUpdate = true;
    this.trail.geometry.setDrawRange(0, count > 1 ? count : 0);
    const now = performance.now();
    if (now - this.lastHmi > 90 || !playing || state.phase === 'ready' || state.phase === 'complete') { this.lastHmi = now; this.drawHmi(); }
    this.wake();
  }

  onPointerMove = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; this.pointerMoved = true;
    if (Math.hypot(this.pointer.x - this.down.x, this.pointer.y - this.down.y) > 5) this.down.moved = true;
    this.wake();
  };
  onPointerLeave = () => { this.pointer = null; this.setHover(null); };
  onPointerDown = (e: PointerEvent) => {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.down = { x: e.clientX - r.left, y: e.clientY - r.top, moved: false, pointerId: e.pointerId };
    this.hud?.tooltip.classList.remove('visible');
  };
  onPointerUp = (e: PointerEvent) => {
    if (this.down.pointerId !== e.pointerId) return;
    this.down.pointerId = null;
    const r = this.renderer.domElement.getBoundingClientRect();
    if (this.down.moved || Math.hypot(e.clientX - r.left - this.down.x, e.clientY - r.top - this.down.y) > 5) return;
    const id = this.pick(e.clientX - r.left, e.clientY - r.top);
    if (!id) return;
    this.focusPart(id); this.hud?.onPick?.(id);
  };
  onPointerCancel = () => { this.down.pointerId = null; };
  pick(x: number, y: number): PartId | null {
    this.raycaster.setFromCamera(new THREE.Vector2(x / this.width * 2 - 1, -y / this.height * 2 + 1), this.camera);
    const hit = this.raycaster.intersectObjects([...this.parts.values()].map(p => p.group), true).find(h => h.object.visible && (h.object as THREE.Mesh).isMesh && (((h.object as THREE.Mesh).material as THREE.Material).opacity ?? 1) > 0.5);
    return (hit?.object.userData.part as PartId) ?? null;
  }
  setHover(id: PartId | null) {
    this.hovered = id;
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
    const tip = this.hud?.tooltip; if (!tip) return;
    tip.classList.toggle('visible', !!id);
    if (!id || !this.pointer) return;
    const p = this.parts.get(id)!;
    tip.querySelector('strong')!.innerHTML = `<span>${String(PARTS.findIndex(x => x.id === id) + 1).padStart(2, '0')}</span>${p.name}`;
    tip.querySelector('p')!.textContent = p.line;
    tip.style.transform = `translate(${Math.min(this.width - 250, Math.max(10, this.pointer.x + 18))}px,${Math.max(10, Math.min(this.height - 100, this.pointer.y - 70))}px)`;
  }

  wake = () => {
    if (!this.disposed && !this.frame && !this.rendering && this.visible && !document.hidden) { this.lastFrame = performance.now(); this.frame = requestAnimationFrame(this.animate); }
  };
  animate = (now: number) => {
    this.frame = 0;
    if (!this.visible || document.hidden) return;
    this.rendering = true;
    const elapsed = Math.max(1, now - this.lastFrame);
    const dt = Math.min(50, elapsed); this.lastFrame = now;
    if (this.playing) this.visualTime += dt * this.playbackSpeed;
    const spreadGoal = this.mode === 'parts' ? 1 : 0, cutGoal = this.mode === 'inside' ? 1 : 0;
    const moving = this.spread !== spreadGoal || this.cut !== cutGoal;
    this.spread = step(this.spread, spreadGoal, dt / 800);
    const cutBefore = this.cut;
    this.cut = step(this.cut, cutGoal, dt / 300);
    if (cutBefore !== this.cut) this.applyCut();
    if (moving) {
      EXPLODE_ORDER.forEach((id, k) => {
        const local = THREE.MathUtils.clamp((this.spread - k * 0.07) / (1 - 0.42), 0, 1);
        this.parts.get(id)!.group.position.copy(this.parts.get(id)!.offset).multiplyScalar(ease(local));
      });
      this.renderer.shadowMap.needsUpdate = true;
    }
    const pose = this.poses.sample(now);
    if (pose) {
      this.tool.position.set(pose[0] * 1000, pose[1] * 1000, pose[2] * 1000); this.tool.rotation.z = pose[3];
      this.carriage.position.set(pose[0] * 1000, 0, 0); this.ySlide.position.y = pose[1] * 1000;
      const key = pose.map(v => v.toFixed(6)).join();
      if (key !== this.shadowPose) {
        this.shadowPose = key; this.renderer.shadowMap.needsUpdate = true;
        this.serviceLoop.update(pose[0] * 1000, pose[1] * 1000, pose[2] * 1000);
        this.screwRotor.rotation.z = (42 - pose[2] * 1000) / 1.5 * Math.PI * 2;
      }
    }
    this.serviceLoop.mesh.visible = this.spread < .01;
    this.trail.position.z = this.parts.get('connector')!.group.position.z;
    const running = !!this.state && this.state.phase !== 'ready' && this.state.phase !== 'complete';
    const accepted = this.state?.accepted;
    const blink = 0.5 - 0.5 * Math.cos(this.visualTime / 260);
    this.stack[0].emissiveIntensity = accepted === true ? 1.2 : !running ? 0.22 : 0.025;
    this.stack[1].emissiveIntensity = running && accepted == null ? 0.5 + blink * .3 : 0.025;
    this.stack[2].emissiveIntensity = accepted === false ? 1.2 : 0.025;

    if (moving && this.viewMode === 'part') this.goal();
    const paused = running && !this.playing;
    if (this.director && !this.dragging && !paused) {
      this.tween = null;
      this.directorGoal(this.visualTime);
      const a = damping(dt, 180);
      const fromOff = this.dirPos.clone().sub(this.dirTarget), toOff = this.desiredPosition.clone().sub(this.desiredTarget);
      this.dirTarget.lerp(this.desiredTarget, a); orbitBlend(fromOff, toOff, a, this.dirPos); this.dirPos.add(this.dirTarget);
      this.camera.position.lerp(this.dirPos, a); this.controls.target.lerp(this.dirTarget, a);
      if (this.phase === 'complete' && this.directorHasRun) { this.direct(false); this.viewMode = 'overview'; this.goal(); this.startTween(); }
    }
    if (this.tween && !this.dragging) {
      const k = this.tween.duration ? Math.min(1, (now - this.tween.start) / this.tween.duration) : 1, e = ease(k);
      this.controls.target.lerpVectors(this.tween.fromTarget, this.desiredTarget, e);
      orbitBlend(this.tween.from.clone().sub(this.tween.fromTarget), this.desiredPosition.clone().sub(this.desiredTarget), e, this.camera.position);
      this.camera.position.add(this.controls.target);
      if (k >= 1) { this.tween = null; this.animating = false; }
    }
    if (this.viewMode === 'flight' && !this.director && !this.dragging && now < this.flightBlend) {
      this.goal();
      const a = damping(dt, 180), off = this.camera.position.clone().sub(this.controls.target);
      this.controls.target.lerp(this.desiredTarget, a);
      off.lerp(this.desiredPosition.clone().sub(this.desiredTarget), a);
      this.camera.position.copy(this.controls.target).add(off);
    }
    const flying = this.viewMode === 'flight' && !this.dragging && !this.tween && !this.director;
    this.autoSpin = flying ? Math.min(1, this.autoSpin + dt / 600) : 0;
    this.controls.autoRotate = this.autoSpin > 0;
    this.controls.autoRotateSpeed = (flying ? (this.reduceMotion ? 0.6 : 1.6) : 0.3) * ease(this.autoSpin);
    this.controls.dampingFactor = damping(dt, 170);
    const orbitChanged = this.controls.update(dt / 1000);

    if (this.pointerMoved && !this.dragging && this.pointer) { this.pointerMoved = false; this.setHover(this.pick(this.pointer.x, this.pointer.y)); }
    if (now - this.lastLabels > 40 || !this.playing) { this.placeLabels(); this.lastLabels = now; }
    this.animateLatch(this.visualTime, this.playing ? dt * this.playbackSpeed : 0);
    const renderStarted = performance.now();
    this.renderer.info.autoReset = false; this.renderer.info.reset();
    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    this.renderCost += performance.now() - renderStarted;
    this.stats.record(now, performance.now() - renderStarted, this.renderer);
    this.afterRender?.();
    this.rendering = false;
    if (this.state) { this.frames++; this.measured += elapsed; }
    if (this.measured > 4000) {
      // A background tab can be capped at 30 Hz even with cheap frames. Preserve detail in that case.
      const expensive = this.stats.gpuMs > 18 || this.renderCost / Math.max(1, this.frames) > 12;
      this.slow = expensive && this.frames / (this.measured / 1000) < 45 ? this.slow + 1 : 0;
      if (this.slow >= 2 && this.pixelRatio > 1.5) { this.pixelRatio = Math.max(1.5, this.pixelRatio - 0.25); this.renderer.setPixelRatio(this.pixelRatio); this.renderer.setSize(this.width, this.height); this.slow = 0; }
      this.frames = 0; this.measured = 0; this.renderCost = 0;
    }
    if (!this.frame && (this.playing || moving || this.tween || (this.director && !paused) || flying || this.dragging || orbitChanged || this.poses.pending(now))) this.frame = requestAnimationFrame(this.animate);
  };

  animateLatch(now: number, dt: number) {
    const depth = this.state?.depth ?? 0, since = now - this.clickAt;
    if (this.latched && since < 700) this.flex = Math.exp(-since / 90) * Math.cos(since / 26);
    else this.flex += ((depth > 0.4 && !this.latched ? 1 : 0) - this.flex) * damping(dt, 60);
    for (const { mesh, y } of this.latchParts) mesh.position.y = y + 0.22 * this.flex;
  }

  placeLabels() {
    if (!this.hud) return;
    const show = this.spread > .6, point = new THREE.Vector3();
    const placed: { p: Part; x: number; y: number; anchorX: number; anchorY: number }[] = [];
    this.cell.updateMatrixWorld(true);
    for (const p of this.parts.values()) {
      p.label.classList.toggle('visible', show);
      if (!show) continue;
      point.copy(p.anchor).applyMatrix4(p.group.matrixWorld).project(this.camera);
      const anchorX = (point.x * .5 + .5) * this.width, anchorY = (-point.y * .5 + .5) * this.height;
      if (point.z < -1 || point.z > 1 || anchorX < 0 || anchorX > this.width || anchorY < 0 || anchorY > this.height) { p.label.classList.remove('visible'); continue; }
      let width = this.labelWidths.get(p.id);
      if (!width) { width = p.label.offsetWidth; this.labelWidths.set(p.id, width); }
      const x = p.side > 0 ? Math.min(anchorX + 28, this.width - width - 12) : Math.max(anchorX - 28, width + 12);
      placed.push({ p, x, y: anchorY, anchorX, anchorY });
    }
    const gap = this.width < 700 ? 32 : 40, top = 106, bottom = this.height - 160;
    for (const side of [1, -1]) {
      const column = placed.filter(l => l.p.side === side).sort((a, b) => a.y - b.y);
      column.forEach((l, i) => { l.y = Math.max(l.y, top, i ? column[i - 1].y + gap : top); });
      for (let i = column.length - 1; i >= 0; i--) column[i].y = Math.min(column[i].y, bottom - (column.length - 1 - i) * gap);
    }
    for (const { p, x, y, anchorX, anchorY } of placed) {
      p.label.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) translate(${p.side > 0 ? '0' : '-100%'},-50%)`;
      const stem = p.label.querySelector<HTMLElement>('.stem')!;
      stem.style.width = `${Math.hypot(anchorX - x, anchorY - y)}px`;
      stem.style.transform = `rotate(${Math.atan2(anchorY - y, anchorX - x)}rad)`;
    }
  }

  dispose() {
    this.stats.dispose();
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    document.removeEventListener('visibilitychange', this.wake);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointermove', this.onPointerMove); canvas.removeEventListener('pointerleave', this.onPointerLeave);
    canvas.removeEventListener('pointerdown', this.onPointerDown); canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointercancel', this.onPointerCancel);
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    this.resizeObserver.disconnect(); this.intersection.disconnect(); this.controls.dispose();
    const materials = new Set<THREE.Material>(), textures = new Set<THREE.Texture>();
    this.scene.traverse(o => {
      if (o instanceof THREE.Mesh || o instanceof THREE.Line || o instanceof THREE.Sprite) {
        if ('geometry' in o && !cachedSet.has(o.geometry)) o.geometry.dispose();
        for (const material of [o.material].flat()) if (!shared.has(material)) materials.add(material);
      }
    });
    materials.forEach(material => {
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      material.dispose();
    });
    textures.forEach(texture => texture.dispose());
    this.scene.environment?.dispose(); if (this.scene.background instanceof THREE.Texture) this.scene.background.dispose();
    this.parts.forEach(part => part.label.remove());
    this.renderer.dispose(); canvas.remove();
  }
}
