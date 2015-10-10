// Constructive Solid Geometry (CSG) is a modeling technique that uses Boolean
// operations like union and intersection to combine 3D solids. This library
// implements CSG operations on meshes elegantly and concisely using BSP trees,
// and is meant to serve as an easily understandable implementation of the
// algorithm. All edge cases involving overlapping coplanar polygons in both
// solids are correctly handled.
//
// Example usage:
//
//     var cube = CSG.cube();
//     var sphere = CSG.sphere({ radius: 1.3 });
//     var polygons = cube.subtract(sphere).toPolygons();
//
// ## Implementation Details
//
// All CSG operations are implemented in terms of two functions, `clipTo()` and
// `invert()`, which remove parts of a BSP tree inside another BSP tree and swap
// solid and empty space, respectively. To find the union of `a` and `b`, we
// want to remove everything in `a` inside `b` and everything in `b` inside `a`,
// then combine polygons from `a` and `b` into one solid:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     a.build(b.allPolygons());
//
// The only tricky part is handling overlapping coplanar polygons in both trees.
// The code above keeps both copies, but we need to keep them in one tree and
// remove them in the other tree. To remove them from `b` we can clip the
// inverse of `b` against `a`. The code for union now looks like this:
//
//     a.clipTo(b);
//     b.clipTo(a);
//     b.invert();
//     b.clipTo(a);
//     b.invert();
//     a.build(b.allPolygons());
//
// Subtraction and intersection naturally follow from set operations. If
// union is `A | B`, subtraction is `A - B = ~(~A | B)` and intersection is
// `A & B = ~(~A | ~B)` where `~` is the complement operator.
//
// ## License
//
// Copyright (c) 2011 Evan Wallace (http://madebyevan.com/), under the MIT license.
// Adapted to Typescript and extended by Joel Webber (jgw@pobox.com).

module CSG {

  // Holds a binary space partition tree representing a 3D solid. Two solids can
  // be combined using the `union()`, `subtract()`, and `intersect()` methods.
  export class Model {
    polygons: Polygon[];

    constructor() {
      this.polygons = [];
    }

    // Construct a CSG solid from a list of `Polygon` instances.
    static fromPolygons(polygons) {
      var csg = new Model();
      csg.polygons = polygons;
      return csg;
    }

    clone() {
      var csg = new Model();
      csg.polygons = this.polygons.map(function(p) { return p.clone(); });
      return csg;
    }

    toPolygons() {
      return this.polygons;
    }

    // Return a new CSG solid representing space in either this solid or in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    //
    //     A.union(B)
    //
    //     +-------+            +-------+
    //     |       |            |       |
    //     |   A   |            |       |
    //     |    +--+----+   =   |       +----+
    //     +----+--+    |       +----+       |
    //          |   B   |            |       |
    //          |       |            |       |
    //          +-------+            +-------+
    //
    union(csg: Model) {
      var a = new Node(this.clone().polygons);
      var b = new Node(csg.clone().polygons);
      a.clipTo(b);
      b.clipTo(a);
      b.invert();
      b.clipTo(a);
      b.invert();
      a.build(b.allPolygons());
      return Model.fromPolygons(a.allPolygons());
    }

    // Return a new CSG solid representing space in this solid but not in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    //
    //     A.subtract(B)
    //
    //     +-------+            +-------+
    //     |       |            |       |
    //     |   A   |            |       |
    //     |    +--+----+   =   |    +--+
    //     +----+--+    |       +----+
    //          |   B   |
    //          |       |
    //          +-------+
    //
    subtract(csg: Model) {
      var a = new Node(this.clone().polygons);
      var b = new Node(csg.clone().polygons);
      a.invert();
      a.clipTo(b);
      b.clipTo(a);
      b.invert();
      b.clipTo(a);
      b.invert();
      a.build(b.allPolygons());
      a.invert();
      return Model.fromPolygons(a.allPolygons());
    }

