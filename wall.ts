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
      // Find all the lines that should be filled in.
      var lines = linesForEnv(env);

      // Find the directions of these lines if/as they cross the middle.
      var bits = 0;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var x = line.x, z = line.z, dx = LineDirs[line.dir][0], dz = LineDirs[line.dir][1];

        for (var j = 0; j < line.len-1; j++) {
          if ((x == 2) && (z == 2)) {
            bits |= 1 << line.dir;
          } else if ((x+dx == 2) && (z+dz == 2)) {
            bits |= 0x10 << line.dir;
          }
          x += dx; z += dz;
        }
      }

      // Now render all the walls.
      // Start with a pillar (TODO: Drop the pillar if there are other walls).
      var csg = CSG.cube({ radius: [0.1, 0.45, 0.1] });

      // X wall.
      if (bits & 0x01) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0], radius: [0.225, 0.45, 0.1] }));
      }
      if (bits & 0x10) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0], radius: [0.225, 0.45, 0.1] }));
      }

      // Z wall.
      if (bits & 0x02) {
        csg = csg.union(CSG.cube({ center: [0, 0, 0.25], radius: [0.1, 0.45, 0.225] }));
      }
      if (bits & 0x20) {
        csg = csg.union(CSG.cube({ center: [0, 0, -0.25], radius: [0.1, 0.45, 0.225] }));
      }

      // XZ wall.
      if (bits & 0x04) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, 0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(3) }));
      }
      if (bits & 0x40) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, -0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(7) }));
      }

      // ZX wall.
      if (bits & 0x08) {
        csg = csg.union(CSG.cube({ center: [0.25, 0, -0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(5) }));
      }
      if (bits & 0x80) {
        csg = csg.union(CSG.cube({ center: [-0.25, 0, 0.25], radius: [0.225 * Root2, 0.45, 0.1], xform: xform(1) }));
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
