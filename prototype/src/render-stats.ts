import type { WebGLRenderer } from 'three';

export class RenderStats {
  gl: WebGL2RenderingContext;
  timer: { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number } | null;
  pending: WebGLQuery | null = null;
  active: WebGLQuery | null = null;
  gpuMs = 0;
  output: HTMLOutputElement | null = null;
  start = 0;
  frames = 0;
  cost = 0;
  calls = 0;
  triangles = 0;
  constructor(container: HTMLElement, renderer: WebGLRenderer) {
    this.gl = renderer.getContext() as WebGL2RenderingContext;
    this.timer = this.gl.getExtension('EXT_disjoint_timer_query_webgl2');
    if (!new URLSearchParams(location.search).has('stats')) return;
    this.output = document.createElement('output');
    this.output.className = 'render-stats';
    this.output.setAttribute('aria-label', 'Rendering diagnostics');
    this.output.style.cssText = 'position:absolute;right:24px;bottom:100px;z-index:10;font:11px monospace;line-height:1.6;padding:10px;background:#111e;color:#ddd;pointer-events:none;white-space:pre';
    container.append(this.output);
  }
  begin() {
    if (!this.timer) return;
    const gl = this.gl;
    if (this.pending && gl.getQueryParameter(this.pending, gl.QUERY_RESULT_AVAILABLE)) {
      if (!gl.getParameter(this.timer.GPU_DISJOINT_EXT)) this.gpuMs = gl.getQueryParameter(this.pending, gl.QUERY_RESULT) / 1e6;
      gl.deleteQuery(this.pending); this.pending = null;
    }
    if (!this.pending) {
      this.active = gl.createQuery();
      if (this.active) gl.beginQuery(this.timer.TIME_ELAPSED_EXT, this.active);
    }
  }
  end() {
    if (!this.active || !this.timer) return;
    this.gl.endQuery(this.timer.TIME_ELAPSED_EXT);
    this.pending = this.active; this.active = null;
  }
  record(now: number, renderMs: number, renderer: WebGLRenderer) {
    if (!this.output) return;
    if (!this.start || now - this.start > 2500) { this.start = now; this.frames = 0; this.cost = 0; this.calls = 0; this.triangles = 0; }
    this.frames++; this.cost += renderMs;
    this.calls = Math.max(this.calls, renderer.info.render.calls);
    this.triangles = Math.max(this.triangles, renderer.info.render.triangles);
    if (now - this.start < 1000) return;
    this.output.textContent = `${((this.frames - 1) * 1000 / (now - this.start)).toFixed(0)} fps · ${(this.cost / this.frames).toFixed(1)} ms CPU · ${this.timer ? `${this.gpuMs.toFixed(1)} ms GPU` : 'GPU timer unavailable'}\n${this.calls} draws · ${(this.triangles / 1000).toFixed(0)}k triangles · ${renderer.getPixelRatio().toFixed(2)} dpr`;
    this.start = now; this.frames = 0; this.cost = 0; this.calls = 0; this.triangles = 0;
  }
  dispose() { if (this.pending) this.gl.deleteQuery(this.pending); this.output?.remove(); }
}
