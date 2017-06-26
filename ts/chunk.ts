import {ChunkExp, ChunkExp2, ChunkInterior, ChunkSize, ChunkSize3} from "./world";
import {renderTerrain} from "./terrain";
import {Camera} from "./camera";
import {gl, worldProgram, WorldUniforms} from "./eden";
import * as proto from "./protocol";
import * as cells from "./cells";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export class Chunk {
  private _cells = new Uint32Array(ChunkSize3);
  private _terrain: twgl.BufferInfo;
  private _meshes: twgl.BufferInfo[] = [];
  private _dirty: boolean;

  constructor(private _cx: number, private _cy: number, private _cz: number) {
    for (var x = 0; x < ChunkSize; x++) {
      for (var y = 0; y < ChunkSize; y++) {
        for (var z = 0; z < ChunkSize; z++) {
          this.setCell(x, y, z, 0);
        }
      }
    }
  }

  render(camera: Camera) {
    var uniforms: WorldUniforms = {
      u_ambient: [0.3, 0.3, 0.3],
      u_lightDir: v3.normalize([-1, -2, -3]),
      u_viewProjection: camera.viewProjection(),
      u_model: m4.translation([this._cx * ChunkInterior, this._cy * ChunkInterior, this._cz * ChunkInterior])
    };

    // Draw the terrain.
    gl.useProgram(worldProgram.program);
    twgl.setBuffersAndAttributes(gl, worldProgram, this._terrain);
    twgl.setUniforms(worldProgram, uniforms);
    gl.drawElements(gl.TRIANGLES, this._terrain.numElements, gl.UNSIGNED_SHORT, 0);

    // Draw the individual cells.
    // TODO: This could be dramatically optimized using glDrawElementsInstanced().
    for (var x = 1; x < ChunkSize - 2; x++) {
      for (var y = 1; y < ChunkSize - 2; y++) {
        for (var z = 1; z < ChunkSize - 2; z++) {
          var meshIdx = cellIndex(x, y, z);
          var bi = this._meshes[meshIdx];
          if (bi) {
            twgl.setBuffersAndAttributes(gl, worldProgram, bi);
            uniforms["u_model"] = m4.translation([x, y, z]);
            twgl.setUniforms(worldProgram, uniforms);
            gl.drawElements(gl.TRIANGLES, bi.numElements, gl.UNSIGNED_SHORT, 0);
          }
        }
      }
    }
  }

  setCells(cells: number[]) {
    if (cells.length != ChunkSize3) {
      throw "invalid cell count";
    }

    for (var i = 0; i < ChunkSize3; i++) {
      this._cells[i] = cells[i];
    }

    this._dirty = true;
  }

  setActors(actors: proto.Actor[]) {
    // TODO: Not sure quite how we want to handle this.
  }

  cell(x: number, y: number, z: number): number {
    return this._cells[cellIndex(x, y, z)];
  }

  setCell(x: number, y: number, z: number, cell: number) {
    this._cells[cellIndex(x, y, z)] = cell;
    this._dirty = true;
  }

  update() {
    if (!this._dirty) {
      return;
    }
    this._dirty = false;

    // Update terrain.
    this._terrain = renderTerrain(this._cells);

    // TODO: This can be a lot more efficient:
    // - Make 'env' a direct reference to the Uint32Array.
    // - Keep track of dirty region to minimize walking.
    for (var x = 1; x < ChunkSize - 2; x++) {
      for (var y = 1; y < ChunkSize - 2; y++) {
        for (var z = 1; z < ChunkSize - 2; z++) {
          var meshIdx = cellIndex(x, y, z);
          var mesh = this._meshes[meshIdx];
          var geom: twgl.BufferInfo = null;
          if (this.cell(x, y, z) != cells.CellAir) {
            var env = makeEnv(this._cells, x, y, z);
            geom = cells.geomForEnv(x, y, z, env);
          }

          if (!geom) {
            if (mesh) {
              delete this._meshes[meshIdx];
            }
          } else {
            this._meshes[meshIdx] = geom;
          }
          meshIdx++;
        }
      }
    }
  }

  private fill(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, cell: number) {
    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        for (var z = z0; z <= z1; z++) {
          this.setCell(x, y, z, cell);
        }
      }
    }
  }
}

export function makeEnv(cells: Uint32Array, cx: number, cy: number, cz: number): number[] {
  var env = new Array(27);
  for (var x = 0; x < 3; x++) {
    for (var y = 0; y < 3; y++) {
      for (var z = 0; z < 3; z++) {
        // Y, Z, X dominant order.
        var cell = cells[cellIndex(cx + x - 1, cy + y - 1, cz + z - 1)];
        // var type = cellType(cell)
        // if (isTerrain(type)) {
          env[y * 9 + z * 3 + x] = cell;
        // }
      }
    }
  }
  return env;
}

export function cellIndex(x: number, y: number, z: number): number {
  return (z << ChunkExp2) | (y << ChunkExp) | x;
}
