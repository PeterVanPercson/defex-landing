import argparse
import math
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--frames", type=int, default=300)
parser.add_argument("--only", type=str, default="")
parser.add_argument("--scale", type=int, default=100)
parser.add_argument("--samples", type=int, default=64)
parser.add_argument("--start", type=int, default=0)
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1:])
args.output.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def material(name, color, metallic=0.0, roughness=.35, coat=0.0, emission=None):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    p = mat.node_tree.nodes.get("Principled BSDF")
    p.inputs["Base Color"].default_value = (*color, 1)
    p.inputs["Metallic"].default_value = metallic
    p.inputs["Roughness"].default_value = roughness
    if coat:
        p.inputs["Coat Weight"].default_value = coat
        p.inputs["Coat Roughness"].default_value = .18
    if emission:
        p.inputs["Emission Color"].default_value = (*emission[0], 1)
        p.inputs["Emission Strength"].default_value = emission[1]
    return mat


paint = material("Robot satin white", (.80, .79, .76), 0, .34, coat=.35)
graphite = material("Graphite anodized", (.028, .031, .035), .65, .33)
black = material("Black oxide", (.012, .014, .016), .5, .3)
rubber = material("Cable jacket", (.016, .017, .018), 0, .55)
alu = material("Bead-blasted aluminium", (.55, .56, .57), .9, .32)
plate = material("Black anodized plate", (.045, .047, .05), .8, .36)
steel = material("Brushed steel", (.70, .71, .72), .95, .2)
orange = material("Defex orange", (.90, .12, .02), .1, .3)
ivory = material("Ivory connector", (.80, .78, .70), 0, .3)
gold = material("Gold contacts", (.85, .55, .2), 1, .22)
pcb = material("Green solder mask", (.006, .05, .022), 0, .3, coat=.6)
silk = material("Silkscreen", (.75, .74, .70), 0, .5)
chip = material("Chip package", (.02, .02, .022), 0, .45)
glass = material("Instrument glass", (.006, .012, .014), .2, .08)
lamp = material("Test lamp", (.2, .2, .2), 0, .3, emission=((.2, .2, .2), .2))
lamp_bsdf = lamp.node_tree.nodes.get("Principled BSDF")
cyc = material("Studio cyclorama", (.52, .49, .44), 0, .92)


def finish(obj, mat, bevel=0.0, segments=3):
    obj.data.materials.append(mat)
    if bevel:
        m = obj.modifiers.new("bevel", "BEVEL")
        m.width = bevel
        m.segments = segments
        m.limit_method = "ANGLE"
    for f in obj.data.polygons:
        f.use_smooth = True
    m = obj.modifiers.new("wn", "WEIGHTED_NORMAL")
    m.keep_sharp = True
    return obj


def box(name, pos, size, mat, bevel=.012, parent=None):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pos)
    o = bpy.context.object
    o.name = name
    o.scale = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    finish(o, mat, bevel)
    if parent:
        o.parent = parent
    return o


def cyl(name, pos, r, depth, mat, axis="Z", bevel=.008, parent=None, verts=96):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=pos)
    o = bpy.context.object
    o.name = name
    if axis == "Y":
        o.rotation_euler.x = math.pi / 2
    elif axis == "X":
        o.rotation_euler.y = math.pi / 2
    finish(o, mat, bevel)
    if parent:
        o.parent = parent
    return o


def ring(name, pos, r, tube, mat, axis="Z", parent=None):
    bpy.ops.mesh.primitive_torus_add(major_radius=r, minor_radius=tube, major_segments=96, minor_segments=12, location=pos)
    o = bpy.context.object
    o.name = name
    if axis == "Y":
        o.rotation_euler.x = math.pi / 2
    elif axis == "X":
        o.rotation_euler.y = math.pi / 2
    finish(o, mat)
    if parent:
        o.parent = parent
    return o


def empty(name, parent=None):
    o = bpy.data.objects.new(name, None)
    scene.collection.objects.link(o)
    if parent:
        o.parent = parent
    return o


def curve(name, mat, radius, n):
    data = bpy.data.curves.new(name, "CURVE")
    data.dimensions = "3D"
    data.bevel_depth = radius
    data.bevel_resolution = 6
    data.resolution_u = 24
    data.use_fill_caps = True
    sp = data.splines.new("BEZIER")
    sp.bezier_points.add(n - 1)
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    data.materials.append(mat)
    return o


def set_curve(o, pts):
    sp = o.data.splines[0]
    for k, p in zip(sp.bezier_points, pts):
        k.co = p
        k.handle_left_type = k.handle_right_type = "AUTO"


