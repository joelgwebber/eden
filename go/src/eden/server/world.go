package server

type World struct {
	chunks map[Location]*Chunk
}

func (w *World) Init() {
	w.chunks = make(map[Location]*Chunk)
	w.EnsureChunk(Location{0, 0, 0})
}

func (w *World) Chunk(loc Location) *Chunk {
	return w.chunks[loc]
}

func (w *World) EnsureChunk(loc Location) *Chunk {
	c, exists := w.chunks[loc]
	if !exists {
		c = NewChunk(w, loc)
		w.chunks[loc] = c
	}
	return c
}

func (w *World) Tick() {
	for _, chunk := range w.chunks {
		chunk.Tick()
	}
}
