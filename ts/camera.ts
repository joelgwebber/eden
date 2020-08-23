import { createProgramInfo, m4, ProgramInfo, setUniforms, v3 } from "twgl.js";
import { GL } from "./eden";
import Mat4 = m4.Mat4;
import Vec3 = v3.Vec3;

interface Uniforms {
  u_lightWorldPos: Vec3;
  u_lightColor: number[];
  u_ambient: number[];
  u_specular: number[];
  u_shininess: number;
  u_specularFactor: number;

  u_viewInverse: Mat4;
  u_world: Mat4;
  u_worldInverseTranspose: Mat4;
  u_worldViewProjection: Mat4;
}

export class Camera {
  private program: ProgramInfo;
  private uniforms: Uniforms;
  private aspect: number;
  private _xform: Mat4;

  constructor(gl: GL) {
    this.program = createProgramInfo(gl, ["vs", "fs"]);

    this.uniforms = {
      u_lightWorldPos: [-6, 8, -10],
      u_lightColor: [0.8, 1, 0.8, 1],
      u_ambient: [0.3, 0.3, 0.3, 1],
      u_specular: [1, 1, 1, 1],
      u_shininess: 50,
      u_specularFactor: 1,

      u_viewInverse: null,
      u_world: null,
      u_worldInverseTranspose: null,
      u_worldViewProjection: null,
    };

    this._xform = m4.identity();
  }

  get xform(): Mat4 {
    return this._xform;
  }

  setViewport(width: number, height: number): void {
    this.aspect = width / height;
  }

  prep(gl: GL, world: Mat4): ProgramInfo {
    const fov = 30 * Math.PI / 180;
    const zNear = 0.01;
    const zFar = 100;
    const projection = m4.perspective(fov, this.aspect, zNear, zFar);

    const view = m4.inverse(this.xform);
    const viewProjection = m4.multiply(projection, view);

    this.uniforms.u_viewInverse = this.xform;
    this.uniforms.u_world = world;
    this.uniforms.u_worldInverseTranspose = m4.transpose(m4.inverse(world));
    this.uniforms.u_worldViewProjection = m4.multiply(viewProjection, world);

    gl.useProgram(this.program.program);
    setUniforms(this.program, this.uniforms);

    return this.program;
  }
}
