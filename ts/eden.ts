import {Client} from "./client";

export var gl: WebGLRenderingContext;
export var worldProgram: twgl.ProgramInfo;

export interface View {
  create();
  destroy();
  mouseMove(x: number, y: number);
  keyDown(keyCode: number);
  render();
}

export class Eden {
  private views: View[] = [];

  constructor() {
    // Setup canvas and GL context.
    twgl.setAttributePrefix("a_");
    var canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    document.body.appendChild(canvas);

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    gl = twgl.getWebGLContext(canvas);
    worldProgram = twgl.createProgramInfo(gl, ["worldVS", "worldFS"]);
  }

  run() {
    document.addEventListener("mousemove", (e) => { this.mouseMove(e.clientX, e.clientY); });
    document.addEventListener("keydown", (e: KeyboardEvent) => { this.keyDown(e.keyCode); });

    var client = new Client("jimmy");
    this.views.push(client);
    client.create();

    this.render();
  }

  private mouseMove(x: number, y: number) {
    this.views.forEach((view) => { view.mouseMove(x, y); });
  }

  private keyDown(keyCode: number) {
    this.views.forEach((view) => { view.keyDown(keyCode); });
  }

  private render() {
    this.views.forEach((view) => { view.render(); });
    requestAnimationFrame(() => { this.render(); });
  }
}
