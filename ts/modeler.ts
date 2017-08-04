import {gl, View, worldProgram} from "./eden";
import {Camera} from "./camera";
import {clamp, cos, sin, Tau} from "./math";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;
import {KeyEnter} from "./keys";
import {Model} from "./model";

export class Modeler implements View {
  private _camera: Camera;
  private _phi = 0;
  private _theta = 0;
  private _model: Model;

  private _codeContainer: HTMLElement;
  private _input: HTMLTextAreaElement;
  private _feedback: HTMLElement;

  private _evalTimer: number;

  constructor() {
    this._camera = new Camera();
    this._model = new Model();
    this.createCodeLayer();
  }

  create() {
    document.body.appendChild(this._codeContainer);
    this._evalTimer = setInterval(() => this.eval(), 1000);
  }

  destroy() {
    document.body.removeChild(this._codeContainer);
  }

  mouseMove(dx: number, dy: number) {
    this._theta += dx / 32;
    this._phi   = clamp(this._phi + dy / 32, Tau / 16, Tau / 2 - Tau / 16);
  }

  keyDown(keyCode: number) {
  }

  render() {
    var cx = 16 * (cos(this._theta) * sin(this._phi));
    var cy = 16 * cos(this._phi);
    var cz = 16 * (sin(this._theta) * sin(this._phi));
    this._camera.setPosition([cx, cy, cz]);
    this._camera.lookAt([0, 0, 0], [0, 1, 0]);
    this._camera.update();

    var uniforms: {[name: string]: any} = {
      u_ambient: [0.3, 0.3, 0.3],
      u_lightDir: v3.normalize([1, 2, 3]),
      u_viewProjection: this._camera.viewProjection(),
      u_model: m4.translation([0, 0, 0])
    };

    gl.useProgram(worldProgram.program);
    twgl.setBuffersAndAttributes(gl, worldProgram, this._model.buffer());
    twgl.setUniforms(worldProgram, uniforms);
    gl.drawElements(gl.TRIANGLES, this._model.buffer().numElements, gl.UNSIGNED_SHORT, 0);
  }

  private createCodeLayer() {
    this._codeContainer = document.createElement("div");
    this._codeContainer.className = "codeContainer";

    this._feedback = document.createElement("pre");
    this._feedback.className = "feedback";
    this._codeContainer.appendChild(this._feedback);

    this._input = document.createElement("textarea");
    this._input.className = "input";
    this._codeContainer.appendChild(this._input);
    this._input.addEventListener("keydown", (e) => {
      // Cmd/ctrl-enter: Eval.
      if (e.keyCode == KeyEnter && e.metaKey || e.ctrlKey) {
        this.eval();
      }
    });
  }

  private eval() {
    console.log("evaling");
    try {
      this._feedback.textContent = "";
      this._model.setCode(this._input.value);
    } catch (e) {
      this._feedback.textContent = e;
    }
  }
}