    // Return a new CSG solid representing space both this solid and in the
    // solid `csg`. Neither this solid nor the solid `csg` are modified.
    //
    //     A.intersect(B)
    //
    //     +-------+
    //     |       |
    //     |   A   |
    //     |    +--+----+   =   +--+
    //     +----+--+    |       +--+
    //          |   B   |
    //          |       |
    //          +-------+
    //
    intersect(csg: Model) {
      var a = new Node(this.clone().polygons);
      var b = new Node(csg.clone().polygons);
      a.invert();
      b.clipTo(a);
      b.invert();
      a.clipTo(b);
      b.clipTo(a);
      a.build(b.allPolygons());
      a.invert();
      return Model.fromPolygons(a.allPolygons());
    }

    // Return a new CSG solid with solid and empty space switched. This solid is
    // not modified.
    inverse() {
      var csg = this.clone();
      csg.polygons.map(function(p) { p.flip(); });
      return csg;
    }
  }

  // Construct an empty model.
  export function empty(): Model {
    return Model.fromPolygons([]);
  }

  // Construct an axis-aligned solid cuboid. Optional parameters are `center`,
  // `radius`, and `xform`, which default to `[0, 0, 0]` and `[1, 1, 1]` and
  // the 3x3 identity matrix.
  //
  // Example code:
  //
  //     var cube = CSG.cube({
  //       center: [0, 0, 0],
  //       radius: [1, 1, 1],
  //       xform: [1, 0, 0, 0, 1, 0, 0, 0, 1]
  //     });
  export function cube(options?: { center?: number[]; radius?: number[]; xform?: number[] }) {
    var c = Vector.fromArray(options.center || [0, 0, 0]);
    var r = options.radius ? options.radius : [1, 1, 1];
    return Model.fromPolygons([
      [[0, 4, 6, 2], [-1, 0, 0]],
      [[1, 3, 7, 5], [+1, 0, 0]],
      [[0, 1, 5, 4], [0, -1, 0]],
      [[2, 6, 7, 3], [0, +1, 0]],
      [[0, 2, 3, 1], [0, 0, -1]],
      [[4, 5, 7, 6], [0, 0, +1]]
    ].map(function(info) {
      return new Polygon(info[0].map(function(i: number): Vertex {
        var pos = new Vector(
          r[0] * (2 * (i & 1 ? 1 : 0) - 1),
          r[1] * (2 * (i & 2 ? 1 : 0) - 1),
          r[2] * (2 * (i & 4 ? 1 : 0) - 1)
          );
        var normal = Vector.fromArray(info[1]);
        if (options.xform) {
          pos = pos.mat3Times(options.xform);
          normal = normal.mat3Times(options.xform);
        }
        pos.x += c.x;
        pos.y += c.y;
        pos.z += c.z;
        return new Vertex(pos, normal);
      }));
    }));
  }

  // Construct a solid sphere. Optional parameters are `center`, `radius`,
  // `slices`, and `stacks`, which default to `[0, 0, 0]`, `1`, `16`, and `8`.
  // The `slices` and `stacks` parameters control the tessellation along the
  // longitude and latitude directions.
  //
  // Example usage:
  //
  //     var sphere = CSG.sphere({
  //       center: [0, 0, 0],
  //       radius: 1,
  //       slices: 16,
  //       stacks: 8
  //     });
  export function sphere(options?: { center?: number[]; radius?: number; slices?: number; stacks?: number; }) {
    var c = Vector.fromArray(options.center || [0, 0, 0]);
    var r = options.radius || 1;
    var slices = options.slices || 16;
    var stacks = options.stacks || 8;
    var polygons = [], vertices;

    function vertex(theta, phi) {
      theta *= Math.PI * 2;
      phi *= Math.PI;
      var dir = new Vector(
        Math.cos(theta) * Math.sin(phi),
        Math.cos(phi),
        Math.sin(theta) * Math.sin(phi)
        );
      vertices.push(new Vertex(c.plus(dir.times(r)), dir));
    }

    for (var i = 0; i < slices; i++) {
      for (var j = 0; j < stacks; j++) {
        vertices = [];
        vertex(i / slices, j / stacks);
        if (j > 0) {
          vertex((i + 1) / slices, j / stacks);
        }
        if (j < stacks - 1) {
          vertex((i + 1) / slices, (j + 1) / stacks);
        }
        vertex(i / slices, (j + 1) / stacks);
        polygons.push(new Polygon(vertices));
      }
    }
    return Model.fromPolygons(polygons);
  }

