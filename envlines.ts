/// <reference path="blocktypes.ts"/>
/// <reference path="blocks.ts"/>

module Eden {
  export var LineDirs: number[][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

  export interface Line {
    x: number;
    z: number;
    dir: number;
    len: number;
  }

  // TODO:
  // - Convert env to booleans to avoid the `== BlockWall` crap.
  // - Cache found lines.
  //   When caching, fill all rotations/inversions to avoid redundant work.
  // - Aggressively drop lines that touch nothing after longer lines are considered.

  export function linesForEnv(env: number[]) {
    var lines = findAllLines(env);
    lines = optimizeLines(lines, countBlocks(env));

    console.log(envStr(env));
    console.log(">>> " + _count);

    return lines;
  }

  // Fills the line that passes in the given direction through the given point.
  // Keeps track of already-visited points/directions in `marks`.
  function fillLine(env: number[], marks: number[], x: number, z: number, dir: number): Line {
    // Find the starting point.
    var dx = -LineDirs[dir][0], dz = -LineDirs[dir][1];
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
    while (true) {
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

      if (!bestResult && lines.length > i) {
        // We didn't find anything at len=N, so go ahead and try the next set.
        lines = lines.slice(i);
        continue;
      }

      break;
    }

    return bestResult;
  }

  function optimizeLine(head: Line, tail: Line[], total: number, touched: boolean[]): Line[] {
    _count++;

    // Walk the line through the environment, updating `total` and `touched`.
    var anythingTouched = false;
    var x = head.x, z = head.z, dx = LineDirs[head.dir][0], dz = LineDirs[head.dir][1];
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
      if (total > 0) {
        if (tail.length > 0) {
          // TODO: Deal with orphan cells, so we can guarantee that `optimized` always contains something.
          // Fixing this will reduce unnecessary work.
          var optimized = optimizeHelper(tail, total, touched);
          if (optimized) {
            result = result.concat(optimized);
          }
        }
      }
    }

    return result;
  }
}
