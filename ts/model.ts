import {Tau} from "./math";
import * as csg from "./csg";

import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

export class Model {
  private _code: string;
  private _buf: twgl.BufferInfo;

  constructor() {
    this.setCode("");
  }

  buffer(): twgl.BufferInfo {
    return this._buf;
  }

  // Sets the code used to render this model.
  // Note: It explicitly throws a string with any errors in the code,
  //   leaving the buffer alone.
  setCode(code: string) {
    var _model = new csg.Model();
    var _stack: StackFrame[] = [{
      xf: m4.identity(),
      color: [1, 1, 1]
    }];

    let _top = () => _stack[_stack.length - 1];

    let reset = () => {
      m4.identity(_top().xf);
      _top().color = [1, 1, 1];
    };

    let push = () => {
      let top = _top();
      _stack.push({
        xf: m4.copy(top.xf),
        color: v3.copy(top.color)
      })
    };

    let pop = () => {
      if (_stack.length == 1) {
        throw "cannot pop last frame";
      }
      _stack.pop();
    };

    let color = (x: number, y: number, z: number) => {
      validateArgs([x, y, z], "number");
      _top().color = [x, y, z];
    };

    let move = (x: number, y: number, z: number) => {
      validateArgs([x, y, z], "number");
      m4.translate(_top().xf, v3.create(x, y, z), _top().xf);
    };

    let movex = (x: number) => {
      validateArgs([x], "number");
      m4.translate(_top().xf, v3.create(x, 0, 0), _top().xf);
    };

    let movey = (y: number) => {
      validateArgs([y], "number");
      m4.translate(_top().xf, v3.create(0, y, 0), _top().xf);
    };

    let movez = (z: number) => {
      validateArgs([z], "number");
      m4.translate(_top().xf, v3.create(0, 0, z), _top().xf);
    };

    let scale = (x: number, y: number, z: number) => {
      validateArgs([x, y, z], "number");
      m4.scale(_top().xf, v3.create(x, y, z), _top().xf);
    };

    let rotx = (x: number) => {
      validateArgs([x], "number");
      m4.rotateX(_top().xf, x * Tau / 360, _top().xf);
    };

    let roty = (y: number) => {
      validateArgs([y], "number");
      m4.rotateY(_top().xf, y * Tau / 360, _top().xf);
    };

    let rotz = (z: number) => {
      validateArgs([z], "number");
      m4.rotateZ(_top().xf, z * Tau / 360, _top().xf);
    };

    let box = () => {
      var top = _top();
      var cube = csg.cube({color: top.color as number[], radius: [0.5, 0.5, 0.5], xform: top.xf});
      _model = _model.union(cube);
    };

    let ball = () => {
      var top = _top();
      var cube = csg.sphere({color: top.color as number[], radius: 0.5, xform: top.xf});
      _model = _model.union(cube);
    };

    let can = () => {
      var top = _top();
      var cube = csg.cylinder({color: top.color as number[], radius: 0.5, xform: top.xf});
      _model = _model.union(cube);
    };

    // Evaluate the code, allowing any errors to throw.
    // Only set this._code and _buffer if it succeeds.
    eval(code);
    this._code = code;
    this._buf = csg.polysToBuffers(_model.toPolygons());
  }
}

function validateArgs(args: any[], type: string) {
  for (var i = 0; i < args.length; i++) {
    if (typeof args[i] != type) {
      throw "arg " + args[i] + " type '" + typeof(args[i]) + "' - expected " + type;
    }
  }
}

interface StackFrame {
  xf: Mat4;
  color: Vec3;
}
