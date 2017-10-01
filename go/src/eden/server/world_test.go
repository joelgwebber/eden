package server

import (
	"testing"
)

func TestMove(t *testing.T) {
	world := World{}
	world.Init()
	chunk := world.EnsureChunk(Location{0, 0, 0})
	obj := NewObjet(ObjetTypePlayer)
	chunk.AddObjet(obj, PosFrom(7, 7, 7))

	// One mutation, to (6, 6, 6).
	version := chunk.version
	if chunk.MoveObjet(obj, Delta{-1, -1, -1}) != nil {
		t.Fail()
	}

	muts := chunk.MutsSince(version)
	version = chunk.version
	v := VecFromPos(muts[0].Objets[obj.Id].Pos)
	if v[0] != 6 || v[1] != 6 || v[2] != 6 {
		t.Fail()
	}

	// Another, to the next chunk.
	expChunk := world.EnsureChunk(Location{-1, 0, 0})
	newVersion := expChunk.version
	newChunk := chunk.MoveObjet(obj, Delta{-7, 0, 0})
	if newChunk != expChunk {
		t.Fail()
	}
	muts = chunk.MutsSince(version)
	version = chunk.version
	newMuts := newChunk.MutsSince(newVersion)
	newVersion = newChunk.version
	if obj, exists := muts[0].Objets[obj.Id]; obj != nil || !exists {
		t.Fail()
	}
	v = VecFromPos(newMuts[0].Objets[obj.Id].Pos)
	if v[0] != ChunkInterior-1 || v[1] != 6 || v[2] != 6 {
		t.Fail()
	}
}

func TestBadPosPanic(t *testing.T) {
	world := World{}
	world.Init()
	chunk := world.EnsureChunk(Location{0, 0, 0})
	obj := NewObjet(ObjetTypePlayer)
	addShouldPanic(chunk, obj, PosFrom(-1, -1, -1), t)
	addShouldPanic(chunk, obj, PosFrom(ChunkInterior, ChunkInterior, ChunkInterior), t)
}

func addShouldPanic(c *Chunk, o *Objet, pos Position, t *testing.T) {
	defer func() {
		if recover() == nil {
			t.Fail()
		}
	}()
	c.AddObjet(o, pos)
}