# studio: a seamless cyclorama (floor curving up into a back wall)
verts, faces = [], []
prof = []
for i in range(41):
    y = -14 + i * .45
    prof.append((y, 0.0))
R = 4.0
for i in range(1, 25):
    a = (i / 24) * (math.pi / 2)
    prof.append((4.0 + R * math.sin(a), R - R * math.cos(a)))
for i in range(1, 12):
    prof.append((4.0 + R, R + i * 1.2))
W = 30
for j, (y, z) in enumerate(prof):
    verts += [(-W, y, z), (W, y, z)]
    if j:
        a = 2 * (j - 1)
        faces.append((a, a + 1, a + 3, a + 2))
me = bpy.data.meshes.new("cyc")
me.from_pydata(verts, [], faces)
cyclo = bpy.data.objects.new("Cyclorama", me)
scene.collection.objects.link(cyclo)
cyclo.data.materials.append(cyc)
for f in cyclo.data.polygons:
    f.use_smooth = True

# the workcell
Z0 = .34
box("Plinth", (0, 0, .11), (3.5, 2.05, .22), black, .03)
box("Plinth shadow gap", (0, 0, .235), (3.42, 1.97, .03), black, .005)
box("Tooling plate", (0, 0, .295), (3.56, 2.1, .09), plate, .022)
for x in [-1.55 + i * .31 for i in range(11)]:
    for y in [-.85 + j * .34 for j in range(6)]:
        cyl("Tapped hole", (x, y, Z0 - .002), .016, .006, black, bevel=.002, verts=24)

# PCB on its fixture
PX, PY = -.42, -.12
box("Fixture block", (PX, PY, Z0 + .045), (1.06, .78, .09), graphite, .018)
for sx in (-1, 1):
    for sy in (-1, 1):
        cyl("Locating pin", (PX + sx * .46, PY + sy * .32, Z0 + .11), .018, .05, steel, bevel=.004, verts=32)
PT = Z0 + .09 + .022
box("Circuit board", (PX, PY, Z0 + .09 + .011), (.92, .64, .022), pcb, .004)
for i in range(14):
    box("Edge pad", (PX - .42 + i * .065, PY - .30, PT + .0006), (.03, .022, .001), gold, 0)
for (cx, cy, w, d) in [(-.22, .12, .16, .16), (.2, .14, .1, .1), (.26, -.12, .12, .07), (-.25, -.16, .07, .05)]:
    box("IC", (PX + cx, PY + cy, PT + .012), (w, d, .024), chip, .003)
for i in range(8):
    box("Passive", (PX + .02 + i * .03, PY + .2, PT + .006), (.014, .028, .012), silk if i % 3 else gold, .001)
box("Silk outline", (PX, PY + .005, PT + .0007), (.42, .3, .0012), silk, 0)
box("Silk outline hole", (PX, PY + .005, PT + .0012), (.40, .28, .0014), pcb, 0)
SX, SY = PX, PY + .005
box("Header socket", (SX, SY, PT + .07), (.34, .21, .14), ivory, .01)
box("Socket mouth", (SX, SY, PT + .135), (.27, .14, .02), black, .004)
for i in range(4):
    box("Socket pin", (SX - .09 + i * .06, SY, PT + .12), (.02, .02, .03), gold, .002)
SOCKET_TOP = PT + .14
box("Pass LED housing", (SX + .3, SY - .2, PT + .008), (.04, .025, .016), chip, .003)
cyl("Pass LED", (SX + .3, SY - .2, PT + .02), .009, .008, lamp, bevel=.002, verts=24)

# tester
TX, TY = -1.02, .3
box("Tester pedestal", (TX, TY, Z0 + .04), (.56, .5, .08), graphite, .015)
box("Tester body", (TX, TY, Z0 + .37), (.5, .42, .58), alu, .045)
box("Tester bezel", (TX, TY - .213, Z0 + .39), (.42, .02, .46), graphite, .03)
box("Tester glass", (TX, TY - .225, Z0 + .41), (.34, .008, .36), glass, .02)
cyl("Lamp bezel", (TX, TY - .232, Z0 + .47), .07, .016, steel, "Y", .004)
cyl("Lamp", (TX, TY - .241, Z0 + .47), .055, .01, lamp, "Y", .004)
box("Lamp bar", (TX, TY - .232, Z0 + .3), (.16, .006, .012), lamp, .003)
board_cable = curve("Board to tester", rubber, .018, 4)
set_curve(board_cable, [(PX - .46, PY + .15, PT), (PX - .7, PY + .35, Z0 + .03), (TX + .1, TY - .1, Z0 + .03), (TX + .2, TY + .05, Z0 + .2)])

