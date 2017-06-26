import {gl, View, worldProgram} from "./eden";
import {Camera} from "./camera";
import {clamp, cos, sin, Tau} from "./math";
import * as csg from "./csg";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export class Modeler implements View {
  private _input: HTMLTextAreaElement;
  private _camera: Camera;
  private _phi = 0;
  private _theta = 0;
  private _buffer: twgl.BufferInfo;

  constructor() {
    this._input = document.createElement("textarea");
    this._camera = new Camera();

    var cube = csg.cube({ center: [0, 0, 0], radius: [1, 1, 1] });
    this._buffer = csg.polysToBuffers(cube.toPolygons());
  }

  create() {
    document.body.appendChild(this._input);
  }

  destroy() {
    document.body.removeChild(this._input);
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
      u_lightDir: v3.normalize([-1, -2, -3]),
      u_viewProjection: this._camera.viewProjection(),
      u_model: m4.translation([0, 0, 0])
    };

    gl.useProgram(worldProgram.program);
    twgl.setBuffersAndAttributes(gl, worldProgram, this._buffer);
    twgl.setUniforms(worldProgram, uniforms);
    gl.drawElements(gl.TRIANGLES, this._buffer.numElements, gl.UNSIGNED_SHORT, 0);
  }
}
