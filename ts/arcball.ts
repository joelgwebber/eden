import Vec3 = twgl.Vec3;
import Mat4 = twgl.Mat4;
import v3 = twgl.v3;
import m4 = twgl.m4;

const EPSILON = 1e-8;

// Quaternion multiplication
function qmult(a: number[], b: number[]): number[] {
  return [a[0]*b[0] - a[1]*b[1] - a[2]*b[2] - a[3]*b[3],
          a[0]*b[1] + a[1]*b[0] + a[2]*b[3] - a[3]*b[2],
          a[0]*b[2] + a[2]*b[0] + a[3]*b[1] - a[1]*b[3],
          a[0]*b[3] + a[3]*b[0] + a[1]*b[2] - a[2]*b[1]];
}

// Converts a quaternion to a matrix
function qmatrix(q: number[]): number[][] {
  return [[1 - 2*q[2]*q[2] - 2*q[3]*q[3],     2*q[1]*q[2] - 2*q[3]*q[0],     2*q[1]*q[3] + 2*q[2]*q[0]],
          [    2*q[1]*q[2] + 2*q[3]*q[0], 1 - 2*q[1]*q[1] - 2*q[3]*q[3],     2*q[2]*q[3] - 2*q[1]*q[0]],
          [    2*q[1]*q[3] - 2*q[2]*q[0],     2*q[2]*q[3] + 2*q[1]*q[0], 1 - 2*q[1]*q[1] - 2*q[2]*q[2]]];
}

function qcross(a: number[], b: number[]): number[] {
  // Normalize a and b.
  var la = 0.0;
  var lb = 0.0;
  for (var i = 0; i < 3; ++i) {
    la += a[i] * a[i];
    lb += b[i] * b[i];
  }
  if (la > EPSILON) {
    la = 1.0 / Math.sqrt(la);
  }
  if (lb > EPSILON) {
    lb = 1.0 / Math.sqrt(lb);
  }
  var na = new Array(3);
  var nb = new Array(3);
  for (var i = 0; i < 3; ++i) {
    na[i] = a[i] * la;
    nb[i] = b[i] * lb;
  }

  // Compute quaternion cross of a and b.
  var r = new Array(4);
  var s = 0.0;
  for (var i = 0; i < 3; ++i) {
    var u = (i + 1) % 3;
    var v = (i + 2) % 3;
    r[i + 1] = na[u] * nb[v] - na[v] * nb[u];
    s += Math.pow(r[i + 1], 2);
  }
  r[0] = Math.sqrt(1.0 - s);
  return r;
}

// Normalize a quaternion.
function qnormalize(q) {
  var s = 0.0;
  for(var i=0; i<4; ++i) {
    s += q[i] * q[i];
  }
  if(s < EPSILON) {
    return [1.0, 0.0, 0.0, 0.0];
  }
  s = 1.0 / Math.sqrt(s);
  var r = new Array(4);
  for(var i=0; i<4; ++i) {
    r[i] = q[i] * s;
  }
  return r;
}

export interface ArcballFlags {
  rotate?: boolean;
  pan?: boolean;
  zoom?: boolean;
}

export class Arcball {
  rotation: number[];
  translation: number[];
  zoom_factor: number;
  z_plane: number;
  pan_speed: number;
  zoom_speed: number;
  private last_x: number;
  private last_y: number;

  // Assumes z-direction is view axis.
  constructor() {
    this.rotation     = [1.0, 0.0, 0.0, 0.0];
    this.translation  = [0.0, 0.0, 0.0];
    this.zoom_factor  = 0.0;

    this.z_plane      = 0.5;
    this.pan_speed    = 20.0;
    this.zoom_speed   = 1.0;

    this.last_x       = 0.0;
    this.last_y       = 0.0;
  }

  // Call this whenever the mouse moves.
  update(mx: number, my: number, flags: ArcballFlags) {
    if (flags.rotate) {
      var v0 = [this.last_x, -this.last_y, this.z_plane];
      var v1 = [mx, -my, this.z_plane];
      this.rotation = qnormalize(qmult(qcross(v0, v1), this.rotation));
    }
    if (flags.pan || flags.zoom) {
      var rmatrix = qmatrix(this.rotation);

      var dx = mx - this.last_x;
      var dy = this.last_y - my;

      var pan_speed  = flags.pan  ? this.pan_speed  : 0.0;
      var zoom_speed = flags.zoom ? this.zoom_speed : 0.0;

      for(var i=0; i<3; ++i) {
        this.translation[i] += pan_speed * (dx * rmatrix[0][i] + dy * rmatrix[1][i]);
      }

      this.zoom_factor += zoom_speed * dy;
    }
    this.last_x = mx;
    this.last_y = my;
  }

  // Returns the camera matrix.
  matrix(): number[][] {
    var rmatrix = qmatrix(this.rotation);
    var result = new Array(4);
    var scale = Math.exp(this.zoom_factor);
    for (var i = 0; i < 4; ++i) {
      if (i < 3) {
        result[i] = new Array(4);
        result[i][3] = 0.0;
        for (var j = 0; j < 3; ++j) {
          result[i][j] = rmatrix[i][j] * scale;
          result[i][3] += rmatrix[i][j] * this.translation[j] * scale;
        }
      } else {
        result[i] = [0.0, 0.0, 0.0, 1.0];
      }
    }
    return result;
  }

  // TODO: wrong.
  mat4(): twgl.Mat4 {
    var m = this.matrix();
    var r = m4.identity();

    var c = 0;
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        r[c++] = m[i][j];
      }
    }
    return r;
  }
}