# the arm
BX, BY = 1.12, .34
base = empty("J1 base yaw")
base.location = (BX, BY, Z0)
cyl("Base flange", (BX, BY, Z0 + .03), .27, .06, graphite, bevel=.01)
for a in range(0, 360, 45):
    r = math.radians(a)
    cyl("Base bolt", (BX + .23 * math.cos(r), BY + .23 * math.sin(r), Z0 + .066), .016, .012, steel, bevel=.002, verts=24)
cyl("Base column", (0, 0, .28), .2, .44, paint, parent=base, bevel=.02)
ring("Base seam", (0, 0, .1), .201, .006, graphite, parent=base)
ZS = .62
SH = empty("shoulder housing", base)
SH.location = (0, 0, ZS)
cyl("Shoulder housing", (0, 0, 0), .2, .4, paint, "Y", .03, SH)
cyl("Shoulder cap", (0, -.205, 0), .165, .02, graphite, "Y", .006, SH)
ring("Shoulder ring", (0, -.212, 0), .145, .007, orange, "Y", SH)
cyl("Shoulder back cap", (0, .205, 0), .165, .02, graphite, "Y", .006, SH)

L1, L2, L3 = 1.06, .94, .2


def link(name, length, r, housing_r, housing_len, accent=False):
    g = empty(name)
    tube = cyl(name + " tube", (length / 2, 0, 0), r, length, paint, "X", .01, g)
    ring(name + " seam a", (.08, 0, 0), r + .001, .005, graphite, "X", g)
    ring(name + " seam b", (length - .08, 0, 0), r + .001, .005, graphite, "X", g)
    h = cyl(name + " joint", (length, 0, 0), housing_r, housing_len, paint, "Y", .025, g)
    cyl(name + " cap", (length, -housing_len / 2 - .006, 0), housing_r * .82, .018, graphite, "Y", .005, g)
    if accent:
        ring(name + " ring", (length, -housing_len / 2 - .012, 0), housing_r * .72, .006, orange, "Y", g)
    cyl(name + " back", (length, housing_len / 2 + .006, 0), housing_r * .82, .018, graphite, "Y", .005, g)
    return g


upper = link("Upper arm", L1, .115, .17, .34)
fore = link("Forearm", L2, .095, .13, .27)
wrist = empty("Wrist")
cyl("Wrist link", (0, 0, -L3 / 2), .085, L3, paint, "Z", .012, wrist)
cyl("Wrist 2 housing", (0, 0, -.06), .1, .2, paint, "X", .02, wrist)
cyl("Wrist 2 cap", (.106, 0, -.06), .082, .014, graphite, "X", .004, wrist)
cyl("Flange", (0, 0, -L3 - .015), .075, .03, steel, "Z", .004, wrist)

tool = empty("Tool")
cyl("Adapter", (0, 0, -.02), .09, .04, steel, bevel=.004, parent=tool)
cyl("Force sensor", (0, 0, -.09), .105, .1, black, bevel=.01, parent=tool)
ring("Index ring", (0, 0, -.05), .107, .006, orange, parent=tool)
box("Gripper body", (0, 0, -.21), (.4, .24, .14), graphite, .028, tool)
box("Gripper face", (0, -.122, -.21), (.3, .008, .08), alu, .006, tool)
for i, x in enumerate((-.03, 0, .03)):
    cyl("Status dot", (x, -.127, -.21), .007, .004, orange if i == 1 else black, "Y", .001, tool)
box("Guide rail", (0, 0, -.295), (.38, .17, .03), steel, .006, tool)
fingers = []
for s in (-1, 1):
    f = empty("finger", tool)
    box("Carriage", (0, 0, -.315), (.1, .16, .03), graphite, .006, f)
    box("Finger", (0, 0, -.42), (.05, .12, .2), alu, .01, f)
    box("Pad", (-s * .03, 0, -.45), (.012, .1, .1), rubber, .004, f)
    fingers.append((s, f))

conn = empty("Connector")
box("Connector housing", (0, 0, .13), (.24, .15, .26), ivory, .012, conn)
box("Connector collar", (0, 0, .03), (.26, .17, .06), ivory, .008, conn)
box("Latch", (0, -.085, .12), (.06, .02, .16), ivory, .006, conn)
box("Latch hook", (0, -.097, .045), (.08, .018, .03), ivory, .004, conn)
for i in range(4):
    box("Wire seal", (-.075 + i * .05, .078, .2), (.03, .01, .03), black, .003, conn)
lead = curve("Connector lead", rubber, .028, 5)

