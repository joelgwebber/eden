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

      for (var x = 6; x < 12; x++) {
        for (var z = 6; z < 12; z++) {
          this.setCell(x, 1, z, 1);
        }
      }
      for (var x = 7; x < 11; x++) {
        for (var z = 7; z < 11; z++) {
          this.setCell(x, 1, z, 2);
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
      for (var x = 1; x < ChunkSize-2; x++) {
        for (var y = 1; y < ChunkSize-2; y++) {
          for (var z = 1; z < ChunkSize-2; z++) {
            var mesh = this._meshes[meshIdx];
            var env = this.env(x, y, z);
            var geom = geomForEnv(env);
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
      for (var x = 0; x < 3; x++) {
        for (var y = 0; y < 3; y++) {
          for (var z = 0; z < 3; z++) {
            env[z * 9 + y * 3 + x] = this.cell(cx+x-1, cy+y-1, cz+z-1);
          }
        }
      }
      return env;
    }
  }
}
