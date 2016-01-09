/// <reference path="lib/twgl.d.ts"/>
var Eden;
(function (Eden) {
})(Eden || (Eden = {}));
var Eden;
(function (Eden) {
    // Cell types stored in the low 16-bits.
    Eden.CellTypeMask = 0xffff;
    // Cell args stored in the high 16-bits.
    Eden.CellArgsMask = 0xffff0000;
    Eden.CellArgsShift = 16;
    // High bit of the cell-type: 1 => terrain (Participates in marching-cubes surface rendering).
    Eden.CellTerrainBit = 0x8000;
    Eden.TerrainTypeMask = 0x7fff;
    // Chunk cells.
    Eden.CellAir = 0x0000; // Special case: air == 0 (always ignored).
    Eden.CellWall = 0x0001;
    Eden.CellFloor = 0x0002;
    // Terrain cells.
    Eden.CellDirt = 0x8001;
    Eden.CellGrass = 0x8002;
    var cellTypes = {};
    var terrainColor = {
        0x0000: [0, 0, 0],
        0x0001: [0.5, 0.2, 0],
        0x0002: [0, 0.8, 0]
    };
    function cellType(cell) {
        return cell & Eden.CellTypeMask;
    }
    Eden.cellType = cellType;
    function cellArgs(cell) {
        return (cell & Eden.CellArgsMask) >>> Eden.CellArgsShift;
    }
    Eden.cellArgs = cellArgs;
    function registerCell(cell, type) {
        cellTypes[cell] = type;
    }
    Eden.registerCell = registerCell;
    function typeForCell(cell) {
        return cellTypes[cell];
    }
    Eden.typeForCell = typeForCell;
    function terrainCellColor(cell) {
        return terrainColor[cell & Eden.TerrainTypeMask];
    }
    Eden.terrainCellColor = terrainCellColor;
    function makeCell(type, args) {
        if (args === void 0) { args = 0; }
        return (args << Eden.CellArgsShift) | type;
    }
    Eden.makeCell = makeCell;
    function terrainCell(type, density) {
        return makeCell(type, density * 0xffff);
    }
    Eden.terrainCell = terrainCell;
    function isTerrain(type) {
        return (type & Eden.CellTerrainBit) != 0;
    }
    Eden.isTerrain = isTerrain;
})(Eden || (Eden = {}));
/// <reference path="celltypes.ts"/>
var Eden;
(function (Eden) {
    // Plane constants. Encoded by normal [xyz] = -1, [XYZ] = 1, _ = 0.
    // All possible normals with values -1, 0, 1, skipping inverses.
    Eden.PlaneX__ = 0x0001;
    Eden.Plane_Y_ = 0x0002;
    Eden.Plane__Z = 0x0004;
    Eden.PlaneXY_ = 0x0008;
    Eden.PlaneXy_ = 0x0010;
    Eden.PlaneX_Z = 0x0020;
    Eden.PlaneX_z = 0x0040;
    Eden.Plane_YZ = 0x0080;
    Eden.Plane_Yz = 0x0100;
    Eden.PlaneXYZ = 0x0200;
    Eden.PlaneXYz = 0x0400;
    Eden.PlaneXyZ = 0x0800;
    Eden.PlaneXyz = 0x1000;
    Eden.PlaneCount = 13;
    // Plane -> [normal, du, dv]
    Eden.PlaneNormals = {};
    var AllPlanes = [];
    function initEnvPlanes() {
        Eden.PlaneNormals[Eden.PlaneX__] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
        Eden.PlaneNormals[Eden.Plane_Y_] = [[0, 1, 0], [1, 0, 0], [0, 0, 1]];
        Eden.PlaneNormals[Eden.Plane__Z] = [[0, 0, 1], [1, 0, 0], [0, 1, 0]];
        Eden.PlaneNormals[Eden.PlaneXY_] = [[1, 1, 0], [0, 0, 1], [-1, 1, 0]];
        Eden.PlaneNormals[Eden.PlaneXy_] = [[1, -1, 0], [0, 0, 1], [1, 1, 0]];
        Eden.PlaneNormals[Eden.PlaneX_Z] = [[1, 0, 1], [0, 1, 0], [1, 0, -1]];
        Eden.PlaneNormals[Eden.PlaneX_z] = [[1, 0, -1], [0, 1, 0], [1, 0, 1]];
        Eden.PlaneNormals[Eden.Plane_YZ] = [[0, 1, 1], [1, 0, 0], [0, -1, 1]];
        Eden.PlaneNormals[Eden.Plane_Yz] = [[0, 1, -1], [1, 0, 0], [0, 1, 1]];
        Eden.PlaneNormals[Eden.PlaneXYZ] = [[1, 1, 1], [1, 0, -1], [-1, 1, -1]];
        Eden.PlaneNormals[Eden.PlaneXYz] = [[1, 1, -1], [-1, 0, -1], [-1, 1, 1]];
        Eden.PlaneNormals[Eden.PlaneXyZ] = [[1, -1, 1], [1, 0, -1], [1, 1, 1]];
        Eden.PlaneNormals[Eden.PlaneXyz] = [[1, -1, -1], [-1, 0, -1], [1, 1, -1]];
        for (var i = 0, planeBit = 1; i < Eden.PlaneCount; i++, planeBit <<= 1) {
            addPlane(planeBit);
        }
    }
    Eden.initEnvPlanes = initEnvPlanes;
    function addPlane(planeBit) {
        var n = Eden.PlaneNormals[planeBit][0];
        var du = Eden.PlaneNormals[planeBit][1];
        var dv = Eden.PlaneNormals[planeBit][2];
        for (var ofs = -2; ofs <= 2; ofs++) {
            var points = [];
            for (var u = -2; u <= 2; u++) {
                for (var v = -2; v <= 2; v++) {
                    var x = ofs * n[0] + u * du[0] + v * dv[0];
                    var y = ofs * n[1] + u * du[1] + v * dv[1];
                    var z = ofs * n[2] + u * du[2] + v * dv[2];
                    if ((x >= -2) && (x <= 2) &&
                        (y >= -2) && (y <= 2) &&
                        (z >= -2) && (z <= 2)) {
                        points.push(Eden.envOfsCenter(x, y, z));
                    }
                }
            }
            var p = { planeBit: planeBit, points: points, hit: 0 };
            if (ofs == 0) {
                p.bit = planeBit;
            }
            AllPlanes.push(p);
        }
    }
    function copyPlane(l) {
        return { planeBit: l.planeBit, points: l.points, hit: l.hit, bit: l.bit };
    }
    // TODO:
    // - Cache found planes.
    //   When caching, fill all rotations/inversions to avoid redundant work.
    // TODO: Explain.
    function planeBitsForEnv(env) {
        // Get bits for filled planes.
        var planes = findAllPlanes(env);
        planes = optimizePlanes(planes, env);
        var bits = 0;
        for (var i = 0; i < planes.length; i++) {
            if (planes[i].bit) {
                bits |= planes[i].bit;
            }
        }
        return bits;
    }
    Eden.planeBitsForEnv = planeBitsForEnv;
    function findAllPlanes(env) {
        var planes = [];
        for (var i = 0; i < AllPlanes.length; ++i) {
            var line = copyPlane(AllPlanes[i]);
            for (var j = 0; j < line.points.length; j++) {
                if (env[line.points[j]]) {
                    line.hit++;
                }
            }
            if (line.hit > 0) {
                planes.push(line);
            }
        }
        return planes;
    }
    // Counts the number of cells set in the given environment.
    function countCells(env) {
        var total = 0;
        for (var i = 0; i < 5 * 5 * 5; i++) {
            if (env[i]) {
                total++;
            }
        }
        return total;
    }
    var _count = 0;
    function optimizePlanes(planes, env) {
        var total = countCells(env);
        // Sort planes by descending size.
        planes.sort(function (a, b) {
            return b.hit - a.hit;
        });
        // 'Touched' bits for each cell in the environment.
        var touched = [];
        for (var i = 0; i < 125; i++) {
            touched[i] = false;
        }
        _count = 0;
        return optimizeHelper(planes, total, env, touched);
    }
    function optimizeHelper(planes, total, env, touched) {
        // Find all candidate planes of equal size.
        var bestResult, bestLength = 100;
        while (true) {
            for (var i = 0; (i < planes.length) && (planes[i].hit == planes[0].hit); i++) {
                var head = planes[i];
                var tail = planes.slice();
                tail = tail.slice(0, i).concat(tail.slice(i + 1));
                var result = optimizePlane(head, tail, total, env, touched.slice()); // Always copy `touched` (TODO: Can skip the first).
                if (result.length && result.length < bestLength) {
                    bestResult = result;
                    bestLength = result.length;
                }
            }
            if (!bestResult && planes.length > i) {
                // We didn't find anything at len=N, so go ahead and try the next set.
                planes = planes.slice(i);
                continue;
            }
            break;
        }
        return bestResult;
    }
    function optimizePlane(head, tail, total, env, touched) {
        _count++;
        // Walk the line through the environment, updating `total` and `touched`.
        var anythingTouched = false;
        for (var j = 0; j < head.points.length; j++) {
            var ofs = head.points[j];
            if (env[ofs] && !touched[ofs]) {
                anythingTouched = true;
                touched[ofs] = true;
                total--;
            }
        }
        var result = [];
        if (anythingTouched) {
            result.push(head);
            if (total > 0) {
                if (tail.length > 0) {
                    var optimized = optimizeHelper(tail, total, env, touched);
                    if (optimized) {
                        result = result.concat(optimized);
                    }
                }
            }
        }
        return result;
    }
})(Eden || (Eden = {}));
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
var CSG;
(function (CSG) {
    // Holds a binary space partition tree representing a 3D solid. Two solids can
    // be combined using the `union()`, `subtract()`, and `intersect()` methods.
    var Model = (function () {
        function Model() {
            this.polygons = [];
        }
        // Construct a CSG solid from a list of `Polygon` instances.
        Model.fromPolygons = function (polygons) {
            var csg = new Model();
            csg.polygons = polygons;
            return csg;
        };
        Model.prototype.clone = function () {
            var csg = new Model();
            csg.polygons = this.polygons.map(function (p) { return p.clone(); });
            return csg;
        };
        Model.prototype.toPolygons = function () {
            return this.polygons;
        };
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
        Model.prototype.union = function (csg) {
            var a = new Node(this.clone().polygons);
            var b = new Node(csg.clone().polygons);
            a.clipTo(b);
            b.clipTo(a);
            b.invert();
            b.clipTo(a);
            b.invert();
            a.build(b.allPolygons());
            return Model.fromPolygons(a.allPolygons());
        };
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
        Model.prototype.subtract = function (csg) {
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
        };
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
        Model.prototype.intersect = function (csg) {
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
        };
        // Return a new CSG solid with solid and empty space switched. This solid is
        // not modified.
        Model.prototype.inverse = function () {
            var csg = this.clone();
            csg.polygons.map(function (p) { p.flip(); });
            return csg;
        };
        return Model;
    })();
    CSG.Model = Model;
    // Construct an empty model.
    function empty() {
        return Model.fromPolygons([]);
    }
    CSG.empty = empty;
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
    function cube(options) {
        var c = Vector.fromArray(options.center || [0, 0, 0]);
        var r = options.radius ? options.radius : [1, 1, 1];
        return Model.fromPolygons([
            [[0, 4, 6, 2], [-1, 0, 0]],
            [[1, 3, 7, 5], [+1, 0, 0]],
            [[0, 1, 5, 4], [0, -1, 0]],
            [[2, 6, 7, 3], [0, +1, 0]],
            [[0, 2, 3, 1], [0, 0, -1]],
            [[4, 5, 7, 6], [0, 0, +1]]
        ].map(function (info) {
            return new Polygon(info[0].map(function (i) {
                var pos = new Vector(r[0] * (2 * (i & 1 ? 1 : 0) - 1), r[1] * (2 * (i & 2 ? 1 : 0) - 1), r[2] * (2 * (i & 4 ? 1 : 0) - 1));
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
    CSG.cube = cube;
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
    function sphere(options) {
        var c = Vector.fromArray(options.center || [0, 0, 0]);
        var r = options.radius || 1;
        var slices = options.slices || 16;
        var stacks = options.stacks || 8;
        var polygons = [], vertices;
        function vertex(theta, phi) {
            theta *= Math.PI * 2;
            phi *= Math.PI;
            var dir = new Vector(Math.cos(theta) * Math.sin(phi), Math.cos(phi), Math.sin(theta) * Math.sin(phi));
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
    CSG.sphere = sphere;
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
    function cylinder(options) {
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
    CSG.cylinder = cylinder;
    // Represents a 3D vector.
    //
    // Example usage:
    //
    //     new CSG.Vector(1, 2, 3);
    //     new CSG.Vector([1, 2, 3]);
    var Vector = (function () {
        function Vector(x, y, z) {
            this.x = x;
            this.y = y;
            this.z = z;
        }
        Vector.fromArray = function (a) {
            return new Vector(a[0], a[1], a[2]);
        };
        Vector.prototype.clone = function () {
            return new Vector(this.x, this.y, this.z);
        };
        Vector.prototype.negated = function () {
            return new Vector(-this.x, -this.y, -this.z);
        };
        Vector.prototype.plus = function (a) {
            return new Vector(this.x + a.x, this.y + a.y, this.z + a.z);
        };
        Vector.prototype.minus = function (a) {
            return new Vector(this.x - a.x, this.y - a.y, this.z - a.z);
        };
        Vector.prototype.times = function (a) {
            return new Vector(this.x * a, this.y * a, this.z * a);
        };
        Vector.prototype.dividedBy = function (a) {
            return new Vector(this.x / a, this.y / a, this.z / a);
        };
        Vector.prototype.dot = function (a) {
            return this.x * a.x + this.y * a.y + this.z * a.z;
        };
        Vector.prototype.lerp = function (a, t) {
            return this.plus(a.minus(this).times(t));
        };
        Vector.prototype.length = function () {
            return Math.sqrt(this.dot(this));
        };
        Vector.prototype.unit = function () {
            return this.dividedBy(this.length());
        };
        Vector.prototype.cross = function (a) {
            return new Vector(this.y * a.z - this.z * a.y, this.z * a.x - this.x * a.z, this.x * a.y - this.y * a.x);
        };
        Vector.prototype.mat3Times = function (xf) {
            return new Vector(xf[0] * this.x + xf[3] * this.y + xf[6] * this.z, xf[1] * this.x + xf[4] * this.y + xf[7] * this.z, xf[2] * this.x + xf[5] * this.y + xf[8] * this.z);
        };
        return Vector;
    })();
    CSG.Vector = Vector;
    // Represents a vertex of a polygon. Use your own vertex class instead of this
    // one to provide additional features like texture coordinates and vertex
    // colors. Custom vertex classes need to provide a `pos` property and `clone()`,
    // `flip()`, and `interpolate()` methods that behave analogous to the ones
    // defined by `CSG.Vertex`. This class provides `normal` so convenience
    // functions like `CSG.sphere()` can return a smooth vertex normal, but `normal`
    // is not used anywhere else.
    var Vertex = (function () {
        function Vertex(pos, normal) {
            this.pos = pos.clone();
            this.normal = normal.clone();
        }
        Vertex.prototype.clone = function () {
            return new Vertex(this.pos.clone(), this.normal.clone());
        };
        // Invert all orientation-specific data (e.g. vertex normal). Called when the
        // orientation of a polygon is flipped.
        Vertex.prototype.flip = function () {
            this.normal = this.normal.negated();
        };
        // Create a new vertex between this vertex and `other` by linearly
        // interpolating all properties using a parameter of `t`. Subclasses should
        // override this to interpolate additional properties.
        Vertex.prototype.interpolate = function (other, t) {
            return new Vertex(this.pos.lerp(other.pos, t), this.normal.lerp(other.normal, t));
        };
        return Vertex;
    })();
    CSG.Vertex = Vertex;
    // Represents a plane in 3D space.
    var Plane = (function () {
        function Plane(normal, w) {
            this.normal = normal;
            this.w = w;
        }
        Plane.prototype.clone = function () {
            return new Plane(this.normal.clone(), this.w);
        };
        Plane.prototype.flip = function () {
            this.normal = this.normal.negated();
            this.w = -this.w;
        };
        // Split `polygon` by this plane if needed, then put the polygon or polygon
        // fragments in the appropriate lists. Coplanar polygons go into either
        // `coplanarFront` or `coplanarBack` depending on their orientation with
        // respect to this plane. Polygons in front or in back of this plane go into
        // either `front` or `back`.
        Plane.prototype.splitPolygon = function (polygon, coplanarFront, coplanarBack, front, back) {
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
                        if (ti != BACK)
                            f.push(vi);
                        if (ti != FRONT)
                            b.push(ti != BACK ? vi.clone() : vi);
                        if ((ti | tj) == SPANNING) {
                            var t = (this.w - this.normal.dot(vi.pos)) / this.normal.dot(vj.pos.minus(vi.pos));
                            var v = vi.interpolate(vj, t);
                            f.push(v);
                            b.push(v.clone());
                        }
                    }
                    if (f.length >= 3)
                        front.push(new Polygon(f, polygon.shared));
                    if (b.length >= 3)
                        back.push(new Polygon(b, polygon.shared));
                    break;
            }
        };
        // `Plane.EPSILON` is the tolerance used by `splitPolygon()` to decide if a
        // point is on the plane.
        Plane.EPSILON = 1e-5;
        Plane.fromPoints = function (a, b, c) {
            var n = b.minus(a).cross(c.minus(a)).unit();
            return new Plane(n, n.dot(a));
        };
        return Plane;
    })();
    CSG.Plane = Plane;
    // Represents a convex polygon. The vertices used to initialize a polygon must
    // be coplanar and form a convex loop. They do not have to be `CSG.Vertex`
    // instances but they must behave similarly (duck typing can be used for
    // customization).
    //
    // Each convex polygon has a `shared` property, which is shared between all
    // polygons that are clones of each other or were split from the same polygon.
    // This can be used to define per-polygon properties (such as surface color).
    var Polygon = (function () {
        function Polygon(vertices, shared) {
            if (shared === void 0) { shared = false; }
            this.vertices = vertices;
            this.shared = shared;
            this.plane = Plane.fromPoints(vertices[0].pos, vertices[1].pos, vertices[2].pos);
        }
        Polygon.prototype.clone = function () {
            var vertices = this.vertices.map(function (v) { return v.clone(); });
            return new Polygon(vertices, this.shared);
        };
        Polygon.prototype.flip = function () {
            this.vertices.reverse().map(function (v) { v.flip(); });
            this.plane.flip();
        };
        return Polygon;
    })();
    CSG.Polygon = Polygon;
    // Holds a node in a BSP tree. A BSP tree is built from a collection of polygons
    // by picking a polygon to split along. That polygon (and all other coplanar
    // polygons) are added directly to that node and the other polygons are added to
    // the front and/or back subtrees. This is not a leafy BSP tree since there is
    // no distinction between internal and leaf nodes.
    var Node = (function () {
        function Node(polygons) {
            this.plane = null;
            this.front = null;
            this.back = null;
            this.polygons = [];
            if (polygons) {
                this.build(polygons);
            }
        }
        Node.prototype.clone = function () {
            var node = new Node();
            node.plane = this.plane && this.plane.clone();
            node.front = this.front && this.front.clone();
            node.back = this.back && this.back.clone();
            node.polygons = this.polygons.map(function (p) { return p.clone(); });
            return node;
        };
        // Convert solid space to empty space and empty space to solid space.
        Node.prototype.invert = function () {
            for (var i = 0; i < this.polygons.length; i++) {
                this.polygons[i].flip();
            }
            this.plane.flip();
            if (this.front)
                this.front.invert();
            if (this.back)
                this.back.invert();
            var temp = this.front;
            this.front = this.back;
            this.back = temp;
        };
        // Recursively remove all polygons in `polygons` that are inside this BSP
        // tree.
        Node.prototype.clipPolygons = function (polygons) {
            if (!this.plane)
                return polygons.slice();
            var front = [], back = [];
            for (var i = 0; i < polygons.length; i++) {
                this.plane.splitPolygon(polygons[i], front, back, front, back);
            }
            if (this.front)
                front = this.front.clipPolygons(front);
            if (this.back)
                back = this.back.clipPolygons(back);
            else
                back = [];
            return front.concat(back);
        };
        // Remove all polygons in this BSP tree that are inside the other BSP tree
        // `bsp`.
        Node.prototype.clipTo = function (bsp) {
            this.polygons = bsp.clipPolygons(this.polygons);
            if (this.front) {
                this.front.clipTo(bsp);
            }
            if (this.back) {
                this.back.clipTo(bsp);
            }
        };
        // Return a list of all polygons in this BSP tree.
        Node.prototype.allPolygons = function () {
            var polygons = this.polygons.slice();
            if (this.front) {
                polygons = polygons.concat(this.front.allPolygons());
            }
            if (this.back) {
                polygons = polygons.concat(this.back.allPolygons());
            }
            return polygons;
        };
        // Build a BSP tree out of `polygons`. When called on an existing tree, the
        // new polygons are filtered down to the bottom of the tree and become new
        // nodes there. Each set of polygons is partitioned using the first polygon
        // (no heuristic is used to pick a good split).
        Node.prototype.build = function (polygons) {
            this._build(polygons);
        };
        Node.prototype._build = function (polygons) {
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
        };
        return Node;
    })();
    CSG.Node = Node;
})(CSG || (CSG = {}));
/// <reference path="lib/twgl.d.ts"/>
var Eden;
(function (Eden) {
    Eden.TAU = 2 * Math.PI;
})(Eden || (Eden = {}));
/// <reference path="math.ts"/>
var Eden;
(function (Eden) {
    var m4 = twgl.m4;
    var Camera = (function () {
        function Camera() {
            this._mat = m4.identity();
            this._view = m4.identity();
            this._viewProjection = m4.identity();
            this.aspect = 1;
        }
        Camera.prototype.setPosition = function (pos) {
            m4.setTranslation(this._mat, pos, this._mat);
        };
        Camera.prototype.lookAt = function (target, up) {
            this._mat = m4.lookAt(m4.getTranslation(this._mat), target, up);
        };
        Camera.prototype.setAspect = function (aspect) {
            this.aspect = aspect;
        };
        Camera.prototype.update = function () {
            var projection = m4.perspective(30 * Math.PI / 180, this.aspect, 0.1, 1000);
            m4.inverse(this._mat, this._view);
            m4.multiply(this._view, projection, this._viewProjection);
        };
        Camera.prototype.view = function () {
            return this._view;
        };
        Camera.prototype.viewProjection = function () {
            return this._viewProjection;
        };
        return Camera;
    })();
    Eden.Camera = Camera;
})(Eden || (Eden = {}));
/// <reference path="math.ts"/>
var Eden;
(function (Eden) {
    var v3 = twgl.v3;
    function fillCube(env) {
        var cube = new Array(8);
        for (var i = 0; i < 8; i++) {
            var ofs = vertexOffset[i];
            var cell = env[Eden.envOfsCenter(ofs[0], ofs[1], ofs[2])];
            cube[i] = Eden.isTerrain(cell) ? Eden.cellArgs(cell) / 0xffff : 0;
        }
        return cube;
    }
    Eden.fillCube = fillCube;
    function marchCube(pos, cube, vertCache, verts, indices) {
        // Find which vertices are inside of the surface and which are outside.
        var flagIndex = 0;
        for (var i = 0; i < 8; i++) {
            if (cube[i] <= 0.5) {
                flagIndex |= 1 << i;
            }
        }
        // Find which edges are intersected by the surface.
        var edgeFlags = cubeEdgeFlags[flagIndex];
        // If the cube is entirely inside or outside of the surface, then there will be no intersections.
        if (edgeFlags == 0) {
            return;
        }
        // Find the point of intersection of the surface with each edge.
        var edgeVertex = new Array(12);
        for (var i = 0; i < 12; i++) {
            edgeVertex[i] = v3.create();
            // If there is an intersection on this edge.
            if ((edgeFlags & (1 << i)) != 0) {
                var offset = getOffset(cube[edgeConnection[i][0]], cube[edgeConnection[i][1]]);
                v3.add(pos, [
                    vertexOffset[edgeConnection[i][0]][0] + offset * edgeDirection[i][0],
                    vertexOffset[edgeConnection[i][0]][1] + offset * edgeDirection[i][1],
                    vertexOffset[edgeConnection[i][0]][2] + offset * edgeDirection[i][2]
                ], edgeVertex[i]);
            }
        }
        // Save the triangles that were found. There can be up to five per cube.
        for (var i = 0; i < 5; i++) {
            if (triangleConnectionTable[flagIndex][3 * i] < 0) {
                break;
            }
            // Get the three verts for this triangle.
            var triVerts = new Array(3);
            for (var j = 0; j < 3; j++) {
                triVerts[j] = edgeVertex[triangleConnectionTable[flagIndex][3 * i + j]];
            }
            var idx = verts.length / 3;
            for (var j = 0; j < 3; j++) {
                var key = vertKey(triVerts[j]);
                if (key in vertCache) {
                    // Already have a vertex at roughly this position.
                    indices.push(vertCache[key]);
                }
                else {
                    // New vertex.
                    vertCache[key] = idx;
                    indices.push(idx);
                    verts.push(triVerts[j][0]);
                    verts.push(triVerts[j][1]);
                    verts.push(triVerts[j][2]);
                    idx++;
                }
            }
        }
    }
    Eden.marchCube = marchCube;
    // Build a key for the vertex, by flooring the x.y part and mushing them into a single number.
    function vertKey(v) {
        var _x = (v[0] + 2.0) * 32.0;
        var _y = (v[1] + 2.0) * 32.0;
        var _z = (v[2] + 2.0) * 32.0;
        return (_x << 20) | (_y << 10) | _z;
    }
    function getOffset(v1, v2) {
        var delta = v2 - v1;
        if (delta == 0.0) {
            return 0.5;
        }
        return (0.5 - v1) / delta;
    }
    // vertexOffset lists the positions, relative to vertex0, of each of the 8 vertices of a cube
    var vertexOffset = [
        [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
        [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]
    ];
    // edgeConnection lists the index of the endpoint vertices for each of the 12 edges of the cube
    var edgeConnection = [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7],
    ];
    // edgeDirection lists the direction vector (vertex1-vertex0) for each edge in the cube
    var edgeDirection = [
        [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [-1.0, 0.0, 0.0], [0.0, -1.0, 0.0],
        [1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [-1.0, 0.0, 0.0], [0.0, -1.0, 0.0],
        [0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0], [0.0, 0.0, 1.0],
    ];
    // For any edge, if one vertex is inside of the surface and the other is outside of the surface then the edge intersects the surface.
    // For each of the 8 vertices of the cube can be two possible states : either inside or outside of the surface.
    // For any cube the are 2^8=256 possible sets of vertex states.
    // This table lists the edges intersected by the surface for all 256 possible vertex states.
    // There are 12 edges.  For each entry in the table, if edge #n is intersected, then bit #n is set to 1.
    var cubeEdgeFlags = [
        0x000, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c, 0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
        0x190, 0x099, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c, 0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
        0x230, 0x339, 0x033, 0x13a, 0x636, 0x73f, 0x435, 0x53c, 0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
        0x3a0, 0x2a9, 0x1a3, 0x0aa, 0x7a6, 0x6af, 0x5a5, 0x4ac, 0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
        0x460, 0x569, 0x663, 0x76a, 0x066, 0x16f, 0x265, 0x36c, 0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
        0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0x0ff, 0x3f5, 0x2fc, 0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
        0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x055, 0x15c, 0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
        0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0x0cc, 0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
        0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc, 0x0cc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
        0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c, 0x15c, 0x055, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
        0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc, 0x2fc, 0x3f5, 0x0ff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
        0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c, 0x36c, 0x265, 0x16f, 0x066, 0x76a, 0x663, 0x569, 0x460,
        0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac, 0x4ac, 0x5a5, 0x6af, 0x7a6, 0x0aa, 0x1a3, 0x2a9, 0x3a0,
        0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c, 0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x033, 0x339, 0x230,
        0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c, 0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x099, 0x190,
        0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c, 0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x000,
    ];
    // For each of the possible vertex states listed in cubeEdgeFlags there is a specific triangulation
    // of the edge intersection points.  triangleConnectionTable lists all of them in the form of
    // 0-5 edge triples with the list terminated by the invalid value -1.
    // For example: triangleConnectionTable[3] list the 2 triangles formed when corner[0]
    // and corner[1] are inside of the surface, but the rest of the cube is not.
    var triangleConnectionTable = [
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 1, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 8, 3, 9, 8, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 2, 10, 0, 2, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [2, 8, 3, 2, 10, 8, 10, 9, 8, -1, -1, -1, -1, -1, -1, -1],
        [3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 11, 2, 8, 11, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 9, 0, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 11, 2, 1, 9, 11, 9, 8, 11, -1, -1, -1, -1, -1, -1, -1],
        [3, 10, 1, 11, 10, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 10, 1, 0, 8, 10, 8, 11, 10, -1, -1, -1, -1, -1, -1, -1],
        [3, 9, 0, 3, 11, 9, 11, 10, 9, -1, -1, -1, -1, -1, -1, -1],
        [9, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 3, 0, 7, 3, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 1, 9, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 1, 9, 4, 7, 1, 7, 3, 1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 4, 7, 3, 0, 4, 1, 2, 10, -1, -1, -1, -1, -1, -1, -1],
        [9, 2, 10, 9, 0, 2, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
        [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1, -1, -1, -1],
        [8, 4, 7, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [11, 4, 7, 11, 2, 4, 2, 0, 4, -1, -1, -1, -1, -1, -1, -1],
        [9, 0, 1, 8, 4, 7, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
        [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1, -1, -1, -1],
        [3, 10, 1, 3, 11, 10, 7, 8, 4, -1, -1, -1, -1, -1, -1, -1],
        [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1, -1, -1, -1],
        [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1, -1, -1, -1],
        [4, 7, 11, 4, 11, 9, 9, 11, 10, -1, -1, -1, -1, -1, -1, -1],
        [9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 5, 4, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 5, 4, 1, 5, 0, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [8, 5, 4, 8, 3, 5, 3, 1, 5, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 0, 8, 1, 2, 10, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
        [5, 2, 10, 5, 4, 2, 4, 0, 2, -1, -1, -1, -1, -1, -1, -1],
        [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1, -1, -1, -1],
        [9, 5, 4, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 11, 2, 0, 8, 11, 4, 9, 5, -1, -1, -1, -1, -1, -1, -1],
        [0, 5, 4, 0, 1, 5, 2, 3, 11, -1, -1, -1, -1, -1, -1, -1],
        [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1, -1, -1, -1],
        [10, 3, 11, 10, 1, 3, 9, 5, 4, -1, -1, -1, -1, -1, -1, -1],
        [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1, -1, -1, -1],
        [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1, -1, -1, -1],
        [5, 4, 8, 5, 8, 10, 10, 8, 11, -1, -1, -1, -1, -1, -1, -1],
        [9, 7, 8, 5, 7, 9, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 3, 0, 9, 5, 3, 5, 7, 3, -1, -1, -1, -1, -1, -1, -1],
        [0, 7, 8, 0, 1, 7, 1, 5, 7, -1, -1, -1, -1, -1, -1, -1],
        [1, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 7, 8, 9, 5, 7, 10, 1, 2, -1, -1, -1, -1, -1, -1, -1],
        [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1, -1, -1, -1],
        [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1, -1, -1, -1],
        [2, 10, 5, 2, 5, 3, 3, 5, 7, -1, -1, -1, -1, -1, -1, -1],
        [7, 9, 5, 7, 8, 9, 3, 11, 2, -1, -1, -1, -1, -1, -1, -1],
        [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1, -1, -1, -1],
        [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1, -1, -1, -1],
        [11, 2, 1, 11, 1, 7, 7, 1, 5, -1, -1, -1, -1, -1, -1, -1],
        [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1, -1, -1, -1],
        [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
        [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
        [11, 10, 5, 7, 11, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 0, 1, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 8, 3, 1, 9, 8, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
        [1, 6, 5, 2, 6, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 6, 5, 1, 2, 6, 3, 0, 8, -1, -1, -1, -1, -1, -1, -1],
        [9, 6, 5, 9, 0, 6, 0, 2, 6, -1, -1, -1, -1, -1, -1, -1],
        [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1, -1, -1, -1],
        [2, 3, 11, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [11, 0, 8, 11, 2, 0, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
        [0, 1, 9, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1, -1, -1, -1],
        [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1, -1, -1, -1],
        [6, 3, 11, 6, 5, 3, 5, 1, 3, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1, -1, -1, -1],
        [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1, -1, -1, -1],
        [6, 5, 9, 6, 9, 11, 11, 9, 8, -1, -1, -1, -1, -1, -1, -1],
        [5, 10, 6, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 3, 0, 4, 7, 3, 6, 5, 10, -1, -1, -1, -1, -1, -1, -1],
        [1, 9, 0, 5, 10, 6, 8, 4, 7, -1, -1, -1, -1, -1, -1, -1],
        [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1, -1, -1, -1],
        [6, 1, 2, 6, 5, 1, 4, 7, 8, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1, -1, -1, -1],
        [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1, -1, -1, -1],
        [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
        [3, 11, 2, 7, 8, 4, 10, 6, 5, -1, -1, -1, -1, -1, -1, -1],
        [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1, -1, -1, -1],
        [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1, -1, -1, -1],
        [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
        [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1, -1, -1, -1],
        [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
        [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
        [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1, -1, -1, -1],
        [10, 4, 9, 6, 4, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 10, 6, 4, 9, 10, 0, 8, 3, -1, -1, -1, -1, -1, -1, -1],
        [10, 0, 1, 10, 6, 0, 6, 4, 0, -1, -1, -1, -1, -1, -1, -1],
        [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1, -1, -1, -1],
        [1, 4, 9, 1, 2, 4, 2, 6, 4, -1, -1, -1, -1, -1, -1, -1],
        [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1, -1, -1, -1],
        [0, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [8, 3, 2, 8, 2, 4, 4, 2, 6, -1, -1, -1, -1, -1, -1, -1],
        [10, 4, 9, 10, 6, 4, 11, 2, 3, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1, -1, -1, -1],
        [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1, -1, -1, -1],
        [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
        [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1, -1, -1, -1],
        [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
        [3, 11, 6, 3, 6, 0, 0, 6, 4, -1, -1, -1, -1, -1, -1, -1],
        [6, 4, 8, 11, 6, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [7, 10, 6, 7, 8, 10, 8, 9, 10, -1, -1, -1, -1, -1, -1, -1],
        [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1, -1, -1, -1],
        [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1, -1, -1, -1],
        [10, 6, 7, 10, 7, 1, 1, 7, 3, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1, -1, -1, -1],
        [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
        [7, 8, 0, 7, 0, 6, 6, 0, 2, -1, -1, -1, -1, -1, -1, -1],
        [7, 3, 2, 6, 7, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1, -1, -1, -1],
        [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
        [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
        [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1, -1, -1, -1],
        [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
        [0, 9, 1, 11, 6, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1, -1, -1, -1],
        [7, 11, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 0, 8, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 1, 9, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [8, 1, 9, 8, 3, 1, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
        [10, 1, 2, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, 3, 0, 8, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
        [2, 9, 0, 2, 10, 9, 6, 11, 7, -1, -1, -1, -1, -1, -1, -1],
        [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1, -1, -1, -1],
        [7, 2, 3, 6, 2, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [7, 0, 8, 7, 6, 0, 6, 2, 0, -1, -1, -1, -1, -1, -1, -1],
        [2, 7, 6, 2, 3, 7, 0, 1, 9, -1, -1, -1, -1, -1, -1, -1],
        [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1, -1, -1, -1],
        [10, 7, 6, 10, 1, 7, 1, 3, 7, -1, -1, -1, -1, -1, -1, -1],
        [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1, -1, -1, -1],
        [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1, -1, -1, -1],
        [7, 6, 10, 7, 10, 8, 8, 10, 9, -1, -1, -1, -1, -1, -1, -1],
        [6, 8, 4, 11, 8, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 6, 11, 3, 0, 6, 0, 4, 6, -1, -1, -1, -1, -1, -1, -1],
        [8, 6, 11, 8, 4, 6, 9, 0, 1, -1, -1, -1, -1, -1, -1, -1],
        [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1, -1, -1, -1],
        [6, 8, 4, 6, 11, 8, 2, 10, 1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1, -1, -1, -1],
        [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1, -1, -1, -1],
        [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
        [8, 2, 3, 8, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1],
        [0, 4, 2, 4, 6, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1, -1, -1, -1],
        [1, 9, 4, 1, 4, 2, 2, 4, 6, -1, -1, -1, -1, -1, -1, -1],
        [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1, -1, -1, -1],
        [10, 1, 0, 10, 0, 6, 6, 0, 4, -1, -1, -1, -1, -1, -1, -1],
        [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
        [10, 9, 4, 6, 10, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 9, 5, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, 4, 9, 5, 11, 7, 6, -1, -1, -1, -1, -1, -1, -1],
        [5, 0, 1, 5, 4, 0, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
        [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1, -1, -1, -1],
        [9, 5, 4, 10, 1, 2, 7, 6, 11, -1, -1, -1, -1, -1, -1, -1],
        [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1, -1, -1, -1],
        [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1, -1, -1, -1],
        [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
        [7, 2, 3, 7, 6, 2, 5, 4, 9, -1, -1, -1, -1, -1, -1, -1],
        [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1, -1, -1, -1],
        [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1, -1, -1, -1],
        [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
        [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1, -1, -1, -1],
        [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
        [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
        [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1, -1, -1, -1],
        [6, 9, 5, 6, 11, 9, 11, 8, 9, -1, -1, -1, -1, -1, -1, -1],
        [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1, -1, -1, -1],
        [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1, -1, -1, -1],
        [6, 11, 3, 6, 3, 5, 5, 3, 1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1, -1, -1, -1],
        [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
        [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
        [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1, -1, -1, -1],
        [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1, -1, -1, -1],
        [9, 5, 6, 9, 6, 0, 0, 6, 2, -1, -1, -1, -1, -1, -1, -1],
        [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
        [1, 5, 6, 2, 1, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
        [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1, -1, -1, -1],
        [0, 3, 8, 5, 6, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [10, 5, 6, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [11, 5, 10, 7, 5, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [11, 5, 10, 11, 7, 5, 8, 3, 0, -1, -1, -1, -1, -1, -1, -1],
        [5, 11, 7, 5, 10, 11, 1, 9, 0, -1, -1, -1, -1, -1, -1, -1],
        [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1, -1, -1, -1],
        [11, 1, 2, 11, 7, 1, 7, 5, 1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1, -1, -1, -1],
        [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1, -1, -1, -1],
        [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
        [2, 5, 10, 2, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1],
        [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1, -1, -1, -1],
        [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1, -1, -1, -1],
        [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
        [1, 3, 5, 3, 7, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 7, 0, 7, 1, 1, 7, 5, -1, -1, -1, -1, -1, -1, -1],
        [9, 0, 3, 9, 3, 5, 5, 3, 7, -1, -1, -1, -1, -1, -1, -1],
        [9, 8, 7, 5, 9, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [5, 8, 4, 5, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1],
        [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1, -1, -1, -1],
        [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1, -1, -1, -1],
        [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
        [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1, -1, -1, -1],
        [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
        [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
        [9, 4, 5, 2, 11, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1, -1, -1, -1],
        [5, 10, 2, 5, 2, 4, 4, 2, 0, -1, -1, -1, -1, -1, -1, -1],
        [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
        [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1, -1, -1, -1],
        [8, 4, 5, 8, 5, 3, 3, 5, 1, -1, -1, -1, -1, -1, -1, -1],
        [0, 4, 5, 1, 0, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1, -1, -1, -1],
        [9, 4, 5, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 11, 7, 4, 9, 11, 9, 10, 11, -1, -1, -1, -1, -1, -1, -1],
        [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1, -1, -1, -1],
        [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1, -1, -1, -1],
        [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
        [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1, -1, -1, -1],
        [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
        [11, 7, 4, 11, 4, 2, 2, 4, 0, -1, -1, -1, -1, -1, -1, -1],
        [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1, -1, -1, -1],
        [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1, -1, -1, -1],
        [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
        [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
        [1, 10, 2, 8, 7, 4, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 9, 1, 4, 1, 7, 7, 1, 3, -1, -1, -1, -1, -1, -1, -1],
        [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1, -1, -1, -1],
        [4, 0, 3, 7, 4, 3, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [4, 8, 7, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [9, 10, 8, 10, 11, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 0, 9, 3, 9, 11, 11, 9, 10, -1, -1, -1, -1, -1, -1, -1],
        [0, 1, 10, 0, 10, 8, 8, 10, 11, -1, -1, -1, -1, -1, -1, -1],
        [3, 1, 10, 11, 3, 10, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 2, 11, 1, 11, 9, 9, 11, 8, -1, -1, -1, -1, -1, -1, -1],
        [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1, -1, -1, -1],
        [0, 2, 11, 8, 0, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [3, 2, 11, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [2, 3, 8, 2, 8, 10, 10, 8, 9, -1, -1, -1, -1, -1, -1, -1],
        [9, 10, 2, 0, 9, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1, -1, -1, -1],
        [1, 10, 2, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [1, 3, 8, 9, 1, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 9, 1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [0, 3, 8, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
        [-1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1],
    ];
})(Eden || (Eden = {}));
/// <reference path="celltypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="march.ts"/>
/// <reference path="math.ts"/>
var Eden;
(function (Eden) {
    var v3 = twgl.v3;
    function renderTerrain(cells) {
        var arrays = { position: [], normal: [], color: [], indices: [] };
        arrays['position']['size'] = 3;
        arrays['normal']['size'] = 3;
        arrays['color']['size'] = 3;
        // Verts.
        var verts = arrays["position"];
        var indices = arrays["indices"];
        var vertCache = {};
        for (var y = 2; y < Eden.ChunkSize - 4; y++) {
            for (var z = 2; z < Eden.ChunkSize - 4; z++) {
                for (var x = 2; x < Eden.ChunkSize - 4; x++) {
                    // TODO: This is grossly inefficient. We can do a lot better than reusing the 'env' logic.
                    var env = Eden.makeEnv(cells, x, y, z);
                    var cube = Eden.fillCube(env);
                    Eden.marchCube([x, y, z], cube, vertCache, verts, indices);
                }
            }
        }
        // Colors.
        var colors = arrays["color"];
        for (var i = 0; i < verts.length; i += 3) {
            var x = Math.floor(verts[i + 0]);
            var y = Math.floor(verts[i + 1]);
            var z = Math.floor(verts[i + 2]);
            var color = Eden.terrainCellColor(cells[Eden.cellIndex(x, y, z)]);
            colors.push(color[0], color[1], color[2]);
        }
        // Normals.
        // Calculate from faces.
        var normals = new Array(verts.length / 3);
        for (var i = 0; i < verts.length / 3; i++) {
            normals[i] = v3.create();
        }
        var idx = 0;
        for (var i = 0; i < indices.length / 3; i++) {
            var idx0 = indices[idx + 0], idx1 = indices[idx + 1], idx2 = indices[idx + 2];
            var v0 = [verts[idx0 * 3 + 0], verts[idx0 * 3 + 1], verts[idx0 * 3 + 2]];
            var v1 = [verts[idx1 * 3 + 0], verts[idx1 * 3 + 1], verts[idx1 * 3 + 2]];
            var v2 = [verts[idx2 * 3 + 0], verts[idx2 * 3 + 1], verts[idx2 * 3 + 2]];
            idx += 3;
            var a = v3.subtract(v1, v0);
            var b = v3.subtract(v2, v0);
            var n = v3.cross(a, b);
            v3.add(normals[idx0], n, normals[idx0]);
            v3.add(normals[idx1], n, normals[idx1]);
            v3.add(normals[idx2], n, normals[idx2]);
        }
        var normal = arrays["normal"];
        for (var i = 0; i < normals.length; i++) {
            var n = v3.normalize(normals[i]);
            normal.push(-n[0], -n[1], -n[2]);
        }
        return twgl.createBufferInfoFromArrays(Eden.gl, arrays);
    }
    Eden.renderTerrain = renderTerrain;
})(Eden || (Eden = {}));
var Eden;
(function (Eden) {
    Eden.EAST_BIT = 0x01;
    Eden.WEST_BIT = 0x10;
    Eden.SOUTH_BIT = 0x02;
    Eden.NORTH_BIT = 0x20;
    Eden.SOUTHEAST_BIT = 0x04;
    Eden.NORTHWEST_BIT = 0x40;
    Eden.NORTHEAST_BIT = 0x08;
    Eden.SOUTHWEST_BIT = 0x80;
    Eden.LineDirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
    var AllLines = [
        { dir: 0, u: 0, v: 0, len: 5, hit: 0 },
        { dir: 0, u: 0, v: 1, len: 5, hit: 0 },
        { dir: 0, u: 0, v: 2, len: 5, hit: 0, bits: Eden.WEST_BIT | Eden.EAST_BIT },
        { dir: 0, u: 0, v: 3, len: 5, hit: 0 },
        { dir: 0, u: 0, v: 4, len: 5, hit: 0 },
        { dir: 1, u: 0, v: 0, len: 5, hit: 0 },
        { dir: 1, u: 1, v: 0, len: 5, hit: 0 },
        { dir: 1, u: 2, v: 0, len: 5, hit: 0, bits: Eden.NORTH_BIT | Eden.SOUTH_BIT },
        { dir: 1, u: 3, v: 0, len: 5, hit: 0 },
        { dir: 1, u: 4, v: 0, len: 5, hit: 0 },
        { dir: 2, u: 0, v: 3, len: 2, hit: 0 },
        { dir: 2, u: 0, v: 2, len: 3, hit: 0 },
        { dir: 2, u: 0, v: 1, len: 4, hit: 0 },
        { dir: 2, u: 0, v: 0, len: 5, hit: 0, bits: Eden.NORTHWEST_BIT | Eden.SOUTHEAST_BIT },
        { dir: 2, u: 1, v: 0, len: 4, hit: 0 },
        { dir: 2, u: 2, v: 0, len: 3, hit: 0 },
        { dir: 2, u: 3, v: 0, len: 2, hit: 0 },
        { dir: 3, u: 0, v: 1, len: 2, hit: 0 },
        { dir: 3, u: 0, v: 2, len: 3, hit: 0 },
        { dir: 3, u: 0, v: 3, len: 4, hit: 0 },
        { dir: 3, u: 0, v: 4, len: 5, hit: 0, bits: Eden.SOUTHWEST_BIT | Eden.NORTHEAST_BIT },
        { dir: 3, u: 1, v: 4, len: 4, hit: 0 },
        { dir: 3, u: 2, v: 4, len: 3, hit: 0 },
        { dir: 3, u: 3, v: 4, len: 2, hit: 0 }
    ];
    function copyLine(l) {
        return { u: l.u, v: l.v, dir: l.dir, len: l.len, hit: l.hit, bits: l.bits };
    }
    function penvOfs(u, v) {
        return (u * 5) + v;
    }
    function penvOfsCenter(du, dv) {
        return 12 + (dv * 5) + du;
    }
    // TODO:
    // - Cache found lines.
    //   When caching, fill all rotations/inversions to avoid redundant work.
    // TODO: Explain.
    function bitsForEnv(env) {
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
        if (env[penvOfsCenter(-1, 0)]) {
            envbits |= Eden.WEST_BIT;
        }
        if (env[penvOfsCenter(1, 0)]) {
            envbits |= Eden.EAST_BIT;
        }
        if (env[penvOfsCenter(0, -1)]) {
            envbits |= Eden.NORTH_BIT;
        }
        if (env[penvOfsCenter(0, 1)]) {
            envbits |= Eden.SOUTH_BIT;
        }
        if (env[penvOfsCenter(-1, -1)]) {
            envbits |= Eden.NORTHWEST_BIT;
        }
        if (env[penvOfsCenter(1, 1)]) {
            envbits |= Eden.SOUTHEAST_BIT;
        }
        if (env[penvOfsCenter(-1, 1)]) {
            envbits |= Eden.SOUTHWEST_BIT;
        }
        if (env[penvOfsCenter(1, -1)]) {
            envbits |= Eden.NORTHEAST_BIT;
        }
        // Walls go wherever both are set.
        return bits & envbits;
    }
    Eden.bitsForEnv = bitsForEnv;
    function findAllLines(env) {
        var lines = [];
        for (var i = 0; i < AllLines.length; ++i) {
            var line = copyLine(AllLines[i]);
            var u = line.u, v = line.v;
            var du = Eden.LineDirs[line.dir][0], dv = Eden.LineDirs[line.dir][1];
            for (var j = 0; j < line.len; j++) {
                if (env[penvOfs(u, v)]) {
                    line.hit++;
                }
                u += du;
                v += dv;
            }
            if (line.hit > 0) {
                lines.push(line);
            }
        }
        return lines;
    }
    // Counts the number of cells set in the given environment.
    function countCells(env) {
        var total = 0;
        for (var u = 0; u < 5; u++) {
            for (var v = 0; v < 5; v++) {
                if (env[penvOfs(u, v)]) {
                    total++;
                }
            }
        }
        return total;
    }
    var _count = 0;
    function optimizeLines(lines, env) {
        var total = countCells(env);
        // Sort lines by descending length.
        lines.sort(function (a, b) {
            return b.hit - a.hit;
        });
        // 'Touched' bits for each cell in the environment.
        var touched = [];
        for (var i = 0; i < 125; i++) {
            touched[i] = false;
        }
        _count = 0;
        return optimizeHelper(lines, total, env, touched);
    }
    function optimizeHelper(lines, total, env, touched) {
        // Find all candidate lines of equal length.
        var bestResult, bestLength = 100;
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
    function optimizeLine(head, tail, total, env, touched) {
        _count++;
        // Walk the line through the environment, updating `total` and `touched`.
        var anythingTouched = false;
        var u = head.u, v = head.v, du = Eden.LineDirs[head.dir][0], dv = Eden.LineDirs[head.dir][1];
        for (var j = 0; j < head.len; j++) {
            var ofs = penvOfs(u, v);
            if (env[ofs] && !touched[ofs]) {
                anythingTouched = true;
                touched[ofs] = true;
                total--;
            }
            u += du;
            v += dv;
        }
        var result = [];
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
})(Eden || (Eden = {}));
/// <reference path="celltypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="math.ts"/>
/// <reference path="envlines.ts"/>
/// <reference path="envplanes.ts"/>
var Eden;
(function (Eden) {
    var m4 = twgl.m4;
    Eden.EAST = 0x01; // +du  0
    Eden.WEST = 0x02; // -du  0
    Eden.SOUTH = 0x04; //  0  +dv
    Eden.NORTH = 0x08; //  0  -dv
    Eden.SOUTHEAST = 0x10; // +du +dv
    Eden.NORTHWEST = 0x20; // -du -dv
    Eden.NORTHEAST = 0x40; // +du -dv
    Eden.SOUTHWEST = 0x80; // -du +dv
    // plane -> dir -> [point on plane]
    var planePoints = {};
    // plane -> dir -> [center, radius]
    var planePieces = {};
    function initWall() {
        // Initialize one planePoints list for each plane type.
        for (var i = 0, planeBit = 1; i < Eden.PlaneCount; i++, planeBit <<= 1) {
            var points = [];
            var du = Eden.PlaneNormals[planeBit][1], dv = Eden.PlaneNormals[planeBit][2];
            points[Eden.EAST] = [+du[0], +du[1], +du[2]];
            points[Eden.WEST] = [-du[0], -du[1], -du[2]];
            points[Eden.SOUTH] = [+dv[0], +dv[1], +dv[2]];
            points[Eden.NORTH] = [-dv[0], -dv[1], -dv[2]];
            points[Eden.SOUTHEAST] = [+du[0] + dv[0], +du[1] + dv[1], +du[2] + dv[2]];
            points[Eden.NORTHWEST] = [-du[0] - dv[0], -du[1] - dv[1], -du[2] - dv[2]];
            points[Eden.NORTHEAST] = [+du[0] - dv[0], +du[1] - dv[1], +du[2] - dv[2]];
            points[Eden.SOUTHWEST] = [-du[0] + dv[0], -du[1] + dv[1], -du[2] + dv[2]];
            planePoints[planeBit] = points;
        }
        // Initialize plane piece models.
        for (var i = 0, planeBit = 1; i < Eden.PlaneCount; i++, planeBit <<= 1) {
            var pieces = {};
            var points = planePoints[planeBit];
            // Just 1/3 cubes for now.
            for (var j = 0, dirBit = 1; j < 8; j++, dirBit <<= 1) {
                var p = points[dirBit];
                pieces[dirBit] = [
                    [p[0] * (1 / 3), p[1] * (1 / 3), p[2] * (1 / 3)],
                    [(1 / 6), (1 / 6), (1 / 6)]
                ];
            }
            planePieces[planeBit] = pieces;
        }
    }
    Eden.initWall = initWall;
    function bitEnv(env) {
        var bits = new Array(125);
        for (var i = 0; i < 125; i++) {
            bits[i] = Eden.cellType(env[i]) == Eden.CellWall;
        }
        return bits;
    }
    var WallCell = (function () {
        function WallCell() {
        }
        WallCell.prototype.render = function (env) {
            var planeBits = Eden.planeBitsForEnv(bitEnv(env));
            // Now render all the walls.
            // Start with a box.
            // var csg = CSG.cube({ radius: [0.125, 0.125, 0.125] });
            var csg = CSG.cube({ radius: [(1 / 6), (1 / 6), (1 / 6)] });
            // Then add the planes.
            for (var i = 0, planeBit = 1; i < Eden.PlaneCount; i++, planeBit <<= 1) {
                if (planeBits & planeBit) {
                    csg = renderPlane(env, planeBit, csg);
                }
            }
            return Eden.csgPolysToBuffers(csg.toPolygons());
        };
        return WallCell;
    })();
    Eden.WallCell = WallCell;
    function renderPlane(env, plane, csg) {
        var dirBits = dirBitsForPlane(env, plane);
        var piece = planePieces[plane];
        for (var i = 0, dirBit = 1; i < 8; i++, dirBit <<= 1) {
            if (dirBits & dirBit) {
                csg = csg.union(CSG.cube({ center: piece[dirBit][0], radius: piece[dirBit][1] }));
            }
        }
        return csg;
    }
    // TODO: Not remotely complete. We really need a way to sort out hard corners and angles.
    function dirBitsForPlane(env, plane) {
        var dirBits = 0;
        var points = planePoints[plane];
        for (var i = 0, dirBit = 1; i < 8; i++, dirBit <<= 1) {
            var p = points[dirBit];
            if (env[Eden.envOfsCenter(p[0], p[1], p[2])] == Eden.CellWall) {
                dirBits |= dirBit;
            }
        }
        return dirBits;
    }
    function xform(eighth) {
        var m = m4.rotationY(eighth * Eden.TAU / 8);
        return [m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]];
    }
    Eden.registerCell(Eden.CellWall, new WallCell());
})(Eden || (Eden = {}));
/// <reference path="celltypes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="cells.ts"/>
var Eden;
(function (Eden) {
    var FloorCell = (function () {
        function FloorCell() {
        }
        FloorCell.prototype.render = function (env) {
            var cube = CSG.cube({ center: [0, 0, 0], radius: [0.45, 0.05, 0.45] });
            return Eden.csgPolysToBuffers(cube.toPolygons());
        };
        return FloorCell;
    })();
    Eden.FloorCell = FloorCell;
    Eden.registerCell(Eden.CellFloor, new FloorCell());
})(Eden || (Eden = {}));
/// <reference path="globals.ts"/>
/// <reference path="celltypes.ts"/>
/// <reference path="terrain.ts"/>
/// <reference path="wall.ts"/>
/// <reference path="floor.ts"/>
var Eden;
(function (Eden) {
    var _geomCache = {};
    function envOfs(x, y, z) {
        return (y * 25) + (z * 5) + x;
    }
    Eden.envOfs = envOfs;
    function envOfsCenter(dx, dy, dz) {
        return 62 + (dy * 25) + (dz * 5) + dx;
    }
    Eden.envOfsCenter = envOfsCenter;
    function geomForEnv(x, y, z, env) {
        var key = envKey(env);
        if (!(key in _geomCache)) {
            var bt = Eden.typeForCell(Eden.cellType(env[envOfsCenter(0, 0, 0)]));
            if (bt) {
                _geomCache[key] = bt.render(env);
            }
            else {
                delete _geomCache[key];
            }
        }
        return _geomCache[key];
    }
    Eden.geomForEnv = geomForEnv;
    function csgPolysToBuffers(polys) {
        var arrays = { position: [], normal: [], color: [], indices: [] };
        arrays['position']['size'] = 3;
        arrays['normal']['size'] = 3;
        arrays['color']['size'] = 3;
        var vidx = 0;
        for (var i = 0; i < polys.length; i++) {
            var p = polys[i];
            // Triangulate CSG polys, which can be convex polygons of any number of verts.
            for (var j = 0; j < p.vertices.length - 2; j++) {
                pushVector(arrays["position"], p.vertices[0].pos);
                pushVector(arrays["normal"], p.vertices[0].normal);
                arrays["color"].push(1, 1, 1);
                for (var k = 0; k < 2; k++) {
                    var idx = (j + k + 1) % p.vertices.length;
                    pushVector(arrays["position"], p.vertices[idx].pos);
                    pushVector(arrays["normal"], p.vertices[idx].normal);
                    arrays["color"].push(1, 1, 1);
                }
                arrays["indices"].push(vidx + 0);
                arrays["indices"].push(vidx + 1);
                arrays["indices"].push(vidx + 2);
                vidx += 3;
            }
        }
        return twgl.createBufferInfoFromArrays(Eden.gl, arrays);
    }
    Eden.csgPolysToBuffers = csgPolysToBuffers;
    function pushVector(a, v) {
        a.push(v.x);
        a.push(v.y);
        a.push(v.z);
    }
    function envKey(env) {
        return env.toString();
    }
})(Eden || (Eden = {}));
/// <reference path="math.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="camera.ts"/>
/// <reference path="terrain.ts"/>
var Eden;
(function (Eden) {
    var v3 = twgl.v3;
    var m4 = twgl.m4;
    Eden.ChunkExp = 4;
    Eden.ChunkExp2 = Eden.ChunkExp * 2;
    Eden.ChunkExp3 = Eden.ChunkExp * 3;
    Eden.ChunkSize = 1 << Eden.ChunkExp;
    Eden.ChunkSize2 = 1 << Eden.ChunkExp2;
    Eden.ChunkSize3 = 1 << Eden.ChunkExp3;
    var ChunkInterior = Eden.ChunkSize - 4;
    var worldPI;
    function initWorldRendering() {
        worldPI = twgl.createProgramInfo(Eden.gl, ["worldVS", "worldFS"]);
    }
    Eden.initWorldRendering = initWorldRendering;
    function chunkKey(cx, cy, cz) {
        return "" + cx + ":" + cy + ":" + cz;
    }
    var World = (function () {
        function World() {
            this._chunks = {};
            this.ensureChunk(0, 0, 0);
        }
        World.prototype.chunk = function (cx, cy, cz) {
            return this._chunks[chunkKey(cx, cy, cz)];
        };
        World.prototype.chunkForCell = function (x, y, z) {
            return this.chunk(Math.floor(x / ChunkInterior), Math.floor(y / ChunkInterior), Math.floor(z / ChunkInterior));
        };
        World.prototype.cell = function (x, y, z) {
            return this.chunkForCell(x, y, z).cell(x % ChunkInterior, y % ChunkInterior, z % ChunkInterior);
        };
        World.prototype.setCell = function (x, y, z, cell) {
            this.chunkForCell(x, y, z).setCell(x % ChunkInterior, y % ChunkInterior, z % ChunkInterior, cell);
        };
        World.prototype.update = function () {
            for (var key in this._chunks) {
                this._chunks[key].update();
            }
        };
        World.prototype.render = function (camera) {
            // TODO: Only around camera.
            for (var key in this._chunks) {
                this._chunks[key].render(camera);
            }
        };
        World.prototype.ensureChunk = function (cx, cy, cz) {
            var key = chunkKey(cx, cy, cz);
            if (!(key in this._chunks)) {
                this._chunks[key] = new Chunk();
            }
        };
        return World;
    })();
    Eden.World = World;
    var Chunk = (function () {
        function Chunk() {
            this._cells = new Uint32Array(Eden.ChunkSize3);
            this._meshes = [];
            for (var x = 0; x < Eden.ChunkSize; x++) {
                for (var y = 0; y < Eden.ChunkSize; y++) {
                    for (var z = 0; z < Eden.ChunkSize; z++) {
                        this.setCell(x, y, z, 0);
                    }
                }
            }
            this.fill(2, 2, 2, 10, 2, 10, Eden.terrainCell(Eden.CellGrass, 1.0));
        }
        Chunk.prototype.render = function (camera) {
            var uniforms = {
                u_ambient: [0.3, 0.3, 0.3],
                u_lightDir: v3.normalize([-1, -2, -3]),
                u_viewProjection: camera.viewProjection(),
                u_model: m4.identity()
            };
            // Draw the terrain.
            Eden.gl.useProgram(worldPI.program);
            twgl.setBuffersAndAttributes(Eden.gl, worldPI, this._terrain);
            twgl.setUniforms(worldPI, uniforms);
            Eden.gl.drawElements(Eden.gl.TRIANGLES, this._terrain.numElements, Eden.gl.UNSIGNED_SHORT, 0);
            // Draw the individual cells.
            // TODO: This could be dramatically optimized using glDrawElementsInstanced().
            for (var x = 2; x < Eden.ChunkSize - 4; x++) {
                for (var y = 2; y < Eden.ChunkSize - 4; y++) {
                    for (var z = 2; z < Eden.ChunkSize - 4; z++) {
                        var meshIdx = cellIndex(x, y, z);
                        var bi = this._meshes[meshIdx];
                        if (bi) {
                            twgl.setBuffersAndAttributes(Eden.gl, worldPI, bi);
                            uniforms["u_model"] = m4.translation([x, y, z]);
                            twgl.setUniforms(worldPI, uniforms);
                            Eden.gl.drawElements(Eden.gl.TRIANGLES, bi.numElements, Eden.gl.UNSIGNED_SHORT, 0);
                        }
                    }
                }
            }
        };
        Chunk.prototype.cell = function (x, y, z) {
            return this._cells[cellIndex(x, y, z)];
        };
        Chunk.prototype.setCell = function (x, y, z, cell) {
            this._cells[cellIndex(x, y, z)] = cell;
            this._dirty = true;
        };
        Chunk.prototype.update = function () {
            if (!this._dirty) {
                return;
            }
            this._dirty = false;
            // Update terrain.
            this._terrain = Eden.renderTerrain(this._cells);
            // TODO: This can be a lot more efficient:
            // - Make 'env' a direct reference to the Uint32Array.
            // - Keep track of dirty region to minimize walking.
            for (var x = 2; x < Eden.ChunkSize - 4; x++) {
                for (var y = 2; y < Eden.ChunkSize - 4; y++) {
                    for (var z = 2; z < Eden.ChunkSize - 4; z++) {
                        var meshIdx = cellIndex(x, y, z);
                        var mesh = this._meshes[meshIdx];
                        var geom = null;
                        if (this.cell(x, y, z) != Eden.CellAir) {
                            var env = makeEnv(this._cells, x, y, z);
                            geom = Eden.geomForEnv(x, y, z, env);
                        }
                        if (!geom) {
                            if (mesh) {
                                delete this._meshes[meshIdx];
                            }
                        }
                        else {
                            this._meshes[meshIdx] = geom;
                        }
                        meshIdx++;
                    }
                }
            }
        };
        Chunk.prototype.fill = function (x0, y0, z0, x1, y1, z1, cell) {
            for (var x = x0; x <= x1; x++) {
                for (var y = y0; y <= y1; y++) {
                    for (var z = z0; z <= z1; z++) {
                        this.setCell(x, y, z, cell);
                    }
                }
            }
        };
        return Chunk;
    })();
    function makeEnv(cells, cx, cy, cz) {
        var env = new Array(125);
        for (var x = 0; x < 5; x++) {
            for (var y = 0; y < 5; y++) {
                for (var z = 0; z < 5; z++) {
                    // Y, Z, X dominant order.
                    var cell = cells[cellIndex(cx + x - 2, cy + y - 2, cz + z - 2)];
                    // var type = cellType(cell)
                    // if (isTerrain(type)) {
                    env[y * 25 + z * 5 + x] = cell;
                }
            }
        }
        return env;
    }
    Eden.makeEnv = makeEnv;
    function cellIndex(x, y, z) {
        return (z << Eden.ChunkExp2) | (y << Eden.ChunkExp) | x;
    }
    Eden.cellIndex = cellIndex;
})(Eden || (Eden = {}));
var Eden;
(function (Eden) {
    var EPSILON = 1e-8;
    //Quaternion multiplication
    function qmult(a, b) {
        return [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
            a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
            a[0] * b[2] + a[2] * b[0] + a[3] * b[1] - a[1] * b[3],
            a[0] * b[3] + a[3] * b[0] + a[1] * b[2] - a[2] * b[1]];
    }
    //Converts a quaternion to a matrix
    function qmatrix(q) {
        return [[1 - 2 * q[2] * q[2] - 2 * q[3] * q[3], 2 * q[1] * q[2] - 2 * q[3] * q[0], 2 * q[1] * q[3] + 2 * q[2] * q[0]],
            [2 * q[1] * q[2] + 2 * q[3] * q[0], 1 - 2 * q[1] * q[1] - 2 * q[3] * q[3], 2 * q[2] * q[3] - 2 * q[1] * q[0]],
            [2 * q[1] * q[3] - 2 * q[2] * q[0], 2 * q[2] * q[3] + 2 * q[1] * q[0], 1 - 2 * q[1] * q[1] - 2 * q[2] * q[2]]];
    }
    function qcross(a, b) {
        //Normalize a and b
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
        //Compute quaternion cross of a and b
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
    //Normalize a quaternion
    function qnormalize(q) {
        var s = 0.0;
        for (var i = 0; i < 4; ++i) {
            s += q[i] * q[i];
        }
        if (s < EPSILON) {
            return [1.0, 0.0, 0.0, 0.0];
        }
        s = 1.0 / Math.sqrt(s);
        var r = new Array(4);
        for (var i = 0; i < 4; ++i) {
            r[i] = q[i] * s;
        }
        return r;
    }
    var Arcball = (function () {
        // Assumes z-direction is view axis.
        function Arcball() {
            this.rotation = [1.0, 0.0, 0.0, 0.0];
            this.translation = [0.0, 0.0, 0.0];
            this.zoom_factor = 0.0;
            this.z_plane = 0.5;
            this.pan_speed = 20.0;
            this.zoom_speed = 1.0;
            this.last_x = 0.0;
            this.last_y = 0.0;
        }
        // Call this whenever the mouse moves
        Arcball.prototype.update = function (mx, my, flags) {
            if (flags.rotate) {
                var v0 = [this.last_x, -this.last_y, this.z_plane];
                var v1 = [mx, -my, this.z_plane];
                this.rotation = qnormalize(qmult(qcross(v0, v1), this.rotation));
            }
            if (flags.pan || flags.zoom) {
                var rmatrix = qmatrix(this.rotation);
                var dx = mx - this.last_x;
                var dy = this.last_y - my;
                var pan_speed = flags.pan ? this.pan_speed : 0.0;
                var zoom_speed = flags.zoom ? this.zoom_speed : 0.0;
                for (var i = 0; i < 3; ++i) {
                    this.translation[i] += pan_speed * (dx * rmatrix[0][i] + dy * rmatrix[1][i]);
                }
                this.zoom_factor += zoom_speed * dy;
            }
            this.last_x = mx;
            this.last_y = my;
        };
        // Returns the camera matrix.
        Arcball.prototype.matrix = function () {
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
                }
                else {
                    result[i] = [0.0, 0.0, 0.0, 1.0];
                }
            }
            return result;
        };
        return Arcball;
    })();
    Eden.Arcball = Arcball;
})(Eden || (Eden = {}));
var Eden;
(function (Eden) {
    Eden.KeyBackspace = 8;
    Eden.KeyTab = 9;
    Eden.KeyEnter = 13;
    Eden.KeyShift = 16;
    Eden.KeyCtrl = 17;
    Eden.KeyAlt = 18;
    Eden.KeyPauseBreak = 19;
    Eden.KeyCapsLock = 20;
    Eden.KeyEscape = 27;
    Eden.KeySpace = 32;
    Eden.KeyPageUp = 33;
    Eden.KeyPageDown = 34;
    Eden.KeyEnd = 35;
    Eden.KeyHome = 36;
    Eden.KeyLeftArrow = 37;
    Eden.KeyUpArrow = 38;
    Eden.KeyRightArrow = 39;
    Eden.KeyDownArrow = 40;
    Eden.KeyInsert = 45;
    Eden.KeyDelete = 46;
    Eden.Key0 = 48;
    Eden.Key1 = 49;
    Eden.Key2 = 50;
    Eden.Key3 = 51;
    Eden.Key4 = 52;
    Eden.Key5 = 53;
    Eden.Key6 = 54;
    Eden.Key7 = 55;
    Eden.Key8 = 56;
    Eden.Key9 = 57;
    Eden.KeyA = 65;
    Eden.KeyB = 66;
    Eden.KeyC = 67;
    Eden.KeyD = 68;
    Eden.KeyE = 69;
    Eden.KeyF = 70;
    Eden.KeyG = 71;
    Eden.KeyH = 72;
    Eden.KeyI = 73;
    Eden.KeyJ = 74;
    Eden.KeyK = 75;
    Eden.KeyL = 76;
    Eden.KeyM = 77;
    Eden.KeyN = 78;
    Eden.KeyO = 79;
    Eden.KeyP = 80;
    Eden.KeyQ = 81;
    Eden.KeyR = 82;
    Eden.KeyS = 83;
    Eden.KeyT = 84;
    Eden.KeyU = 85;
    Eden.KeyV = 86;
    Eden.KeyW = 87;
    Eden.KeyX = 88;
    Eden.KeyY = 89;
    Eden.KeyZ = 90;
    Eden.KeyLeftWindow = 91;
    Eden.KeyRightWindow = 92;
    Eden.KeySelect = 93;
    Eden.KeyNumpad0 = 96;
    Eden.KeyNumpad1 = 97;
    Eden.KeyNumpad2 = 98;
    Eden.KeyNumpad3 = 99;
    Eden.KeyNumpad4 = 100;
    Eden.KeyNumpad5 = 101;
    Eden.KeyNumpad6 = 102;
    Eden.KeyNumpad7 = 103;
    Eden.KeyNumpad8 = 104;
    Eden.KeyNumpad9 = 105;
    Eden.KeyMultiply = 106;
    Eden.KeyAdd = 107;
    Eden.KeySubtract = 109;
    Eden.KeyDecimalPoint = 110;
    Eden.KeyDivide = 111;
    Eden.KeyF1 = 112;
    Eden.KeyF2 = 113;
    Eden.KeyF3 = 114;
    Eden.KeyF4 = 115;
    Eden.KeyF5 = 116;
    Eden.KeyF6 = 117;
    Eden.KeyF7 = 118;
    Eden.KeyF8 = 119;
    Eden.KeyF9 = 120;
    Eden.KeyF10 = 121;
    Eden.KeyF11 = 122;
    Eden.KeyF12 = 123;
    Eden.KeyNumLock = 144;
    Eden.KeyScrollLock = 145;
    Eden.KeySemicolon = 186;
    Eden.KeyEqualSign = 187;
    Eden.KeyComma = 188;
    Eden.KeyDash = 189;
    Eden.KeyPeriod = 190;
    Eden.KeyForwardSlash = 191;
    Eden.KeyGraveAccent = 192;
    Eden.KeyOpenBracket = 219;
    Eden.KeyBackSlash = 220;
    Eden.KeyCloseBraket = 221;
    Eden.KeySinglequote = 222;
})(Eden || (Eden = {}));
/// <reference path="lib/twgl.d.ts"/>
/// <reference path="globals.ts"/>
/// <reference path="envplanes.ts"/>
/// <reference path="csg.ts"/>
/// <reference path="camera.ts"/>
/// <reference path="world.ts"/>
/// <reference path="arcball.ts"/>
/// <reference path="cells.ts"/>
/// <reference path="math.ts"/>
/// <reference path="keys.ts"/>
var Eden;
(function (Eden) {
    var world;
    var camera;
    var theta = 0, phi = 0;
    var target = [2, 2, 2];
    function init() {
        // Order matters. Yuck.
        Eden.initEnvPlanes();
        Eden.initWall();
        twgl.setAttributePrefix("a_");
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        document.body.appendChild(canvas);
        Eden.gl = twgl.getWebGLContext(canvas);
        Eden.initWorldRendering();
        world = new Eden.World();
        camera = new Eden.Camera();
        document.addEventListener("mousemove", function (e) {
            theta = e.clientX / 100;
            phi = e.clientY / 100;
        });
        document.addEventListener("keydown", function (e) {
            switch (e.keyCode) {
                case Eden.KeyW:
                    target[2] -= 1;
                    break;
                case Eden.KeyS:
                    target[2] += 1;
                    break;
                case Eden.KeyA:
                    target[0] -= 1;
                    break;
                case Eden.KeyD:
                    target[0] += 1;
                    break;
                case Eden.KeyF:
                    target[1] -= 1;
                    break;
                case Eden.KeyR:
                    target[1] += 1;
                    break;
                case Eden.KeySpace:
                    var cell = world.cell(target[0], target[1], target[2]);
                    world.setCell(target[0], target[1], target[2], (cell != Eden.CellAir) ? Eden.CellAir : Eden.makeCell(Eden.CellWall));
                    break;
            }
        });
    }
    function render() {
        requestAnimationFrame(render);
        var cx = 8 * Math.cos(theta);
        var cy = 6;
        var cz = 8 * Math.sin(theta);
        camera.setPosition([target[0] + cx, target[1] + cy, target[2] + cz]);
        camera.lookAt([target[0], target[1], target[2]], [0, 1, 0]);
        Eden.gl.canvas.width = window.innerWidth;
        Eden.gl.canvas.height = window.innerHeight;
        Eden.gl.viewport(0, 0, Eden.gl.canvas.width, Eden.gl.canvas.height);
        camera.setAspect(Eden.gl.canvas.offsetWidth / Eden.gl.canvas.offsetHeight);
        camera.update();
        world.update();
        Eden.gl.enable(Eden.gl.DEPTH_TEST);
        Eden.gl.enable(Eden.gl.CULL_FACE);
        Eden.gl.clearColor(0x7e / 0x100, 0xc0 / 0x100, 0xee / 0x100, 1);
        Eden.gl.clear(Eden.gl.COLOR_BUFFER_BIT | Eden.gl.DEPTH_BUFFER_BIT);
        world.render(camera);
    }
    function ws() {
        var socket = new WebSocket('ws://localhost:2112');
        socket.onopen = function () {
            socket.send("wut?");
        };
        socket.onmessage = function (message) {
            console.log('Connection 1', message.data);
        };
    }
    function main() {
        ws();
        init();
        render();
    }
    Eden.main = main;
})(Eden || (Eden = {}));
Eden.main();
