import { m4, resizeCanvasToDisplaySize, v3, } from "twgl.js";
import { Camera } from "./camera";
import { Chunk } from "./chunk";
import { Controls } from "./controls";

export type GL = WebGL2RenderingContext;

class Eden {
  private canvas: HTMLCanvasElement;
  private gl: GL;
  private chunk: Chunk;
  private camera: Camera;
  private controls: Controls;

  constructor() {
    this.canvas = document.createElement("canvas")
    document.body.appendChild(this.canvas);
    this.gl = this.canvas.getContext("webgl2");
    this.camera = new Camera(this.gl)
    this.chunk = new Chunk(this.gl);
    this.controls = new Controls(this.canvas, this.camera);

    m4.setTranslation(this.camera.xform, v3.create(0.5, 0.5, 5), this.camera.xform);

    this.render();
  }

  render() {
    this.resize();
    this.controls.tick(0.05); // TODO: actual dt

    this.gl.enable(this.gl.DEPTH_TEST);
    this.gl.enable(this.gl.CULL_FACE);
    this.gl.clearColor(0.53, 0.81, 0.92, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    this.chunk.render(this.gl, this.camera);

    requestAnimationFrame(() => this.render());
  }

  private resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    resizeCanvasToDisplaySize(this.canvas);
    this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
    this.camera.setViewport(this.canvas.width, this.canvas.height);
  }
}

new Eden();
