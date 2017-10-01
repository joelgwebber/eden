package proto

type MessageType uint16

const (
	MessageTypeConnect      MessageType = 0
	MessageTypeConnected                = 1
	MessageTypeRegionUpdate             = 2
	MessageTypePlayerAction             = 3
)

type PlayerActionType uint8

const (
	PlayerActionMove  PlayerActionType = 0 // [MoveDir]
	PlayerActionPlace                  = 1 // [ObjectType, Position]
)

type MoveDir uint8

const (
	MoveNorth MoveDir = 1
	MoveSouth         = 2
	MoveWest          = 3
	MoveEast          = 4
)

type Message struct {
	Type         MessageType
	Connect      *MessageConnect      `json:",omitempty"`
	Connected    *MessageConnected    `json:",omitempty"`
	RegionUpdate *MessageRegionUpdate `json:",omitempty"`
	PlayerAction *MessagePlayerAction `json:",omitempty"`
}

type MessageConnect struct {
	Name   string
	Region string
}

type MessageConnected struct {
	Width, Height uint16
	Cells         []uint32
	Objects       []ObjectRecord
}

type ObjectRecord struct {
	I uint32 // Id
	T uint32 // Type -- 0 == remove
	P uint8  // Pos
	N uint32 // Next
}

type TileRecord struct {
	I uint32 // y * width + x + layer
	V uint32 // new value
}

type MessageRegionUpdate struct {
	TileRecs   []TileRecord
	ObjectRecs []ObjectRecord
}

type MessagePlayerAction struct {
	Type PlayerActionType
	Args []interface{}
}
