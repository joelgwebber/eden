import { Cell, CellBuilder } from "./cell";
import { Camera } from "./camera";
import { m4, v3 } from "twgl.js";
import { GL } from "./eden";
import Mat4 = m4.Mat4;
import Vec3 = v3.Vec3;

export class Chunk {
  private cell: Cell;
  private pos: Vec3;

  constructor(gl: GL) {
    var cb = new CellBuilder();

    cb.face(0);
    cb.face(1);
    cb.face(4);

    // cb.edge(0);
    // cb.edge(1);
    // cb.edge(2);
    // cb.edge(3);
    // cb.edge(4);
    // cb.edge(5);
    // cb.edge(6);
    // cb.edge(7);
    // cb.edge(8);
    // cb.edge(9);
    // cb.edge(10);
    // cb.edge(11);

    // cb.hex(0);
    // cb.hex(1);
    // cb.hex(2);
    // cb.hex(3);

    // cb.corner(0);
    // cb.corner(1);
    // cb.corner(2);
    // cb.corner(3);
    // cb.corner(4);
    // cb.corner(5);
    // cb.corner(6);
    // cb.corner(7);

    this.cell = cb.build(gl);
    this.pos = [0, 0, 0];
  }

  render(gl: WebGL2RenderingContext, camera: Camera): void {
    this.cell.render(gl, camera, m4.translation(this.pos));
  }
}
