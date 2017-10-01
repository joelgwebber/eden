package server

// Chunk location.
type Location struct {
	X int32
	Y int32
	Z int32
}

// Position within a chunk.
type Position uint32

// Relative position.
type Delta struct {
	DX int32
	DY int32
	DZ int32
}

const (
	MessageTypeConnect   = 1
	MessageTypePlayerObj = 2
	MessageTypeChunk     = 3
	MessageTypePlayerCmd = 4
)

const (
	CommandMove = "move" // [dx, dy, dz]
)

type Message struct {
	Type      int
	Connect   *MessageConnect        `json:",omitempty"`
	PlayerObj *MessagePlayerObj      `json:",omitempty"`
	Chunk     *MessageChunk          `json:",omitempty"`
	PlayerCmd *MessageChunkPlayerCmd `json:",omitempty"`
}

type MessageConnect struct {
	Name string
}

type MessagePlayerObj struct {
	PlayerObjId uint64
}

type MessageChunk struct {
	Loc  Location
	Muts []Mutation
}

type Mutation struct {
	Terrain []uint32         `json:",omitempty"` // RLE-compressed changes to terrain field cells: [#skip, #set, [#set]uint32, ...]
	Objets  map[uint64]Objet `json:",omitempty"` // Id->Objet map; zero value -> removed
}

type MessageChunkPlayerCmd struct {
	Cmd  string
	Args []int32
}

type ObjetType uint32

type Objet struct {
	Id   uint64    // Unique identifier
	Type ObjetType // Objet type
	Pos  Position  // Position within chunk
}
