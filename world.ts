/// <reference path="blocks.ts"/>

module Eden {

  const ChunkExp = 4;
  const ChunkExp2 = ChunkExp << 1;
  const ChunkExp3 = ChunkExp << 2;
  const ChunkSize = 1 << ChunkExp;

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
    private _cells = new Uint32Array(1 << ChunkExp3);
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

      // this.fill(2, 2, 2, 2, 4, 4, BlockWall); // X__
      this.fill(4, 2, 2, 5, 2, 4, BlockWall); // _Y_
      // this.fill(2, 2, 2, 4, 4, 2, BlockWall); // __Z

      this.fill(3, 3, 2, 3, 3, 4, BlockWall);
      this.fill(3, 4, 2, 3, 4, 4, BlockWall);
      // this.fill(2, 5, 2, 2, 5, 4, BlockWall);

      // this.setCell(6, 2, 3, BlockWall);
    }

    render(camera: Camera) {
      var meshIdx = 0;
      for (var y = 2; y < ChunkSize - 4; y++) {
        for (var z = 2; z < ChunkSize - 4; z++) {
          for (var x = 2; x < ChunkSize - 4; x++) {
            var bi = this._meshes[meshIdx++];
            if (bi) {
              this.renderCell(camera, bi, x, y, z);
            }
          }
        }
      }
    }

    private renderCell(camera: Camera, bi: twgl.BufferInfo, x: number, y: number, z: number) {
      var cell = this.cell(x, y, z);
      var model = m4.translation([x, y, z]);

      var uniforms: {[name: string]: any} = {
        u_lightDir: v3.normalize([1, 2, 3]),
        u_viewProjection: camera.viewProjection(),
        u_model: model
      };

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
      var idx = (z << ChunkExp2) | (y << ChunkExp) | x;
      return this._cells[idx];
    }

    setCell(x: number, y: number, z: number, cell: number) {
      var idx = (z << ChunkExp2) | (y << ChunkExp) | x;
      this._cells[idx] = cell;
      this._dirty = true;
    }

    update() {
      if (!this._dirty) {
        return;
      }
      this._dirty = false;

      // TODO: This can be a lot more efficient:
      // - Step env elements rather than recomputing indices.
      // - Keep track of dirty region to minimize walking.
      // - Use typed array for env.
      var meshIdx = 0;
      for (var y = 2; y < ChunkSize - 4; y++) {
        for (var z = 2; z < ChunkSize - 4; z++) {
          for (var x = 2; x < ChunkSize - 4; x++) {
            var bi = this._meshes[meshIdx];
            var env = this.env(x, y, z);
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

    private env(cx: number, cy: number, cz: number): number[] {
      var env = [];
      for (var x = 0; x < 5; x++) {
        for (var y = 0; y < 5; y++) {
          for (var z = 0; z < 5; z++) {
            // Y, Z, X dominant order.
            env[y * 25 + z * 5 + x] = this.cell(cx + x - 2, cy + y - 2, cz + z - 2);
          }
        }
      }
      return env;
    }
  }
}