TOOL_LEN = .56
OPEN = .045
CLOSED_X = .12 + .006 + .03


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ease2(x):
    x = max(0.0, min(1.0, x))
    return x * x * x * (x * (6 * x - 15) + 10)


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


mated_bottom = SOCKET_TOP - .085
HOVER0 = Vector((.55, -.55, mated_bottom + .75))
ABOVE = Vector((SX, SY, mated_bottom + .32))
NEAR = Vector((SX, SY, mated_bottom + .045))
MATED = Vector((SX, SY, mated_bottom))
RETREAT = Vector((.25, -.35, mated_bottom + .7))


def arm_state(t):
    yaw = 0.0
    if t < .1:
        p = HOVER0 + Vector((0, 0, .02 * math.sin(t / .1 * math.pi)))
        y0 = .45
        yaw = y0
    elif t < .44:
        u = ease2((t - .1) / .34)
        p = HOVER0.lerp(ABOVE, u)
        p.z += math.sin(u * math.pi) * .12
        yaw = lerp(.45, 0, u)
    elif t < .56:
        u = ease2((t - .44) / .12)
        p = ABOVE.lerp(NEAR, u)
    elif t < .64:
        u = ease((t - .56) / .08)
        p = NEAR.lerp(MATED, u)
    elif t < .84:
        p = MATED.copy()
    else:
        u = ease2((t - .84) / .16)
        p = MATED.lerp(RETREAT, u)
        p.z += math.sin(u * math.pi) * .05
    if t < .76:
        opening = 0.0
    else:
        opening = ease((t - .76) / .06) * OPEN
    attached = t < .79
    return p, yaw, opening, attached


def basis(x, y):
    x = x.normalized()
    z = x.cross(y).normalized()
    y = z.cross(x).normalized()
    return Matrix((x, y, z)).transposed().to_4x4()


def pose(t):
    tip, yaw, opening, attached = arm_state(t)
    flange = tip + Vector((0, 0, TOOL_LEN))
    W = flange + Vector((0, 0, L3))
    th1 = math.atan2(W.y - BY, W.x - BX)
    base.rotation_euler = (0, 0, th1 - math.pi / 2 + math.pi / 2)
    S = Vector((BX, BY, Z0 + ZS))
    d = W - S
    r = math.hypot(d.x, d.y)
    z = d.z
    D = (r * r + z * z - L1 * L1 - L2 * L2) / (2 * L1 * L2)
    D = max(-1.0, min(1.0, D))
    beta = math.acos(D)
    alpha = math.atan2(z, r) + math.atan2(L2 * math.sin(beta), L1 + L2 * math.cos(beta))
    u = Vector((math.cos(th1), math.sin(th1), 0))
    n = Vector((-math.sin(th1), math.cos(th1), 0))
    E = S + u * (L1 * math.cos(alpha)) + Vector((0, 0, L1 * math.sin(alpha)))
    base.matrix_world = Matrix.Translation((BX, BY, Z0)) @ Matrix.Rotation(th1 - math.pi / 2, 4, "Z")
    upper.matrix_world = Matrix.Translation(S) @ basis(E - S, n)
    fore.matrix_world = Matrix.Translation(E) @ basis(W - E, n)
    wrist.matrix_world = Matrix.Translation(W) @ Matrix.Rotation(th1 - math.pi / 2, 4, "Z")
    tool.matrix_world = Matrix.Translation(flange) @ Matrix.Rotation(yaw, 4, "Z")
    for s, f in fingers:
        f.location = (s * (CLOSED_X + opening), 0, 0)
    if attached:
        conn.matrix_world = Matrix.Translation(tip) @ Matrix.Rotation(yaw, 4, "Z")
    else:
        conn.matrix_world = Matrix.Translation(MATED)
    cm = conn.matrix_world
    a = cm @ Vector((0, .085, .2))
    b = cm @ Vector((0, .42, .3))
    set_curve(lead, [a, b, Vector((SX + .15, SY + .78, Z0 + .05)), Vector((TX + .45, TY + .42, Z0 + .03)), Vector((TX + .2, TY + .12, Z0 + .3))])
    if t < .66:
        col, st = (.25, .24, .22), .3
    elif t < .74:
        col, st = (1, .36, .02), 3.2
    else:
        col, st = (.03, .85, .22), 3.4
    lamp_bsdf.inputs["Emission Color"].default_value = (*col, 1)
    lamp_bsdf.inputs["Emission Strength"].default_value = st
    lamp_bsdf.inputs["Base Color"].default_value = (*col, 1)