  // Construct a solid cylinder. Optional parameters are `start`, `end`,
  // `radius`, and `slices`, which default to `[0, -1, 0]`, `[0, 1, 0]`, `1`, and
  // `16`. The `slices` parameter controls the tessellation.
  //
  // Example usage:
  //
  //     var cylinder = CSG.cylinder({
  //       start: [0, -1, 0],
  //       end: [0, 1, 0],
  //       radius: 1,
  //       slices: 16
  //     });
  export function cylinder(options?: { start?: number[]; end?: number[]; radius?: number; slices?: number; }) {
    var s = Vector.fromArray(options.start || [0, -1, 0]);
    var e = Vector.fromArray(options.end || [0, 1, 0]);
    var ray = e.minus(s);
    var r = options.radius || 1;
    var slices = options.slices || 16;
    var axisZ = ray.unit(), isY = (Math.abs(axisZ.y) > 0.5);
    var axisX = new Vector(isY ? 1 : 0, isY ? 0 : 1, 0).cross(axisZ).unit();
    var axisY = axisX.cross(axisZ).unit();
    var start = new Vertex(s, axisZ.negated());
    var end = new Vertex(e, axisZ.unit());
    var polygons = [];

    function point(stack, slice, normalBlend) {
      var angle = slice * Math.PI * 2;
      var out = axisX.times(Math.cos(angle)).plus(axisY.times(Math.sin(angle)));
      var pos = s.plus(ray.times(stack)).plus(out.times(r));
      var normal = out.times(1 - Math.abs(normalBlend)).plus(axisZ.times(normalBlend));
      return new Vertex(pos, normal);
    }

    for (var i = 0; i < slices; i++) {
      var t0 = i / slices, t1 = (i + 1) / slices;
      polygons.push(new Polygon([start, point(0, t0, -1), point(0, t1, -1)]));
      polygons.push(new Polygon([point(0, t1, 0), point(0, t0, 0), point(1, t0, 0), point(1, t1, 0)]));
      polygons.push(new Polygon([end, point(1, t1, 1), point(1, t0, 1)]));
    }
    return Model.fromPolygons(polygons);
  }

  // Represents a 3D vector.
  //
  // Example usage:
  //
  //     new CSG.Vector(1, 2, 3);
  //     new CSG.Vector([1, 2, 3]);
  export class Vector {
    static fromArray(a: number[]) {
      return new Vector(a[0], a[1], a[2]);
    }

    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    clone(): Vector {
      return new Vector(this.x, this.y, this.z);
    }

    negated(): Vector {
      return new Vector(-this.x, -this.y, -this.z);
    }

    plus(a: Vector): Vector {
      return new Vector(this.x + a.x, this.y + a.y, this.z + a.z);
    }

    minus(a: Vector): Vector {
      return new Vector(this.x - a.x, this.y - a.y, this.z - a.z);
    }

    times(a: number): Vector {
      return new Vector(this.x * a, this.y * a, this.z * a);
    }

    dividedBy(a: number): Vector {
      return new Vector(this.x / a, this.y / a, this.z / a);
    }

    dot(a: Vector): number {
      return this.x * a.x + this.y * a.y + this.z * a.z;
    }

    lerp(a: Vector, t: number): Vector {
      return this.plus(a.minus(this).times(t));
    }

    length(): number {
      return Math.sqrt(this.dot(this));
    }

    unit(): Vector {
      return this.dividedBy(this.length());
    }

    cross(a: Vector): Vector {
      return new Vector(
        this.y * a.z - this.z * a.y,
        this.z * a.x - this.x * a.z,
        this.x * a.y - this.y * a.x
        );
    }

