/// <reference path="lib/threejs/three.d.ts"/>
/// <reference path="blocktypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="blocks.ts"/>
/// <reference path="math.ts"/>

module Eden {
  var Root2 = Math.sqrt(2);
  var TwoRoot2 = 2 * Root2;

  var Directions: number[][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

  interface Line {
    x: number;
    z: number;
    dir: number;
    len: number;
  }

  // TODO:
  // - Convert env to booleans to avoid the `== BlockWall` crap.
  // - Cache found lines.
  // - When caching, fill all rotations/inversions to avoid redundant work.
  // 

  // Fills the line that passes in the given direction through the given point.
  // Keeps track of already-visited points/directions in `marks`.
  function fillLine(env: number[], marks: number[], x: number, z: number, dir: number): Line {
    // Find the starting point.
    var dx = -Directions[dir][0], dz = -Directions[dir][1];
    while ((x >= 1) && (x < 4) && (z >= 1) && (z < 4) && (env[envOfs(x + dx, 2, z + dz)] == BlockWall)) {
      x += dx; z += dz;
    }

    // Walk the line.
    dx = -dx; dz = -dz;
    var bit = 1 << dir;
    var line = {x: x, z: z, dir: dir, len: 1};

    marks[envOfs(x, 2, z)] |= bit;
    while ((x+dx >= 0) && (x+dx < 5) && (z+dz >= 0) && (z+dz < 5) && (env[envOfs(x + dx, 2, z + dz)] == BlockWall)) {
      line.len++;
      x += dx; z += dz;
      marks[envOfs(x, 2, z)] |= bit;
    }

    return line;
  }

  // Finds all lines that run through a given point, adding them to the `lines` array.
  // Uses `marks` (must be the same size as `env`) to keep track of visited blocks/directions.
  function findLines(env: number[], marks: number[], lines: Line[], x: number, z: number) {
    var ofs = envOfs(x, 2, z);

    for (var dir = 0; dir < 4; dir++) {
      if ((env[ofs] != BlockWall) || (marks[ofs] & (1 << dir))) {
        continue;
      }
      var line = fillLine(env, marks, x, z, dir);
      if (line.len > 1) {
        lines.push(line);
      }
    }
  }

  // Finds all the lines that run through occupied cells in the environment.
  function findAllLines(env: number[]): Line[] {
    var marks: number[] = [];
    for (var i = 0; i < 125; i++) {
      marks[i] = 0;
    }
    var lines: Line[] = [];

    var total = 0;
    for (var x = 0; x < 5; x++) {
      for (var z = 0; z < 5; z++) {
        if (env[envOfs(x, 2, z)] == BlockWall) {
          findLines(env, marks, lines, x, z);
          total++;
        }
      }
    }

    return lines;
  }

  // Counts the number of blocks set in the given environment.
  function countBlocks(env: number[]): number {
    var total = 0;
    for (var x = 0; x < 5; x++) {
      for (var z = 0; z < 5; z++) {
        if (env[envOfs(x, 2, z)] == BlockWall) {
          total++;
        }
      }
    }

    return total;
  }

  var _count = 0;
  function optimizeLines(lines: Line[], total: number): Line[] {
    // Sort lines by descending length.
    lines.sort((a, b) => {
      return b.len - a.len;
    });

    // 'Touched' bits for each cell in the environment.
    var touched: boolean[] = [];
    for (var i = 0; i < 125; i++) {
      touched[i] = false;
    }

    _count = 0;
    return optimizeHelper(lines, total, touched);
  }

  function optimizeHelper(lines: Line[], total: number, touched: boolean[]): Line[] {
    // Find all candidate lines of equal length.
    var bestResult: Line[], bestLength = 100;
    for (var i = 0; (i < lines.length) && (lines[i].len == lines[0].len); i++) {
      var head = lines[i];
      var tail = lines.slice();
      tail = tail.slice(0, i).concat(tail.slice(i + 1));

      var result = optimizeLine(head, tail, total, touched.slice()); // Always copy `touched` (TODO: Can skip the first).
      if (result.length && result.length < bestLength) {
        bestResult = result;
        bestLength = result.length;
      }
    }

    return bestResult;
  }

  function optimizeLine(head: Line, tail: Line[], total: number, touched: boolean[]): Line[] {
    _count++;

    // Walk the line through the environment, updating `total` and `touched`.
    var anythingTouched = false;
    var x = head.x, z = head.z, dx = Directions[head.dir][0], dz = Directions[head.dir][1];
    for (var j = 0; j < head.len; j++) {
      var ofs = envOfs(x, 2, z);
      if (!touched[ofs]) {
        anythingTouched = true;
        touched[ofs] = true;
        total--;
      }
      x += dx; z += dz;
    }

    var result: Line[] = [];
    if (anythingTouched) {
      result.push(head);
      // TODO: Deal with orphan cells, or this will do too much work.
      if (total > 0) {
        if (tail.length > 0) {
          var optimized = optimizeHelper(tail, total, touched);
          if (optimized) {
            result = result.concat(optimized);
          } else {
            console.log("wut?");
          }
        }
      }
    }

    return result;
  }

  export class WallBlock implements BlockType {
    render(env: number[]): BlockGeometry {
      // Find all the lines that should be filled in.
      var lines = findAllLines(env);
      lines = optimizeLines(lines, countBlocks(env));

      console.log(envStr(env));
      console.log(">>> " + _count);

      // Find the directions of these lines if/as they cross the middle.
      var bits = 0;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var x = line.x, z = line.z, dx = Directions[line.dir][0], dz = Directions[line.dir][1];

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
