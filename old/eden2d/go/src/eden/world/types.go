package world

// Cell floor and object type constants.

// ---------------------------------------------------------------------------
// Floors:

// Encoded in 32 bits:
//   Type 0:       14 bits
//   Type 1:       14 bits (only used in transition)
//   Transition:    1 bit  (is it a transition?)
//   TransitionDir: 3 bits (in which direction?)
type FloorType uint16
type FloorTransitionDir uint8

const (
	FloorGrass FloorType = 1
	FloorWater           = 2
	FloorDirtA           = 3
	FloorWood            = 4
)

const (
	FloorTransNW FloorTransitionDir = 0
	FloorTransN                     = 1
	FloorTransNE                    = 2
	FloorTransW                     = 3
	FloorTransE                     = 4
	FloorTransSW                    = 5
	FloorTransS                     = 6
	FloorTransSE                    = 7
)

// Accessors.
func floor0(floor uint32) FloorType {
	return FloorType(floor & 0x3fff)
}

func floor1(floor uint32) FloorType {
	return FloorType((floor >> 14) & 0x3fff)
}

func floorTrans(floor uint32) bool {
	return (floor >> 28) & 0x01 != 0
}

func floorTransDir(floor uint32) FloorTransitionDir {
	return FloorTransitionDir((floor >> 29) & 0x07)
}

func makeFloor(floor0, floor1 FloorType, trans bool, transDir FloorTransitionDir) uint32 {
	_trans := uint32(0)
	if trans {
		_trans = 1
	}
	return uint32(floor0)<<0 | uint32(floor1)<<14 | uint32(_trans)<<28 | uint32(transDir)<<29
}

// ---------------------------------------------------------------------------
// Objects:

// Position constants for objects within cells.
type ObjectPosition uint8
type ObjectType uint32

const (
	PosDefault ObjectPosition = 0
	PosWallNorth              = 1
	PosWallSouth              = 2
	PosWallWest               = 3
	PosWallEast               = 4
	PosWallDecoNorth          = 5
	PosWallDecoSouth          = 6
	PosWallDecoWest           = 7
	PosWallDecoEast           = 8
)

const (
	ObjectBook     ObjectType = 1
	ObjectPlayer              = 2
	StoneWallNorth            = 0x10001
	StoneWallSouth            = 0x10002
	StoneWallWest             = 0x10003
	StoneWallEast             = 0x10004
)
