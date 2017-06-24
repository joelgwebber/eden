/// <reference path="tsUnit.ts"/>
/// <reference path="wall.ts"/>
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

  var cases: { env: number[]; bits: number; }[] = [
    {
      env: onePlane([
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        1, 1, 1, 1, 1,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0
      ]),
      bits: Eden.WEST_BIT | Eden.EAST_BIT
    },
    {
      env: onePlane([
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 1, 1, 1,
        0, 0, 1, 1, 0,
        0, 0, 1, 0, 1
      ]),
      bits: Eden.EAST_BIT | Eden.SOUTH_BIT | Eden.SOUTHEAST_BIT
    }
  ];

  export class WallTests extends tsUnit.TestClass {

    testLinesForEnv() {
      for (var i = 0; i < cases.length; i++) {
        var act = Eden.bitsForEnv(cases[i].env);
        if (cases[i].bits != act) {
          throw "Failed on case " + i;
        }
      }
    }
  }
}

var test = new tsUnit.Test(EdenTests);
test.showResults(document.getElementById('result'), test.run());
