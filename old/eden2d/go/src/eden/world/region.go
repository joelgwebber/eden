package world

import (
	"eden/proto"
	"sync"
	"time"
)

type layer uint8

const (
	layerFloor  = 0
	layerObject = 1
)

type Object struct {
	Type   ObjectType
	Pos    ObjectPosition

	Region *Region
	X, Y   uint16
	Id     uint32
	Next   uint32

	Tick   func() // Simulation tick.
}

type Player interface {
	UpdatesNeeded() (tileGen, objectGen uint32)
	SetGeneration(tileGen, objectGen uint32)
	SendUpdate(tileRecs []proto.TileRecord, objectRecs []proto.ObjectRecord)
}

type player struct {
	intf Player
	obj  *Object
}

type Region struct {
	Mutex    sync.Mutex
	shutdown chan bool

	width, height uint16
	cells         []uint32
	objects       map[uint32]*Object

	tileRecs     []proto.TileRecord
	tileGen      uint32
	firstTileGen uint32

	curObjId       uint32
	objectRecs     []proto.ObjectRecord
	objectGen      uint32
	firstObjectGen uint32

	players map[uint32]player
}

// Creates a new, empty region of the given size.
func NewRegion(width, height uint16) *Region {
	r := &Region{
		shutdown: make(chan bool),
		width:    width,
		height:   height,
		cells:    make([]uint32, width*height*2),
		objects:  make(map[uint32]*Object),
		players:  make(map[uint32]player),
		curObjId: 1,
	}

	// Start the region ticker.
	go func() {
		ticker := time.NewTicker(250 * time.Millisecond)
		for {
			select {
			case <-ticker.C:
				r.tick()
			case <-r.shutdown:
				return
			}
		}
	}()

	return r
}

func (r *Region) Shutdown() {
	r.shutdown <- true
}

func (r *Region) tick() {
	// Take the lock once for all object ticking.
	r.Mutex.Lock()
	defer r.Mutex.Unlock()

	// Tick all objects.
	for _, o := range r.objects {
		if o.Tick != nil {
			o.Tick()
		}
	}

	r.SendPlayerUpdates()
}

// Immediately sends pending tile/object updates to all players.
func (r *Region) SendPlayerUpdates() {
	for _, p := range r.players {
		tileGen, objectGen := p.intf.UpdatesNeeded()

		tileRecs := r.tileRecsSince(tileGen)
		objectRecs := r.objectRecsSince(objectGen)

		if len(tileRecs) > 0 || len(objectRecs) > 0 {
			p.intf.SendUpdate(r.tileRecsSince(tileGen), r.objectRecsSince(objectGen))
			p.intf.SetGeneration(r.tileGen, r.objectGen)
		}
	}

	// Drop unneeded records.
	r.firstTileGen = r.tileGen
	r.firstObjectGen = r.objectGen
	r.tileRecs = nil
	r.objectRecs = nil
}

func (r *Region) Width() uint16 {
	return r.width
}

func (r *Region) Height() uint16 {
	return r.height
}

// Returns the raw slice of cell data, with layers interlaced.
func (r *Region) RawCells() []uint32 {
	return r.cells
}

// Generates a set of object records that represents the current state
// of all objects in the region.
func (r *Region) AllObjectRecs() []proto.ObjectRecord {
	recs := make([]proto.ObjectRecord, 0, len(r.objects))
	for _, obj := range r.objects {
		recs = append(recs, recFromObj(obj))
	}
	return recs
}

func (r *Region) AddPlayer(id uint32, p Player) *Object {
	obj := &Object{
		Type: ObjectPlayer,
		X:    8,
		Y:    8,
	}
	r.players[id] = player{intf: p, obj: obj}
	r.AddObject(obj, 0, 0)
	p.SetGeneration(r.tileGen, r.objectGen)
	return obj
}

func (r *Region) RemovePlayer(id uint32) {
	r.RemoveObject(r.players[id].obj)
	delete(r.players, id)
}

// Determines whether a cell location is within the region's bounds.
func (r *Region) InBounds(x, y uint16) bool {
	return x >= 0 && y >= 0 && x < r.width && y < r.height
}