# camera path: wide hero, glide in low, macro on the mating, pull back wide
cam_data = bpy.data.cameras.new("cam")
cam = bpy.data.objects.new("Camera", cam_data)
scene.collection.objects.link(cam)
scene.camera = cam
cam_data.sensor_width = 36
cam_data.dof.use_dof = True
cam_data.clip_start = .05
KEYS = [
    (0.00, (4.9, -6.9, 1.75), (.12, .1, 1.02), 52, 6.0),
    (0.30, (3.4, -5.6, 1.55), (-.12, 0, .9), 56, 4.6),
    (0.55, (1.5, -3.9, 1.25), (SX - .1, SY, .78), 70, 3.0),
    (0.70, (.75, -3.45, 1.08), (SX - .28, SY + .05, SOCKET_TOP + .16), 74, 2.6),
    (0.82, (.45, -3.6, 1.12), (SX - .32, SY + .1, SOCKET_TOP + .18), 70, 2.8),
    (1.00, (4.7, -6.7, 1.7), (.05, .1, 1.0), 52, 5.6),
]


def catmull(p0, p1, p2, p3, u):
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)


def cam_state(t):
    ks = KEYS
    for i in range(len(ks) - 1):
        if t <= ks[i + 1][0]:
            break
    k0, k1, k2, k3 = ks[max(i - 1, 0)], ks[i], ks[i + 1], ks[min(i + 2, len(ks) - 1)]
    u = ease((t - k1[0]) / (k2[0] - k1[0]))
    out = []
    for j in (1, 2):
        out.append(Vector([catmull(k0[j][c], k1[j][c], k2[j][c], k3[j][c], u) for c in range(3)]))
    lens = catmull(k0[3], k1[3], k2[3], k3[3], u)
    fst = catmull(k0[4], k1[4], k2[4], k3[4], u)
    return out[0], out[1], lens, fst


def place_camera(t):
    loc, tgt, lens, fst = cam_state(t)
    cam.location = loc
    cam.rotation_euler = (tgt - loc).to_track_quat("-Z", "Y").to_euler()
    cam_data.lens = lens
    cam_data.dof.focus_distance = (tgt - loc).length
    cam_data.dof.aperture_fstop = fst


def area(name, pos, target, power, size, color=(1, 1, 1), size_y=None):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "RECTANGLE"
    data.size = size
    data.size_y = size_y or size
    o = bpy.data.objects.new(name, data)
    scene.collection.objects.link(o)
    o.location = pos
    o.rotation_euler = (Vector(target) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()


area("Key softbox", (-4.4, -3.6, 5.8), (0, 0, .9), 2400, 3.2, (1, .94, .86))
area("Rim strip", (4.2, 3.8, 3.2), (.4, 0, 1.1), 3200, 4.5, (.88, .94, 1), .55)
area("Kicker", (-3.6, 4.2, 2.4), (0, 0, 1.0), 1300, 3, (1, .9, .8), .6)
area("Top", (0, .6, 7), (0, 0, 0), 450, 5)
area("Front fill", (2.2, -6.8, 1.4), (0, 0, .8), 90, 4)
area("Wall wash", (-2, 7.5, 5.5), (0, 8, 2.5), 900, 6)

scene.world = bpy.data.worlds.new("World")
scene.world.use_nodes = True
bg = scene.world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (.78, .74, .68, 1)
bg.inputs["Strength"].default_value = .1

scene.render.engine = "CYCLES"
scene.cycles.samples = args.samples
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = .015
scene.cycles.use_denoising = True
scene.cycles.denoiser = "OPENIMAGEDENOISE"
scene.cycles.max_bounces = 8
scene.cycles.glossy_bounces = 4
scene.cycles.diffuse_bounces = 3
scene.cycles.transmission_bounces = 2
scene.render.use_persistent_data = True
try:
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "METAL"
    prefs.get_devices()
    for dv in prefs.devices:
        dv.use = True
    scene.cycles.device = "GPU"
except Exception as e:
    print("GPU fallback", e)
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080
scene.render.resolution_percentage = args.scale
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.image_settings.color_depth = "8"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = -.1

frames = args.output / "frames"
frames.mkdir(exist_ok=True)
N = args.frames
todo = [int(x) for x in args.only.split(",")] if args.only else range(args.start, N)
for i in todo:
    t = i / (N - 1)
    pose(t)
    place_camera(t)
    bpy.context.view_layer.update()
    scene.render.filepath = str(frames / f"f{i:04d}.png")
    bpy.ops.render.render(write_still=True)
    print(f"FRAME_READY {i}/{N}", flush=True)
if args.only:
    bpy.ops.wm.save_as_mainfile(filepath=str(args.output / "cobot-hero.blend"))
