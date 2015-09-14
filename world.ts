/// <reference path="blocks.ts"/>

module Eden {

  const ChunkExp = 4;
  const ChunkExp2 = ChunkExp << 1;
  const ChunkExp3 = ChunkExp << 2;
  const ChunkSize = 1 << ChunkExp;

  export class World {
    private _chunk: Chunk;

    constructor(private _scene: THREE.Scene) {
      this._chunk = new Chunk();
      _scene.add(this._chunk.group());
    }

    update() {
      this._chunk.update();
    }
  }

  class Chunk {
    private _group: THREE.Group;
    private _cells = new Uint32Array(1 << ChunkExp3);
    private _meshes: THREE.Mesh[] = [];
    private _dirty: boolean;

    constructor() {
      this._group = new THREE.Group();
      for (var x = 0; x < ChunkSize; x++) {
        for (var y = 0; y < ChunkSize; y++) {
          for (var z = 0; z < ChunkSize; z++) {
            this.setCell(x, y, z, 0);
          }
        }
      }

      this.fill(2, 2, 2, 9, 2, 9, BlockWall);
      this.fill(3, 2, 3, 8, 2, 8, BlockAir);
      for (var i = 3; i <= 8; i++) {
        this.setCell(i, 2, i, BlockWall);
      }
      for (var i = 3; i <= 8; i++) {
        this.setCell(i, 2, 11-i, BlockWall);
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

    group(): THREE.Group {
      return this._group;
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
      for (var y = 2; y < 3/*ChunkSize - 4*/; y++) {
        for (var z = 2; z < ChunkSize - 4; z++) {
          for (var x = 2; x < ChunkSize - 4; x++) {
            var mesh = this._meshes[meshIdx];
            var env = this.env(x, y, z);
            var geom = geomForEnv(x, y, z, env);
            if (!geom) {
              if (mesh) {
                mesh.parent.remove(mesh);
                delete this._meshes[meshIdx];
              }
            } else {
              if (!mesh) {
                mesh = new THREE.Mesh();
                mesh.position.x = x;
                mesh.position.y = y;
                mesh.position.z = z;
                this._group.add(mesh);
                this._meshes[meshIdx] = mesh;
              }
              mesh.geometry = geom.geom;
              mesh.material = geom.mat;
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
