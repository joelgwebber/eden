import {Client} from "./client";
import {Modeler} from "./modeler";

export var gl: WebGLRenderingContext;
export var worldProgram: twgl.ProgramInfo;

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export interface View {
  create();
  destroy();
  mouseMove(dx: number, dy: number);
  keyDown(keyCode: number);
  render();
}

export interface WorldUniforms {
  u_ambient: Vec3;
  u_lightDir: Vec3;
  u_viewProjection: Mat4;
  u_model: Mat4;
}

export class Eden {
  private _views: View[] = [];
  private _haveLock = false;

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

    this.initPointerLock(canvas);
  }

  run() {
    document.addEventListener("mousemove", (e) => { this.mouseMove(e.movementX, e.movementY); });
    document.addEventListener("keydown", (e: KeyboardEvent) => { this.keyDown(e.keyCode); });

    this.addView(new Client("jimmy"));
    // this.addView(new Modeler());

    this.render();
  }

  private initPointerLock(canvas: HTMLCanvasElement) {
    document.addEventListener("pointerlockchange", (e) => {
      this._haveLock = document.pointerLockElement == canvas;
    }, false);
    canvas.addEventListener("click", (e) => {
      if (!this._haveLock) {
        canvas.requestPointerLock();
      }
    }, false);
  }

  private addView(view: View) {
    this._views.push(view);
    view.create();
  }

  private removeView(view: View) {
    for (var i = 0; i < this._views.length; i++) {
      if (this._views[i] == view) {
        this._views.splice(i, 1);
        view.destroy();
        return;
      }
    }
    throw "missing view";
  }

  private mouseMove(dx: number, dy: number) {
    this._views.forEach((view) => { view.mouseMove(dx, dy); });
  }

  private keyDown(keyCode: number) {
    this._views.forEach((view) => { view.keyDown(keyCode); });
  }

  private render() {
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.clearColor(0x7e/0x100, 0xc0/0x100, 0xee/0x100, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    this._views.forEach((view) => { view.render(); });

    requestAnimationFrame(() => { this.render(); });
  }
}