// Moves an object within the region.
func (r *Region) MoveObject(obj *Object, x, y uint16) bool {
	// TODO: blocking.
	if !r.InBounds(x, y) {
		// Out of bounds.
		return false
	}

	r.removeObjectFromCell(obj)
	r.addObjectToCell(x, y, obj)
	obj.X = x
	obj.Y = y
	return true
}

// Adds an object to the region. If it's already there, it will be moved to
// the appropriate cell.
func (r *Region) AddObject(obj *Object, x, y uint16) bool {
	if obj.Region == r {
		return r.MoveObject(obj, x, y)
	}

	// TODO: blocking
	if !r.InBounds(x, y) {
		// Out of bounds.
		return false
	}

	if obj.Region != nil {
		obj.Region.RemoveObject(obj)
	}

	id := r.newObjId()
	obj.Id = id
	r.objects[id] = obj
	obj.Region = r
	r.addObjectToCell(x, y, obj)
	obj.X = x
	obj.Y = y
	return true
}

// Removes an object from the region.
func (r *Region) RemoveObject(obj *Object) {
	if obj.Region != r {
		panic("attempt to remove object from region it doesn't belong to")
	}

	r.removeObjectFromCell(obj)
	delete(r.objects, obj.Id)
	obj.Region = nil
}

// Returns a slice of tile change records after the specified generation.
func (r *Region) tileRecsSince(generation uint32) []proto.TileRecord {
	return r.tileRecs[generation-r.firstTileGen:]
}

// Returns a slice of object change records after the specified generation.
func (r *Region) objectRecsSince(generation uint32) []proto.ObjectRecord {
	return r.objectRecs[generation-r.firstObjectGen:]
}

// Gets a layer's value within a cell.
func (r *Region) cellLayer(x, y uint16, layer layer) uint32 {
	return r.cells[r.cellIdx(x, y, layer)]
}

// Sets a layer's value iwthin a cell.
// This function will generate a tile change record.
func (r *Region) setCellLayer(x, y uint16, layer layer, value uint32) {
	idx := r.cellIdx(x, y, layer)
	if r.cells[idx] != value {
		r.cells[idx] = value
		r.tileRecs = append(r.tileRecs, proto.TileRecord{I: idx, V: value})
		r.tileGen++
	}
}

// Sets a cell's floor layer.
func (r *Region) setFloor(x uint16, y uint16, floor0 FloorType, floor1 FloorType, transition bool, transDir FloorTransitionDir) {
	r.setCellLayer(x, y, layerFloor, makeFloor(floor0, floor1, transition, transDir))
}

// Adds an object to a cell's object layer linked list.
// This function will generate object change records.
func (r *Region) addObjectToCell(x, y uint16, obj *Object) {
	obj.Next = r.cellLayer(x, y, layerObject)
	r.setCellLayer(x, y, layerObject, obj.Id)

	r.objectRecs = append(r.objectRecs, recFromObj(obj))
	r.objectGen++
}

// Removes an object from a cell's object layer linked list.
// This function will generate object change records.
func (r *Region) removeObjectFromCell(obj *Object) {
	id := r.cellLayer(obj.X, obj.Y, layerObject)
	var prevObj *Object
	curObj := r.objects[id]
	for {
		if curObj.Id == obj.Id {
			break
		}
		prevObj = curObj
		curObj = r.objects[curObj.Next]
	}

	if prevObj == nil {
		r.setCellLayer(obj.X, obj.Y, layerObject, curObj.Next)
	} else {
		prevObj.Next = curObj.Next
		r.objectRecs = append(r.objectRecs, recFromObj(prevObj))
		r.objectGen++
	}

	//r.objectRecs = append(r.objectRecs, proto.ObjectRecord{
	//	I: obj.Id, T: 0,
	//})
	r.objectGen++
}

// Computes the raw index for the given cell/layer.
func (r *Region) cellIdx(x uint16, y uint16, layer layer) uint32 {
	return uint32(y*(r.width*2)+(x*2)) + uint32(layer)
}

// Allocates a new object id for this region.
func (r *Region) newObjId() uint32 {
	id := r.curObjId
	r.curObjId++
	return id
}

func recFromObj(obj *Object) proto.ObjectRecord {
	return proto.ObjectRecord{
		I: obj.Id, T: uint32(obj.Type), P: uint8(obj.Pos), N: obj.Next,
	}
}
