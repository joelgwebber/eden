/// <reference path="blocktypes.ts"/>
/// <reference path="blocks.ts"/>

module Eden {

  export interface Line {
    u: number;
    v: number;
    dir: number;
    len: number;
    hit: number;
    bits?: number;
  }

  export const EAST_BIT = 0x01;
  export const WEST_BIT = 0x10;

  export const SOUTH_BIT = 0x02;
  export const NORTH_BIT = 0x20;

  export const SOUTHEAST_BIT = 0x04;
  export const NORTHWEST_BIT = 0x40;

  export const NORTHEAST_BIT = 0x08;
  export const SOUTHWEST_BIT = 0x80;

  export var LineDirs: number[][] = [[1, 0], [0, 1], [1, 1], [1, -1]];

  var AllLines: Line[] = [
    { dir: 0, u: 0, v: 0, len: 5, hit: 0 },
    { dir: 0, u: 0, v: 1, len: 5, hit: 0 },
    { dir: 0, u: 0, v: 2, len: 5, hit: 0, bits: WEST_BIT | EAST_BIT },
    { dir: 0, u: 0, v: 3, len: 5, hit: 0 },
    { dir: 0, u: 0, v: 4, len: 5, hit: 0 },

    { dir: 1, u: 0, v: 0, len: 5, hit: 0 },
    { dir: 1, u: 1, v: 0, len: 5, hit: 0 },
    { dir: 1, u: 2, v: 0, len: 5, hit: 0, bits: NORTH_BIT | SOUTH_BIT },
    { dir: 1, u: 3, v: 0, len: 5, hit: 0 },
    { dir: 1, u: 4, v: 0, len: 5, hit: 0 },

    { dir: 2, u: 0, v: 3, len: 2, hit: 0 },
    { dir: 2, u: 0, v: 2, len: 3, hit: 0 },
    { dir: 2, u: 0, v: 1, len: 4, hit: 0 },
    { dir: 2, u: 0, v: 0, len: 5, hit: 0, bits: NORTHWEST_BIT | SOUTHEAST_BIT },
    { dir: 2, u: 1, v: 0, len: 4, hit: 0 },
    { dir: 2, u: 2, v: 0, len: 3, hit: 0 },
    { dir: 2, u: 3, v: 0, len: 2, hit: 0 },

    { dir: 3, u: 0, v: 1, len: 2, hit: 0 },
    { dir: 3, u: 0, v: 2, len: 3, hit: 0 },
    { dir: 3, u: 0, v: 3, len: 4, hit: 0 },
    { dir: 3, u: 0, v: 4, len: 5, hit: 0, bits: SOUTHWEST_BIT | NORTHEAST_BIT },
    { dir: 3, u: 1, v: 4, len: 4, hit: 0 },
    { dir: 3, u: 2, v: 4, len: 3, hit: 0 },
    { dir: 3, u: 3, v: 4, len: 2, hit: 0 }
  ];

  function copyLine(l: Line): Line {
    return { u: l.u, v: l.v, dir: l.dir, len: l.len, hit: l.hit, bits: l.bits };
  }

  function penvOfs(u: number, v: number): number {
    return (u * 5) + v;
  }

  function penvOfsCenter(du: number, dv: number): number {
    return 12 + (dv * 5) + du;
  }

  // TODO:
  // - Convert env to booleans to avoid the `== BlockWall` crap.
  // - Cache found lines.
  //   When caching, fill all rotations/inversions to avoid redundant work.

