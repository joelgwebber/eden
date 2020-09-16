import { Cell, CellBuilder } from "./cell";
import { Camera } from "./camera";
import { m4, v3 } from "twgl.js";
import { GL } from "./eden";
import Mat4 = m4.Mat4;
import Vec3 = v3.Vec3;

export class Chunk {
  private cell0: Cell;
  private cell01: Cell;
  private cell1: Cell;
  private cell2: Cell;
  private pos: Vec3;

  constructor(gl: GL) {
    this.pos = [0, 0, 0];

    var cb = new CellBuilder();
    // cb.face(0)
    // cb.angle(2)
    cb.face(2)
    cb.corner(0);
    // cb.face(2)
    this.cell0 = cb.build(gl);

    // cb = new CellBuilder();
    // cb.face(0)
    // cb.face(1)
    // this.cell01 = cb.build(gl);

    cb = new CellBuilder();
    cb.face(2);
    cb.angle(3);
    // cb.angleTri(0, 1);
    // cb.angleTri(1, 0);
    // cb.angleTri(1, 1);
    // cb.angleTri(2, 0);
    // cb.angleTri(2, 1);
    // cb.angleTri(3, 0);
    // cb.angleTri(3, 1);
    // cb.angleTri(4, 2);
    // cb.angleTri(4, 3);
    // cb.angleTri(5, 2);
    // cb.angleTri(5, 3);
    this.cell1 = cb.build(gl);

    // cb = new CellBuilder();
    // cb.face(0);
    // cb.face(2);
    // this.cell2 = cb.build(gl);
  }

  render(gl: WebGL2RenderingContext, camera: Camera): void {
    this.cell0.render(gl, camera, m4.translation(this.pos));
    // this.cell01.render(gl, camera, m4.translation(v3.add(this.pos, [0, 1, 0])));
    this.cell1.render(gl, camera, m4.translation(v3.add(this.pos, [1, 0, 0])));
    // this.cell2.render(gl, camera, m4.translation(v3.add(this.pos, [2, 0, 1])));
  }
}
