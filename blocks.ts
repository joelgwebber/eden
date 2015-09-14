/// <reference path="blocktypes.ts"/>
/// <reference path="wall.ts"/>
/// <reference path="floor.ts"/>

module Eden {

  export interface BlockGeometry {
    geom: THREE.Geometry;
    mat: THREE.Material;
  }

  export interface BlockType {
    render(env: number[]): BlockGeometry;
  }

  var _geomCache: {[key: string]: BlockGeometry } = {};

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

  export function geomForEnv(x: number, y: number, z: number, env: number[]): BlockGeometry {
    var key = envKey(env);
    if (!(key in _geomCache)) {
      var bt = blockTypes[env[envOfsCenter(0, 0, 0)]];
      if (bt) {
        console.log(">>> " + x + ", " + y + ", " + z);
        _geomCache[key] = bt.render(env);
      } else {
        _geomCache[key] = null;
      }
    }

    return _geomCache[key];
  }

  export function csgPolysToGeometry(polys: CSG.Polygon[]): THREE.Geometry {
    var geom = new THREE.Geometry();
    var vidx = 0;
    for (var i = 0; i < polys.length; i++) {
      var p = polys[i];

      // Triangulate CSG polys, which can be convex polygons of any number of verts.
      for (var j = 0; j < p.vertices.length - 2; j++) {
        geom.vertices.push(csgVecToThree(p.vertices[0].pos));
        for (var k = 0; k < 2; k++) {
          geom.vertices.push(csgVecToThree(p.vertices[(j+k+1)%p.vertices.length].pos));
        }
        geom.faces.push(new THREE.Face3(vidx, vidx+1, vidx+2, csgVecToThree(p.vertices[0].normal)));
        vidx += 3;
      }
    }
    return geom;
  }

  function csgVecToThree(vert: CSG.Vector): THREE.Vector3 {
    return new THREE.Vector3(vert.x, vert.y, vert.z);
  }

  function envKey(env: number[]): string {
    return env.toString();
  }
}
