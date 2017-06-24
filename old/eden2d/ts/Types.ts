module eden {
  import Px = PIXI;
  import Loaders = Px.loaders;

  // Floor bits:
  //   Type 0:        14 bits
  //   Type 1:        14 bits
  //   Transition:     1 bit
  //   TransitionDir:  3 bits
  export const FloorTransNW = 0;
  export const FloorTransN = 1;
  export const FloorTransNE = 2;
  export const FloorTransW = 3;
  export const FloorTransE = 4;
  export const FloorTransSW = 5;
  export const FloorTransS = 6;
  export const FloorTransSE = 7;

  export function floor0(floor: number): number {
    return floor & 0x3fff;
  }

  export function floor1(floor: number): number {
    return (floor >>> 14) & 0x3fff;
  }

  export function floorTrans(floor: number): number {
    return (floor >>> 28) & 0x01;
  }

  export function floorTransDir(floor: number): number {
    return (floor >>> 29) & 0x07;
  }

  // Position constants also encode draw order.
  export const PosDefault       = 0;
	export const PosWallNorth     = 1;
  export const PosWallSouth     = 2;
	export const PosWallWest      = 3;
	export const PosWallEast      = 4;
  export const PosWallDecoNorth = 5;
  export const PosWallDecoSouth = 6;
  export const PosWallDecoWest  = 7;
  export const PosWallDecoEast  = 8;

  export const PosSortOrder: {[pos: number]: number} = {
    1: 000, // PosWallNorth
    5: 100, // PosWallDecoNorth
    0: 200, // PosDefault
    3: 300, // PosWallWest
    7: 400, // PosWallDecoWest
    4: 500, // PosWallEast
    8: 600, // PosWallDecoEast
    2: 700, // PosWallSouth
    6: 800  // PosWallDecoSouth
  };

  // Floors:
  export const FloorGrass = 1;
  export const FloorWater = 2;
  export const FloorDirtA = 3;
  export const FloorWood  = 4;

  // Objects:
  export const ObjectBook     = 1;
  export const ObjectPlayer   = 2;
  export const StoneWallNorth = 0x10001;
  export const StoneWallSouth = 0x10002;
  export const StoneWallWest  = 0x10003;
  export const StoneWallEast  = 0x10004;

  // Resource names.
  export var FloorNames: {[type: number]: string} = {
    1: "grass", // FloorGrass
    2: "water", // FloorWater
    3: "dirta", // FloorDirtA
    4: "wood"   // FloorWood
  };

  var FloorResourceSuffixes: string[] = [
    "_inner_0",
    "_inner_1",
    "_inner_2",
    "_inner_3",
    "_outer_0",
    "_outer_1",
    "_outer_2",
    "_outer_3",
    "_outer_4",
    "_outer_5",
    "_outer_6",
    "_outer_7",
    "_outer_8",
    "_patch_0",
    "_patch_1",
    "_solid_0",
    "_solid_1",
    "_solid_2"
  ];

  export var FloorGeomSuffixes: string[] = [
    "_inner_0",
    "_outer_7",
    "_inner_1",
    "_outer_5",
    "_outer_3",
    "_inner_2",
    "_outer_1",
    "_inner_3",

    "_outer_0",
    "_outer_1",
    "_outer_2",
    "_outer_3",
    "_outer_5",
    "_outer_6",
    "_outer_7",
    "_outer_8"
  ];

  export interface Image {
    n: string, x: number, y: number
  }

  export var ObjectImages: {[type: number]: Image} = {
    0x00001: { n: "book_closed",  x: 0, y:  -4 }, // ObjectBook
    0x00002: { n: "princess_0",   x: 0, y:  -6 }, // ObjectPlayer
    0x10001: { n: "walla_horz_0", x: 0, y: -12 }, // StoneWallNorth
    0x10002: { n: "walla_horz_1", x: 0, y:   0 }, // StoneWallSouth
    0x10003: { n: "walla_vert_0", x: 0, y: -12 }, // StoneWallWest
    0x10004: { n: "walla_vert_1", x: 0, y: -12 }, // StoneWallEast
  };

  export function loadFloors(loader: Loaders.Loader) {
    for (var id in FloorNames) {
      var name = FloorNames[id];
      for (var i = 0; i < FloorResourceSuffixes.length; i++) {
        loader.add("images/floors/" + name + FloorResourceSuffixes[i] + ".png");
      }
    }
  }

  export function loadObjects(loader: Loaders.Loader) {
    for (var id in ObjectImages) {
      var image = ObjectImages[id];
      loader.add("images/objects/" + image.n + ".png");
    }
  }
}
