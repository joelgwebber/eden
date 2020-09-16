import { BufferInfo, createBufferInfoFromArrays, m4, setBuffersAndAttributes } from "twgl.js";
import { cube, empty, Model, Polygon, polysToArrays, Vector, Vertex } from "./csg";
import { Camera } from "./camera";
import { GL } from "./eden";
import { TAU } from "./math";
import Mat4 = m4.Mat4;
import id = m4.identity;
import mul = m4.multiply;
import tran = m4.translation;
import rotx = m4.rotationX;
import roty = m4.rotationY;
import rotz = m4.rotationZ;

export enum Plane {
  X, Y, Z,
  Xy, XY, Xz, XZ, Yz, YZ,
  Xyz, XYz, XyZ, XYZ
}

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

const z_1_4 = rotz(1 * TAU / 4);
const z_1_8 = rotz(1 * TAU / 8);
const z_7_8 = rotz(7 * TAU / 8);

const r2 = Math.sqrt(2);
const r22 = r2 / 2;

// Face surface transforms.
const faceXforms: Mat4[] = [
             tran([0, 0, -0.05]),  // XY
  mul(y_3_4, tran([0, 0, -0.05])), // YZ
  mul(x_1_4, tran([0, 0, -0.05])), // XZ
];

// Angle surface transforms.
const angleXforms: Mat4[] = [
                                                mul(y_7_8, tran([0, 0, -0.05])),    // +XZ
  mul(tran([0, 0, 1]),                       mul(y_1_8, tran([0, 0, -0.05]))),   // -XZ
  mul(tran([1, 0, 0]),            mul(x_1_8, mul(z_1_4, tran([0, 0, -0.05])))),  // +YZ
  mul(tran([1, 0, 1]),            mul(x_7_8, mul(z_1_4, tran([0, 0, -0.05])))),  // -YZ
                          mul(z_7_8, mul(y_1_4, mul(z_1_4, tran([0, 0, -0.05])))),  // +XY
  mul(tran([1, 0, 0]), mul(z_1_8, mul(y_1_4, mul(z_1_4, tran([0, 0, -0.05]))))), // -XY
];

// Angle surface transforms.
const cornerXforms: Mat4[] = [
  mul(y_7_8, mul(rotx(TAU / 10.21), tran([0, 0, -0.05]))),                                                  // +X)Z
];

const clipXForms: Mat4[] = [
  z_1_8,
  z_7_8,
  y_1_8,
  y_7_8,
];

export class CellBuilder {
  private model: Model;

  constructor() {
    this.model = empty();
  }

  face(face: number) {
    this.model = this.model.union(cube({
      radius: [1, 1, 0.1],
      color: [0, 1, 0],
      xform: faceXforms[face]
    }));
  }

  angle(angle: number) {
    this.model = this.model.union(cube({
      radius: [r2, 1, 0.1],
      color: [0, 1, 0],
      xform: angleXforms[angle]
    }));
  }

  angleTri(angle: number, clipAngle: number) {
    var shape = cube({
      radius: [r2, 1, 0.1],
      color: [0, 1, 0],
      xform: angleXforms[angle]
    }).intersect(cube({
      radius: [2, 2, 2],
      color: [0, 1, 0],
      xform: clipXForms[clipAngle],
    }));
    this.model = this.model.union(shape);
  }

  corner(corner: number) {
    var n = new Vector(0, 1, 0), c = new Vector(0, 1, 0);
    function vert(x: number, y: number, z: number): Vertex {
      return new Vertex(new Vector(x, y, z), n, c);
    }
    var verts = [
      vert(  0, 0.0, -0.1), vert(0, 0.0, 0.1),
      vert(r22, 1.2121, -0.1), vert(r22, 1.2121, 0.1),
      vert( r2, 0.0, -0.1), vert( r2, 0.0, 0.1),
    ];
    function poly(indices: number[]): Polygon {
      return new Polygon(indices.map((idx) => verts[idx]));
    }

    var tri = cube({
      radius: [r2, 1.5, 0.1],
      color: [0, 1, 0],
      xform: tran([0, 0, -.05])
    }).intersect(Model.fromPolygons([
      poly([0, 2, 4]),
      poly([1, 5, 3]),
      poly([0, 1, 3, 2]),
      poly([0, 4, 5, 1]),
      poly([4, 2, 3, 5]),
    ]));
    tri.transform(mul(y_7_8, rotx(-TAU / 10.21)));

    this.model = this.model.union(tri);

    // this.model = this.model.union(cube({
    //   radius: [r2, r2, 0.1],
    //   color: [0, 1, 0],
    //   xform: cornerXforms[corner]
    // }).intersect(cube({
    //   radius: [1, 1, 1],
    //   color: [0, 1, 0],
    // })));
  }

  build(gl: GL): Cell {
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
