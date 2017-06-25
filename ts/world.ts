import {Chunk} from "./chunk";
import {Camera} from "./camera";
import * as proto from "./protocol";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export var ChunkExp = 4;
export var ChunkExp2 = ChunkExp * 2;
export var ChunkExp3 = ChunkExp * 3;
export var ChunkSize = 1 << ChunkExp;
export var ChunkSize2 = 1 << ChunkExp2;
export var ChunkSize3 = 1 << ChunkExp3;

export var ChunkInterior = ChunkSize - 2;

function chunkKey(cx: number, cy: number, cz: number): string {
  return "" + cx + ":" + cy + ":" + cz;
}

export class World {
  private _chunks: { [key: number]: Chunk } = {};

  constructor() {
  }

  chunk(cx: number, cy: number, cz: number): Chunk {
    return this._chunks[chunkKey(cx, cy, cz)];
  }

  chunkForPos(x: number, y: number, z: number): Chunk {
    return this.chunk(Math.floor(x / ChunkInterior), Math.floor(y / ChunkInterior), Math.floor(z / ChunkInterior));
  }

  cell(x: number, y: number, z: number): number {
    return this.chunkForPos(x, y, z).cell(x % ChunkInterior, y % ChunkInterior, z % ChunkInterior);
  }

  setCell(x: number, y: number, z: number, cell: number) {
    this.chunkForPos(x, y, z).setCell(x % ChunkInterior, y % ChunkInterior, z % ChunkInterior, cell);
  }

  setChunk(cx: number, cy: number, cz: number, cells: number[], actors: proto.Actor[]) {
    var chunk = this.ensureChunk(cx, cy, cz);
    chunk.setCells(cells);
    chunk.setActors(actors);
  }

  update() {
    for (var key in this._chunks) {
      this._chunks[key].update();
    }
  }

  render(camera: Camera) {
    // TODO: Only around camera.
    for (var key in this._chunks) {
      this._chunks[key].render(camera);
    }
  }

  ensureChunk(cx: number, cy: number, cz: number): Chunk {
    var key = chunkKey(cx, cy, cz);
    if (!(key in this._chunks)) {
      this._chunks[key] = new Chunk(cx, cy, cz);
    }
    return this._chunks[key];
  }
}
