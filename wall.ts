/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>
/// <reference path="envlines.ts"/>

module Eden {
  var Root2 = Math.sqrt(2);
  var TwoRoot2 = 2 * Root2;

  export class WallBlock implements BlockType {
    render(env: number[]): BlockGeometry {
      var bits = bitsForEnv(env);

      // Now render all the walls.
      // Start with a pillar (TODO: Drop the pillar if there are other walls).
      // TODO: Start with empty model if any pair of opposite walls is present (east-west, etc).
      var csg = CSG.cube({ radius: [0.1, 0.5, 0.1] });

      // X wall.
      if (bits & EAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }
      if (bits & WEST_BIT) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.25, 0.5, 0.1] }));
      }

      // Z wall.
      if (bits & SOUTH_BIT) {
        csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.5, 0.25] }));
      }
      if (bits & NORTH_BIT) {
        csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.5, 0.25] }));
      }

      // XZ wall.
      if (bits & SOUTHEAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(3) }));
      }
      if (bits & NORTHWEST_BIT) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(7) }));
      }

      // ZX wall.
      if (bits & NORTHEAST_BIT) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, -0.25], radius: [0.25 * Root2, 0.5, 0.1], xform: xform(5) }));
      }
      if (bits & SOUTHWEST_BIT) {
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
