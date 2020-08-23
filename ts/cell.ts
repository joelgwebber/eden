import { BufferInfo, createBufferInfoFromArrays, m4, setBuffersAndAttributes, v3 } from "twgl.js";
import { cube, empty, Model, polysToArrays } from "./csg";
import { Camera } from "./camera";
import { GL } from "./eden";
import { TAU } from "./math";
import Mat4 = m4.Mat4;
import id = m4.identity;
import mul = m4.multiply;
import tran = m4.translation;
import rotx = m4.rotationX;
import roty = m4.rotationY;

// Rotations about X/Y/Z as a fraction of TAU.
const x_1_8 = rotx(1 * TAU / 8);
const x_1_4 = rotx(1 * TAU / 4);
const x_3_4 = rotx(3 * TAU / 4);
const x_7_8 = rotx(7 * TAU / 8);

const y_1_4 = roty(1 * TAU / 4);
const y_1_2 = roty(1 * TAU / 2);
const y_3_4 = roty(3 * TAU / 4);
const y_1_8 = roty(1 * TAU / 8);
const y_3_8 = roty(3 * TAU / 8);
const y_5_8 = roty(5 * TAU / 8);
const y_7_8 = roty(7 * TAU / 8);

const z_1_8 = roty(1 * TAU / 8);

const nq = -0.25, pq = 0.25;

// Face surface transforms.
const faceXforms: Mat4[] = [
  id(),  // F0
  y_1_4, // F1
  y_1_2, // F2
  y_3_4, // F3
  x_1_4, // F4
  x_3_4, // F5
];

// Edge surface transforms.
const edgeXforms: Mat4[] = [
  mul(tran([0, nq, pq]), x_1_8),             // E0
  mul(tran([pq, nq, 0]), mul(y_1_4, x_1_8)), // E1
  mul(tran([0, nq, nq]), mul(y_1_2, x_1_8)), // E2
  mul(tran([nq, nq, 0]), mul(y_3_4, x_1_8)), // E3
  mul(tran([pq, 0, pq]), y_1_8),             // E4
  mul(tran([pq, 0, nq]), y_3_8),             // E5
  mul(tran([nq, 0, nq]), y_5_8),             // E6
  mul(tran([nq, 0, pq]), y_7_8),             // E7
  mul(tran([0, pq, pq]), x_7_8),             // E8
  mul(tran([pq, pq, 0]), mul(y_1_4, x_7_8)), // E9
  mul(tran([0, pq, nq]), mul(y_1_2, x_7_8)), // E10
  mul(tran([nq, pq, 0]), mul(y_3_4, x_7_8)), // E11
];

// Corner surface transforms.
const hexXForms: Mat4[] = [
  // What the actual fuck? This should be TAU/8, or my linear algebra brain is broken.
  // But something's gone apeshit and it's experimentally turned out to be around TAU/10.21?!
  mul(y_1_8, rotx(TAU / 10.21)),
  mul(y_3_8, rotx(TAU / 10.21)),
  mul(y_5_8, rotx(TAU / 10.21)),
  mul(y_7_8, rotx(TAU / 10.21)),
  mul(y_1_8, rotx(-TAU / 10.21)),
  mul(y_3_8, rotx(-TAU / 10.21)),
  mul(y_5_8, rotx(-TAU / 10.21)),
  mul(y_7_8, rotx(-TAU / 10.21)),
];

// Hex surface transforms.
const cornerXForms: Mat4[] = [
  // What the actual fuck? This should be TAU/8, or my linear algebra brain is broken.
  // But something's gone apeshit and it's experimentally turned out to be around TAU/10.21?!
  mul(tran([+1/3, -1/3, +1/3]), mul(y_1_8, rotx(TAU / 10.21))),
  mul(tran([+1/3, -1/3, -1/3]), mul(y_3_8, rotx(TAU / 10.21))),
  mul(tran([-1/3, -1/3, -1/3]), mul(y_5_8, rotx(TAU / 10.21))),
  mul(tran([-1/3, -1/3, +1/3]), mul(y_7_8, rotx(TAU / 10.21))),
  mul(tran([+1/3, +1/3, +1/3]), mul(y_1_8, rotx(-TAU / 10.21))),
  mul(tran([+1/3, +1/3, -1/3]), mul(y_3_8, rotx(-TAU / 10.21))),
  mul(tran([-1/3, +1/3, -1/3]), mul(y_5_8, rotx(-TAU / 10.21))),
  mul(tran([-1/3, +1/3, +1/3]), mul(y_7_8, rotx(-TAU / 10.21))),
];

export class CellBuilder {
  private model: Model;

  constructor() {
    this.model = empty();
  }

  face(face: number) {
    this.model = this.model.union(cube({
      radius: [0.5, 0.5, 0.01],
      color: [0, 1, 0],
      xform: faceXforms[face]
    }));
  }

  edge(edge: number) {
    this.model = this.model.union(cube({
      radius: [0.5, 0.5, 0.01],
      color: [0, 1, 0],
      xform: edgeXforms[edge]
    }));
  }

  hex(edge: number) {
    this.model = this.model.union(cube({
      radius: [0.7071, 0.7071, 0.01],
      color: [0, 1, 0],
      xform: hexXForms[edge]
    }));
  }

  corner(edge: number) {
    this.model = this.model.union(cube({
      radius: [0.7071, 0.7071, 0.01],
      color: [0, 1, 0],
      xform: cornerXForms[edge]
    }));
  }

  build(gl: GL): Cell {
    let outside = cube({radius: [0.5, 0.5, 0.5]});
    outside = outside.inverse()
    this.model = this.model.subtract(outside);
    var arrays = polysToArrays(this.model.toPolygons());
    return new Cell(createBufferInfoFromArrays(gl, arrays));
  }
}

export class Cell {
  constructor(private buf: BufferInfo) {
  }

  render(gl: GL, camera: Camera, world: Mat4) {
    const program = camera.prep(gl, world);
    setBuffersAndAttributes(gl, program, this.buf);
    gl.drawElements(gl.TRIANGLES, this.buf.numElements, gl.UNSIGNED_SHORT, 0);
  }
}
