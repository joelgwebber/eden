import {ChunkExp, ChunkExp2, ChunkInterior, ChunkSize, ChunkSize3} from "./world";
import {renderTerrain} from "./terrain";
import {Camera} from "./camera";
import {gl, worldProgram, WorldUniforms} from "./eden";
import {renderObjet} from "./objet";
import * as proto from "./protocol";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export class Chunk {
  private _cells = new Uint32Array(ChunkSize3);
  private _terrain: twgl.BufferInfo;
  private _objets: {[key: number]: proto.Objet} = {};
  private _dirty: boolean;

  constructor(private _cx: number, private _cy: number, private _cz: number) {
  }

  offset(): Vec3 {
    return v3.create(this._cx * ChunkInterior, this._cy * ChunkInterior, this._cz * ChunkInterior);
  }

  objet(id: number): proto.Objet {
    return this._objets[id];
  }

  cell(x: number, y: number, z: number): number {
    return this._cells[cellIndex(x, y, z)];
  }

  mutate(mut: proto.Mutation) {
    // Terrain cells.
    if (mut.Terrain) {
      let src = 0;
      let dst = 0;
      while (src < mut.Terrain.length) {
        dst += mut.Terrain[src++];    // Skip count
        let set = mut.Terrain[src++]; // Set count
        for (var i = 0; i < set; i++) {
          this._cells[dst++] = mut.Terrain[src++];
        }
      }
    }

    // Objets:
    if (mut.Objets) {
      for (var key in mut.Objets) {
        var obj = mut.Objets[key];
        if (obj.Id == 0) {
          delete this._objets[key];
        } else {
          this._objets[key] = obj;
        }
      }
    }

    this._dirty = true;
  }

  update() {
    if (!this._dirty) {
      return;
    }
    this._dirty = false;

    // Update terrain.
    this._terrain = renderTerrain(this._cells);
  }

  render(camera: Camera) {
    // Draw the terrain.
    var uniforms: WorldUniforms = {
      u_ambient: [0.3, 0.3, 0.3],
      u_lightDir: v3.normalize([-1, -2, -3]),
      u_viewProjection: camera.viewProjection(),
      u_model: m4.translation([this._cx * ChunkInterior, this._cy * ChunkInterior, this._cz * ChunkInterior])
    };

    gl.useProgram(worldProgram.program);
    twgl.setBuffersAndAttributes(gl, worldProgram, this._terrain);
    twgl.setUniforms(worldProgram, uniforms);
    gl.drawElements(gl.TRIANGLES, this._terrain.numElements, gl.UNSIGNED_SHORT, 0);

    // Draw the individual objets.
    // TODO: This could be dramatically optimized using glDrawElementsInstanced().
    for (let id in this._objets) {
      var obj = this._objets[id];
      var vec = vecFromPos(obj.Pos);
      var xform = m4.translate(uniforms.u_model, vec);
      renderObjet(camera, obj, xform);
    }
  }
}

export function cellIndex(x: number, y: number, z: number): number {
  return (z << ChunkExp2) | (y << ChunkExp) | x;
}

export function vecFromPos(pos: number): Vec3 {
  // NOTE: Must match locForSlot() in chunk.go.
  return v3.create(
    (pos >> 0) & (ChunkSize-1),
    (pos >> ChunkExp) & (ChunkSize-1),
    (pos >> ChunkExp2) & (ChunkSize-1)
  );
}
