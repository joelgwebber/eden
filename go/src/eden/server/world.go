package server

// TODO: Keep track of "active" chunks and flush inactive ones.
//   This should depend upon whether players are observing a chunk, as well as which sorts of
//   actors are in it, which implies some segregation between "important" and "unimportant" actors.
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

// TODO: Some mechanism for deciding which chunks to swap in/out, depending upon who's observing.
func (w *World) Tick() {
	for _, chunk := range w.chunks {
		chunk.Tick()
	}
}
