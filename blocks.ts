/// <reference path="blocktypes.ts"/>
/// <reference path="wall.ts"/>
/// <reference path="floor.ts"/>

module Eden {

  export interface BlockType {
    render(env: number[]): twgl.BufferInfo;
  }

  var _geomCache: {[key: string]: twgl.BufferInfo } = {};

  // HACK: Just prints out y=2 plane for now.
  export function envStr(env: number[]): string {
    var s = "";
    for (var z = 0; z < 5; z++) {
      for (var x = 0; x < 5; x++) {
        s += "" + env[envOfs(x, 2, z)] + " ";
      }
      s += "\n";
    }
    return s;
  }

  export function envOfs(x: number, y: number, z: number): number {
    return (y * 25) + (z * 5) + x;
  }

  export function envOfsCenter(dx: number, dy: number, dz: number): number {
    return 62 + (dy * 25) + (dz * 5) + dx;
  }

  export function geomForEnv(x: number, y: number, z: number, env: number[]): twgl.BufferInfo {
    var key = envKey(env);
    if (!(key in _geomCache)) {
      var bt = blockTypes[env[envOfsCenter(0, 0, 0)]];
      if (bt) {
        _geomCache[key] = bt.render(env);
      } else {
        _geomCache[key] = null;
      }
    }

    return _geomCache[key];
  }

  // TODO: Vertex sharing.
  export function csgPolysToBuffers(polys: CSG.Polygon[]): twgl.BufferInfo {
    var arrays: {[name: string]: number[]} = { position: [], normal: [], indices: [] };

    var vidx = 0;
    for (var i = 0; i < polys.length; i++) {
      var p = polys[i];

      // Triangulate CSG polys, which can be convex polygons of any number of verts.
      for (var j = 0; j < p.vertices.length - 2; j++) {
        pushVector(arrays["position"], p.vertices[0].pos);
        pushVector(arrays["normal"], p.vertices[0].normal);
        for (var k = 0; k < 2; k++) {
          var idx = (j + k + 1) % p.vertices.length;
          pushVector(arrays["position"], p.vertices[idx].pos);
          pushVector(arrays["normal"], p.vertices[idx].normal);
        }
        arrays["indices"].push(vidx+0);
        arrays["indices"].push(vidx+1);
        arrays["indices"].push(vidx+2);

        vidx += 3;
      }
    }
    return twgl.createBufferInfoFromArrays(gl, arrays);
  }

  function pushVector(a: number[], v: CSG.Vector) {
    a.push(v.x);
    a.push(v.y);
    a.push(v.z);
  }

  function envKey(env: number[]): string {
    return env.toString();
  }
}
