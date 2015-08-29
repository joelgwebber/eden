declare class CSG {
  constructor();
  clone(): CSG;
  toPolygons(): CSG.Polygon[];// ???
  union(other: CSG): CSG;
  subtract(other: CSG): CSG;
  intersect(other: CSG): CSG;
  inverse(): CSG;
}

declare module CSG {
  function fromPolygons(/*...*/): CSG;
  function cube(options?: { center?: number[]; radius?: number|number[]; }): CSG;
  function sphere(options?: { center?: number[]; radius?: number|number[]; slices?: number; stacks?: number; }): CSG;
  function cylinder(options?: { start?: number[]; end?: number[]; radius?: number|number[]; slices?: number; }): CSG;

  class Vector {
    x: number;
    y: number;
    z: number;

    constructor(x: number, y: number, z: number);
    constructor(xyz: number[]);

    clone(): Vector;
    negated(): Vector;
    plus(a: Vector): Vector;
    minus(a: Vector): Vector;
    times(a: Vector): Vector;
    dividedBy(a: Vector): Vector;
    dot(a: Vector): number;
    lerp(a: Vector, t: number): Vector;
    length(): number;
    unit(): Vector;
    cross(a: Vector): Vector;
  }

  class Vertex {
    pos: Vector;
    normal: Vector;

    clone(): Vertex;
    flip();
    interpolate(other: Vertex, t: number);
  }

  class Plane {
    static fromPoints(a: Vertex, b: Vertex, c: Vertex): Plane;

    constructor(normal: Vertex, w: number);
    clone(): Plane;
    flip();
    splitPolygon(polygon: Polygon, coplanarFront: Polygon[], coplanarBack: Polygon[], front: Polygon[], back: Polygon[]);
  }

  class Polygon {
    vertices: Vertex[];

    constructor(vertices: Vertex[], shared: boolean);
    clone(): Polygon;
    flip();
  }

  class Node {
    constructor(polygons?: Polygon[]);
    clone(): Node;
    invert();
    clipPolygons(): Polygon[];
    clipTo(bsp: Node);
    allPolygons(): Polygon[];
    build(polygons: Polygon[]);
  }
}
