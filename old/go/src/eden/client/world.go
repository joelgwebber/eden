package client

type ivec3 [3]int

type World struct {
	game    *Game
	noise   *Perlin
	regions map[ivec3]*Region
}

func NewWorld(game *Game) *World {
	return &World{
		game:    game,
		noise:   NewPerlin(42),
		regions: make(map[ivec3]*Region),
	}
}

func (w *World) NewRegionAt(x, y, z int) *Region {
	v := ivec3{x, y, z}
	if r, exists := w.regions[v]; exists {
		return r
	}

	r := NewRegion(w, x, y, z)
	r.Randomize(w.noise)
	w.regions[v] = r
	return r
}

func (w *World) RegionAt(x, y, z int) *Region {
	r := w.NewRegionAt(x, y, z)
	r.Update()
	return r
}

func (w *World) Sim() {
	// ...
}