    mat3Times(xf: number[]): Vector {
      return new Vector(
        xf[0] * this.x + xf[3] * this.y + xf[6] * this.z,
        xf[1] * this.x + xf[4] * this.y + xf[7] * this.z,
        xf[2] * this.x + xf[5] * this.y + xf[8] * this.z
        );
    }
  }

  // Represents a vertex of a polygon. Use your own vertex class instead of this
  // one to provide additional features like texture coordinates and vertex
  // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
  // `flip()`, and `interpolate()` methods that behave analogous to the ones
  // defined by `CSG.Vertex`. This class provides `normal` so convenience
  // functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
  // is not used anywhere else.
  export class Vertex {
    pos: Vector;
    normal: Vector;

    constructor(pos, normal) {
      this.pos = pos.clone();
      this.normal = normal.clone();
    }

    clone() {
      return new Vertex(this.pos.clone(), this.normal.clone());
    }

    // Invert all orientation-specific data (e.g. vertex normal). Called when the
    // orientation of a polygon is flipped.
    flip() {
      this.normal = this.normal.negated();
    }

    // Create a new vertex between this vertex and `other` by linearly
    // interpolating all properties using a parameter of `t`. Subclasses should
    // override this to interpolate additional properties.
    interpolate(other, t) {
      return new Vertex(
        this.pos.lerp(other.pos, t),
        this.normal.lerp(other.normal, t)
        );
    }
  }

  // Represents a plane in 3D space.
  export class Plane {
    // `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
    // point is on the plane.
    static EPSILON = 1e-5;

    static fromPoints = function(a, b, c) {
      var n = b.minus(a).cross(c.minus(a)).unit();
      return new Plane(n, n.dot(a));
    }

    normal: Vector;
    w: number;

    constructor(normal, w) {
      this.normal = normal;
      this.w = w;
    }

    clone() {
      return new Plane(this.normal.clone(), this.w);
    }

    flip() {
      this.normal = this.normal.negated();
      this.w = -this.w;
    }

    // Split `polygon` by this plane if needed, then put the polygon or polygon
    // fragments in the appropriate lists. Coplanar polygons go into either
    // `coplanarFront` or `coplanarBack` depending on their orientation with
    // respect to this plane. Polygons in front or in back of this plane go into
    // either `front` or `back`.
    splitPolygon(polygon, coplanarFront, coplanarBack, front, back) {
      var COPLANAR = 0;
      var FRONT = 1;
      var BACK = 2;
      var SPANNING = 3;

      // Classify each point as well as the entire polygon into one of the above
      // four classes.
      var polygonType = 0;
      var types = [];
      for (var i = 0; i < polygon.vertices.length; i++) {
        var t = this.normal.dot(polygon.vertices[i].pos) - this.w;
        var type = (t < -Plane.EPSILON) ? BACK : (t > Plane.EPSILON) ? FRONT : COPLANAR;
        polygonType |= type;
        types.push(type);
      }

      // Put the polygon in the correct list, splitting it when necessary.
      switch (polygonType) {
        case COPLANAR:
          (this.normal.dot(polygon.plane.normal) > 0 ? coplanarFront : coplanarBack).push(polygon);
          break;
        case FRONT:
          front.push(polygon);
          break;
        case BACK:
          back.push(polygon);
          break;
        case SPANNING:
          var f = [], b = [];
          for (var i = 0; i < polygon.vertices.length; i++) {
            var j = (i + 1) % polygon.vertices.length;
            var ti = types[i], tj = types[j];
            var vi = polygon.vertices[i], vj = polygon.vertices[j];
            if (ti != BACK) f.push(vi);
            if (ti != FRONT) b.push(ti != BACK ? vi.clone() : vi);
            if ((ti | tj) == SPANNING) {
              var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
              var v = vi.interpolate(vj, t);
              f.push(v);
              b.push(v.clone());
            }
          }
          if (f.length >= 3) front.push(new Polygon(f, polygon.shared));
          if (b.length >= 3) back.push(new Polygon(b, polygon.shared));
          break;
      }
    }
  }

