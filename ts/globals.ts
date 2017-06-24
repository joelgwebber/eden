export var gl: WebGLRenderingContext;

export function initGlobals(canvas: HTMLCanvasElement) {
  gl = twgl.getWebGLContext(canvas);
}
