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

  export function geomForEnv(env: number[]): BlockGeometry {
    var key = envKey(env);
    if (!(key in _geomCache)) {
      // Crappy on/off blocks for now.
      var bt = blockTypes[env[13]];
      if (bt) {
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
