/// <reference path="tsUnit.ts"/>
/// <reference path="envlines.ts"/>

module EdenTests {

  function onePlane(plane: number[]): number[] {
    var env: number[] = [];
    for (var i = 0; i < 125; i++) {
      env[i] = 0;
    }
    for (var i = 0; i < 25; i++) {
      env[50 + i] = plane[i];
    }
    return env;
  }

  function lineEq(exp: Eden.Line, act: Eden.Line): boolean {
    return (exp.dir == act.dir) &&
      (exp.len == act.len) &&
      (exp.x == act.x) &&
      (exp.z == act.z);
  }

  function linesMatch(exp: Eden.Line[], act: Eden.Line[]) {
    if (exp.length != act.length) {
      return false;
    }

    var matches = 0;
    for (var i = 0; i < exp.length; i++) {
      for (var j = 0; j < act.length; j++) {
        if (lineEq(exp[i], act[j])) {
          matches++;
          break;
        }
      }
    }

    return matches == exp.length;
  }

  var cases: { env: number[]; lines: Eden.Line[]; }[] = [
    {
      env: onePlane([
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        1, 1, 1, 1, 1,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]),
      lines: [
        { x: 0, z: 2, dir: 0, len: 5 }
      ]
    },
    {
      env: onePlane([
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0,
        1, 1, 1, 1, 1,
        0, 0, 1, 0, 0,
        0, 0, 1, 0, 0
      ]),
      lines: [
        { x: 2, z: 0, dir: 1, len: 5 },
        { x: 0, z: 2, dir: 0, len: 5 }
      ]
    }
  ];

  export class WallTests extends tsUnit.TestClass {

    testLinesForEnv() {
      for (var i = 0; i < cases.length; i++) {
        var act = Eden.linesForEnv(cases[i].env);
        if (!linesMatch(cases[i].lines, act)) {
          throw "Failed on case " + i;
        }
      }
    }
  }
}

var test = new tsUnit.Test(EdenTests);
test.showResults(document.getElementById('result'), test.run());
