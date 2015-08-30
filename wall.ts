/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>

module Eden {
  var Root2 = Math.sqrt(2);
  var TwoRoot2 = 2 * Root2;

  export class WallBlock implements BlockType {

    render(env: number[]): BlockGeometry {
      // Start with a pillar.
      var csg = CSG.cube({ radius: [0.1, 0.5, 0.1] });

      // X wall.
      if (env[EnvWest] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }
      if (env[EnvEast] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }

      // Y wall.
      if (env[EnvNorth] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.5, 0.25] }));
      }
      if (env[EnvSouth] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.5, 0.25] }));
      }

      // XY wall.
      if (env[EnvNorthWest] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(7) }));
      }
      if (env[EnvSouthEast] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(3) }));
      }

      // YX wall.
      if (env[EnvNorthEast] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(5) }));
      }
      if (env[EnvSouthWest] == BlockWall) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(1) }));
      }

      return {
        geom: csgPolysToGeometry(csg.toPolygons()),
        mat: new THREE.MeshLambertMaterial({ color: 0xa0a0a0 })
      };
    }
  }

  function xform(eigth: number): number[] {
    var m = new THREE.Matrix4();
    m.makeRotationY(eigth * TAU / 8);
    var e = m.elements;
    return [e[0], e[1], e[2], e[4], e[5], e[6], e[8], e[9], e[10]];
  }

  registerBlock(BlockWall, new WallBlock());
}