  // Represents a convex polygon. The vertices used to initialize a polygon must
  // be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
  // instances but they must behave similarly (duck typing can be used for
  // customization).
  //
  // Each convex polygon has a `shared` property, which is shared between all
  // polygons that are clones of each other or were split from the same polygon.
  // This can be used to define per-polygon properties (such as surface color).
  export class Polygon {
    vertices: Vertex[];
    shared: boolean;
    plane: Plane;

    constructor(vertices: Vertex[], shared: boolean = false) {
      this.vertices = vertices;
      this.shared = shared;
      this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
    }

    clone() {
      var vertices = this.vertices.map(function(v) { return v.clone(); });
      return new Polygon(vertices, this.shared);
    }

    flip() {
      this.vertices.reverse().map(function(v) { v.flip(); });
      this.plane.flip();
    }
  }

  // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
  // by picking a polygon to split along. That polygon (and all other coplanar
  // polygons) are added directly to that node and the other polygons are added to
  // the front and/or back subtrees. This is not a leafy BSP tree since there is
  // no distinction between internal and leaf nodes.
  export class Node {
    plane: Plane;
    polygons: Polygon[];
    front: Node;
    back: Node;

    constructor(polygons?: Polygon[]) {
      this.plane = null;
      this.front = null;
      this.back = null;
      this.polygons = [];
      if (polygons) {
        this.build(polygons);
      }
    }

    clone() {
      var node = new Node();
      node.plane = this.plane && this.plane.clone();
      node.front = this.front && this.front.clone();
      node.back = this.back && this.back.clone();
      node.polygons = this.polygons.map(function(p) { return p.clone(); });
      return node;
    }

    // Convert solid space to empty space and empty space to solid space.
    invert() {
      for (var i = 0; i < this.polygons.length; i++) {
        this.polygons[i].flip();
      }
      this.plane.flip();
      if (this.front) this.front.invert();
      if (this.back) this.back.invert();
      var temp = this.front;
      this.front = this.back;
      this.back = temp;
    }

    // Recursively remove all polygons in `polygons` that are inside this BSP
    // tree.
    clipPolygons(polygons: Polygon[]): Polygon[] {
      if (!this.plane) return polygons.slice();
      var front = [], back = [];
      for (var i = 0; i < polygons.length; i++) {
        this.plane.splitPolygon(polygons[i], front, back, front, back);
      }
      if (this.front) front = this.front.clipPolygons(front);
      if (this.back) back = this.back.clipPolygons(back);
      else back = [];
      return front.concat(back);
    }

    // Remove all polygons in this BSP tree that are inside the other BSP tree
    // `bsp`.
    clipTo(bsp: Node) {
      this.polygons = bsp.clipPolygons(this.polygons);
      if (this.front) {
        this.front.clipTo(bsp);
      }
      if (this.back) {
        this.back.clipTo(bsp);
      }
    }

    // Return a list of all polygons in this BSP tree.
    allPolygons(): Polygon[] {
      var polygons = this.polygons.slice();
      if (this.front) {
        polygons = polygons.concat(this.front.allPolygons());
      }
      if (this.back) {
        polygons = polygons.concat(this.back.allPolygons());
      }
      return polygons;
    }

    // Build a BSP tree out of `polygons`. When called on an existing tree, the
    // new polygons are filtered down to the bottom of the tree and become new
    // nodes there. Each set of polygons is partitioned using the first polygon
    // (no heuristic is used to pick a good split).
    build(polygons: Polygon[]) {
      this._build(polygons);
    }

    private _build(polygons: Polygon[]) {
      if (!polygons.length) {
        return;
      }
      if (!this.plane) {
        this.plane = polygons[0].plane.clone();
      }
      var front = [], back = [];
      for (var i = 0; i < polygons.length; i++) {
        this.plane.splitPolygon(polygons[i], this.polygons, this.polygons, front, back);
      }
      if (front.length) {
        if (!this.front) {
          this.front = new Node();
        }
        this.front._build(front);
      }
      if (back.length) {
        if (!this.back) {
          this.back = new Node();
        }
        this.back._build(back);
      }
    }
  }
}
