package server

// TODO: Consider merging mutations as they're added.
type MutBuilder struct {
	chunk   *Chunk
	version int
	muts    []Mutation
}

func (mb *MutBuilder) Apply() {
	if mb.chunk.version != mb.version {
		panic("can't apply mutation; version mismatch")
	}

	for _, mut := range mb.muts {
		mb.chunk.mutate(mut)
	}
}

func (mb *MutBuilder) SetTerrain(loc Location, cell uint32) {
	idx := cellIndex(loc)
	if cell != mb.chunk.terrainField[idx] {
		mb.muts = append(mb.muts, Mutation{
			Terrain: []uint32{uint32(cellIndex(loc)), 1, cell},
		})
	}
}

func (mb *MutBuilder) AddObjet(obj Objet, pos Position) {
	// TODO: Elide these checks outside of testing?
	v := VecFromPos(pos)
	if v[0] < 0 || v[1] < 0 || v[2] < 0 ||
		 v[0] >= ChunkInterior || v[1] >= ChunkInterior || v[2] >= ChunkInterior {
		panic("oob")
	}

	obj.Pos = pos
	mb.muts = append(mb.muts, Mutation{
		Objets: map[uint64]Objet{obj.Id: obj},
	})
}

func (mb *MutBuilder) RemoveObjet(id uint64) {
	mb.muts = append(mb.muts, Mutation{
		Objets: map[uint64]Objet{id: Objet{}},
	})
}

// Returns a *Chunk (and updated position) if the Objet has left this chunk and entered a new one.
// The caller is responsible for adding the Objet to the new chunk at the proper position.
func (mb *MutBuilder) MoveObjet(id uint64, delta Delta) (*Chunk, Position) {
	obj := mb.chunk.objets[id]
	vec := VecFromPos(obj.Pos)
	vec[0] += delta.DX
	vec[1] += delta.DY
	vec[2] += delta.DZ

	loc := mb.chunk.loc
	newLoc := loc
	for vec[0] < 0 {
		vec[0] += ChunkInterior
		newLoc.X--
	}
	for vec[0] >= ChunkInterior {
		vec[0] -= ChunkInterior
		newLoc.X++
	}
	for vec[1] < 0 {
		vec[1] += ChunkInterior
		newLoc.Y--
	}
	for vec[1] >= ChunkInterior {
		vec[1] -= ChunkInterior
		newLoc.Y++
	}
	for vec[2] < 0 {
		vec[2] += ChunkInterior
		newLoc.Z--
	}
	for vec[2] >= ChunkInterior {
		vec[2] -= ChunkInterior
		newLoc.Z++
	}

	newPos := PosFromVec(vec)
	if newLoc.X != loc.X || newLoc.Y != loc.Y || newLoc.Z != loc.Z {
		mb.RemoveObjet(id)
		newChunk := mb.chunk.world.EnsureChunk(newLoc)
		return newChunk, newPos
	}

	mb.AddObjet(obj, newPos)
	return nil, 0
}
