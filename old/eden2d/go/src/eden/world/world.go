package world

// TODO: Mutex around region manipulation?
type World struct {
	regions map[string]*Region
}

func NewWorld() *World {
	w := &World{
		regions: make(map[string]*Region),
	}

	defaultRegion := w.CreateRegion("default", 16, 16)
	fakeData(defaultRegion)
	return w
}

func (w *World) CreateRegion(id string, width, height uint16) *Region {
	r := NewRegion(width, height)
	w.regions[id] = r
	return r
}

func (w *World) RegionById(id string) (*Region, bool) {
	r, exists := w.regions[id]
	return r, exists
}

func (w *World) Shutdown() {
	for id, r := range w.regions {
		r.Shutdown()
		delete(w.regions, id)
	}
}

func fakeData(r *Region) {
	pos := 0
	for y := uint16(0); y < r.height; y++ {
		for x := uint16(0); x < r.width; x++ {
			r.cells[pos+0] = makeFloor(FloorGrass, 0, false, 0)
			r.cells[pos+1] = 0
			pos += 2
		}
	}

	r.setFloor(1, 1, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallNorth, Pos: PosWallNorth}, 1, 1)
	r.AddObject(&Object{Type: StoneWallWest, Pos: PosWallWest}, 1, 1)
	r.setFloor(1, 2, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallWest, Pos: PosWallWest}, 1, 2)
	r.setFloor(1, 3, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallWest, Pos: PosWallWest}, 1, 3)
	r.AddObject(&Object{Type: StoneWallSouth, Pos: PosWallSouth}, 1, 3)

	r.setFloor(2, 1, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallNorth, Pos: PosWallNorth}, 2, 1)
	r.setFloor(2, 2, FloorWood, 0, false, 0)
	r.setFloor(2, 3, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallSouth, Pos: PosWallSouth}, 2, 3)

	r.setFloor(3, 1, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallNorth, Pos: PosWallNorth}, 3, 1)
	r.AddObject(&Object{Type: StoneWallEast, Pos: PosWallEast}, 3, 1)
	r.setFloor(3, 2, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallEast, Pos: PosWallEast}, 3, 2)
	r.setFloor(3, 3, FloorWood, 0, false, 0)
	r.AddObject(&Object{Type: StoneWallSouth, Pos: PosWallSouth}, 3, 3)
	r.AddObject(&Object{Type: StoneWallEast, Pos: PosWallEast}, 3, 3)

	r.setFloor(4, 1, FloorGrass, FloorDirtA, true, FloorTransNW)
	r.setFloor(4, 2, FloorGrass, FloorDirtA, true, FloorTransW)
	r.setFloor(4, 3, FloorGrass, FloorDirtA, true, FloorTransSW)
	r.setFloor(5, 1, FloorGrass, FloorDirtA, true, FloorTransN)
	r.setFloor(5, 2, FloorDirtA, 0, false, 0)
	r.setFloor(5, 3, FloorGrass, FloorDirtA, true, FloorTransS)
	r.setFloor(6, 1, FloorGrass, FloorDirtA, true, FloorTransNE)
	r.setFloor(6, 2, FloorGrass, FloorDirtA, true, FloorTransE)
	r.setFloor(6, 3, FloorGrass, FloorDirtA, true, FloorTransSE)
}
