/// <reference path="math.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="camera.ts"/>
/// <reference path="terrain.ts"/>

module Eden {

  import v3 = twgl.v3;
  import m4 = twgl.m4;
  import Vec3 = twgl.v3.Vec3;
  import Mat4 = twgl.m4.Mat4;

  export var ChunkExp = 4;
  export var ChunkExp2 = ChunkExp * 2;
  export var ChunkExp3 = ChunkExp * 3;
  export var ChunkSize = 1 << ChunkExp;
  export var ChunkSize2 = 1 << ChunkExp2;
  export var ChunkSize3 = 1 << ChunkExp3;

  var programInfo: twgl.ProgramInfo;

  export class World {
    private _chunk: Chunk;
    private _programInfo: twgl.ProgramInfo;

    constructor() {
      this._chunk = new Chunk();
      programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);
    }

    chunk(x: number, y: number, z: number): Chunk {
      return this._chunk;
    }

    update() {
      this._chunk.update();
    }

    render(camera: Camera) {
      this._chunk.render(camera);
    }
  }

  class Chunk {
    private _cells = new Uint32Array(ChunkSize3);
    private _terrain: twgl.BufferInfo;
    private _meshes: twgl.BufferInfo[] = [];
    private _dirty: boolean;

    constructor() {
      for (var x = 0; x < ChunkSize; x++) {
        for (var y = 0; y < ChunkSize; y++) {
          for (var z = 0; z < ChunkSize; z++) {
            this.setCell(x, y, z, 0);
          }
        }
      }

      this.fill(2, 2, 2, 10, 2, 10, 0xffff0000 | CellGrass);
    }

    render(camera: Camera) {
      var uniforms: {[name: string]: any} = {
        u_ambient: [0.3, 0.3, 0.3],
        u_lightDir: v3.normalize([-1, -1, -1]),
        u_viewProjection: camera.viewProjection(),
        u_model: m4.identity()
      };

      // Draw the terrain.
      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, this._terrain);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, this._terrain.numElements, gl.UNSIGNED_SHORT, 0);

      // Draw the individual cells.
      // TODO: This could be dramatically optimized using glDrawElementsInstanced().
      var meshIdx = 0;
      for (var y = 2; y < ChunkSize - 4; y++) {
        for (var z = 2; z < ChunkSize - 4; z++) {
          for (var x = 2; x < ChunkSize - 4; x++) {
            var bi = this._meshes[meshIdx++];
            if (bi) {
              this.renderCell(camera, bi, uniforms, x, y, z);
            }
          }
        }
      }
    }

    private renderCell(camera: Camera, bi: twgl.BufferInfo, uniforms: {[name: string]: any}, x: number, y: number, z: number) {
      var cell = this.cell(x, y, z);
      var model = m4.translation([x, y, z]);
      uniforms["u_model"] = model;

      gl.useProgram(programInfo.program);
      twgl.setBuffersAndAttributes(gl, programInfo, bi);
      twgl.setUniforms(programInfo, uniforms);
      gl.drawElements(gl.TRIANGLES, bi.numElements, gl.UNSIGNED_SHORT, 0);
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
      var meshIdx = 0;
      for (var y = 2; y < ChunkSize - 4; y++) {
        for (var z = 2; z < ChunkSize - 4; z++) {
          for (var x = 2; x < ChunkSize - 4; x++) {
            if (this.cell(x, y, z) == CellAir) {
              continue;
            }

            var bi = this._meshes[meshIdx];
            var env = makeEnv(this._cells, x, y, z);
            var geom = geomForEnv(x, y, z, env);
            if (!geom) {
              if (bi) {
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
  }

  export function makeEnv(cells: Uint32Array, cx: number, cy: number, cz: number): number[] {
    var env = new Array(125);
    for (var x = 0; x < 5; x++) {
      for (var y = 0; y < 5; y++) {
        for (var z = 0; z < 5; z++) {
          // Y, Z, X dominant order.
          env[y * 25 + z * 5 + x] = cells[cellIndex(cx + x - 2, cy + y - 2, cz + z - 2)];
        }
      }
    }
    return env;
  }

  export function cellIndex(x: number, y: number, z: number): number {
    return (z << ChunkExp2) | (y << ChunkExp) | x;
  }
}