  // TODO: Explain.
  export function bitsForEnv(env: number[]): number {
    // Get bits for filled lines.
    var lines = findAllLines(env);
    lines = optimizeLines(lines, env);

    var bits = 0;
    for (var i = 0; i < lines.length; i++) {
      if (lines[i].bits) {
        bits |= lines[i].bits;
      }
    }

    // And bits for the immediate environment.
    var envbits = 0;
    if (env[penvOfsCenter(-1, 0)] == BlockWall) { envbits |= WEST_BIT; }
    if (env[penvOfsCenter( 1, 0)] == BlockWall) { envbits |= EAST_BIT; }
    if (env[penvOfsCenter( 0,-1)] == BlockWall) { envbits |= NORTH_BIT; }
    if (env[penvOfsCenter( 0, 1)] == BlockWall) { envbits |= SOUTH_BIT; }
    if (env[penvOfsCenter(-1,-1)] == BlockWall) { envbits |= NORTHWEST_BIT; }
    if (env[penvOfsCenter( 1, 1)] == BlockWall) { envbits |= SOUTHEAST_BIT; }
    if (env[penvOfsCenter(-1, 1)] == BlockWall) { envbits |= SOUTHWEST_BIT; }
    if (env[penvOfsCenter( 1,-1)] == BlockWall) { envbits |= NORTHEAST_BIT; }

    // Walls go wherever both are set.
    return bits & envbits;
  }

  function findAllLines(env: number[]): Line[] {
    var lines: Line[] = [];
    for (var i = 0; i < AllLines.length; ++i) {
      var line = copyLine(AllLines[i]);
      var u = line.u, v = line.v;
      var du = LineDirs[line.dir][0], dv = LineDirs[line.dir][1];
      for (var j = 0; j < line.len; j++) {
        if (env[penvOfs(u, v)] == BlockWall) {
          line.hit++;
        }
        u += du; v += dv;
      }
      if (line.hit > 0) {
        lines.push(line);
      }
    }
    return lines;
  }

  // Counts the number of blocks set in the given environment.
  function countBlocks(env: number[]): number {
    var total = 0;
    for (var u = 0; u < 5; u++) {
      for (var v = 0; v < 5; v++) {
        if (env[penvOfs(u, v)] == BlockWall) {
          total++;
        }
      }
    }

    return total;
  }

  var _count = 0;
  function optimizeLines(lines: Line[], env: number[]): Line[] {
    var total = countBlocks(env);

    // Sort lines by descending length.
    lines.sort((a, b) => {
      return b.hit - a.hit;
    });

    // 'Touched' bits for each cell in the environment.
    var touched: boolean[] = [];
    for (var i = 0; i < 125; i++) {
      touched[i] = false;
    }

    _count = 0;
    return optimizeHelper(lines, total, env, touched);
  }

  function optimizeHelper(lines: Line[], total: number, env: number[], touched: boolean[]): Line[] {
    // Find all candidate lines of equal length.
    var bestResult: Line[], bestLength = 100;
    while (true) {
      for (var i = 0; (i < lines.length) && (lines[i].hit == lines[0].hit); i++) {
        var head = lines[i];
        var tail = lines.slice();
        tail = tail.slice(0, i).concat(tail.slice(i + 1));

        var result = optimizeLine(head, tail, total, env, touched.slice()); // Always copy `touched` (TODO: Can skip the first).
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

  function optimizeLine(head: Line, tail: Line[], total: number, env: number[], touched: boolean[]): Line[] {
    _count++;

    // Walk the line through the environment, updating `total` and `touched`.
    var anythingTouched = false;
    var u = head.u, v = head.v, du = LineDirs[head.dir][0], dv = LineDirs[head.dir][1];
    for (var j = 0; j < head.len; j++) {
      var ofs = penvOfs(u, v);
      if (env[ofs] == BlockWall && !touched[ofs]) {
        anythingTouched = true;
        touched[ofs] = true;
        total--;
      }
      u += du; v += dv;
    }

    var result: Line[] = [];
    if (anythingTouched) {
      result.push(head);
      if (total > 0) {
        if (tail.length > 0) {
          // TODO: Deal with orphan cells, so we can guarantee that `optimized` always contains something.
          // Fixing this will reduce unnecessary work.
          var optimized = optimizeHelper(tail, total, env, touched);
          if (optimized) {
            result = result.concat(optimized);
          }
        }
      }
    }

    return result;
  }
}
