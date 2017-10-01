package server

import (
	"eden/math32"
)

const (
	ChunkExp      = 4
	ChunkExp2     = ChunkExp * 2
	ChunkExp3     = ChunkExp * 3
	ChunkSize     = 1 << ChunkExp
	ChunkSize2    = 1 << ChunkExp2
	ChunkSize3    = 1 << ChunkExp3
	ChunkInterior = ChunkSize - 2
)

const (
	// Neighbor bitfield
	neighbor000 int32 = 1 << iota
	neighbor100
	neighbor200
	neighbor010
	neighbor110
	neighbor210
	neighbor020
	neighbor120
	neighbor220
	neighbor001
	neighbor101
	neighbor201
	neighbor011
	neighbor111
	neighbor211
	neighbor021
	neighbor121
	neighbor221
	neighbor002
	neighbor102
	neighbor202
	neighbor012
	neighbor112
	neighbor212
	neighbor022
	neighbor122
	neighbor222
)

var (
	noise = NewPerlin(42)
)

func init() {
	if ChunkExp3 > 32 {
		panic("chunk locations won't fit in a uint32")
	}
}

type Chunk struct {
	world        *World
	loc          Location
	terrainField []uint32
	objets       map[uint64]Objet

	// TODO: Track player focii to know when we can drop old versions.
	version      int        // Current version
	firstVersion int        // Version to which mutations[0] is applied
	mutations    []Mutation // Outstanding mutations (culled once all clients have seen a version)
}

func NewChunk(world *World, loc Location) *Chunk {
	c := &Chunk{
		world:        world,
		loc:          loc,
		terrainField: make([]uint32, ChunkSize3),
		objets:       make(map[uint64]Objet),
	}
	c.randomize()
	return c
}

func (c *Chunk) BeginMutation() *MutBuilder {
	return &MutBuilder{
		chunk:   c,
		version: c.version,
	}
}

func (c *Chunk) mutate(mut Mutation) {
	// Terrain cells.
	src := 0
	dst := 0
	for (src < len(mut.Terrain)) {
		dst += int(mut.Terrain[src])   // Skip count
		set := int(mut.Terrain[src+1]) // Set count
		src += 2
		for i := 0; i < set; i++ {
			c.terrainField[dst] = mut.Terrain[src]
			src++
			dst++
		}
	}

	// Objets.
	for key, obj := range mut.Objets {
		if obj.Id == 0 {
			delete(c.objets, key)
		} else {
			c.objets[key] = obj
		}
	}

	// Keep the mutation history.
	c.mutations = append(c.mutations, mut)
	c.version++
}

func (c *Chunk) Tick() {
	c.pullFromNeighbors()
	// TODO: more
}

func (c *Chunk) CurState() Mutation {
	terrainRLE := make([]uint32, ChunkSize3+2)
	terrainRLE[0] = 0          // skip 0
	terrainRLE[1] = ChunkSize3 // set all
	copy(terrainRLE[2:], c.terrainField)
	return Mutation{
		Terrain: terrainRLE,
		Objets:  c.objets,
	}
}

func (c *Chunk) MutsSince(version int) []Mutation {
	if version < c.firstVersion {
		return []Mutation{c.CurState()}
	}
	return c.mutations[version:]
}

func (c *Chunk) Terrain(loc Location) uint32 {
	return c.terrainField[cellIndex(loc)]
}

func (c *Chunk) ObjetById(id uint64) Objet {
	obj, exists := c.objets[id]
	if !exists {
		panic("tried to remove non-existent obj")
	}
	return obj
}

func (c *Chunk) randomize() {
	builder := c.BeginMutation()
	for x := int32(1); x < ChunkInterior+1; x++ {
		for z := int32(1); z < ChunkInterior+1; z++ {
			ht := noise.FractalNoise2D(float32(c.loc.X*ChunkInterior+x), float32(c.loc.Z*ChunkInterior+z), 1, 10, 4) + 8
			for y := c.loc.Y*ChunkInterior + 1; y < int32(ht)+1 && y < c.loc.Y*ChunkInterior+1+ChunkInterior; y++ {
				if ht > float32(y) {
					cell := groundCell(GroundGrass, math32.Min(1, ht-float32(y)))
					builder.SetTerrain(Location{x, y - (c.loc.Y * ChunkInterior), z}, cell)
				}
			}
		}
	}
	builder.Apply()
}

// Pulls the outer shell of cells from the 26 (12 edges + 8 corners + 6 faces) neighboring regions,
// into this region, so that rendering never has to reach into a neighboring region directly.
func (c *Chunk) pullFromNeighbors() {
	builder := c.BeginMutation()

	chunk := func(bit int32, cofsx, cofsy, cofsz int32, cx, cy, cz int32, c1x, c1y, c1z int32, sx, sy, sz int32) {
		// if c.dirty&bit != 0 {
		c1 := c.world.Chunk(Location{c.loc.X + cofsx, c.loc.Y + cofsy, c.loc.Z + cofsz})
		if c1 == nil {
			return
		}

		for x := int32(0); x < sx; x++ {
			for y := int32(0); y < sy; y++ {
				for z := int32(0); z < sz; z++ {
					cell := c1.Terrain(Location{c1x + 1 + x, c1y + 1 + y, c1z + 1 + z})
					builder.SetTerrain(Location{cx + 1 + x, cy + 1 + y, cz + 1 + z}, cell)
				}
			}
		}
		// }
	}

	// Eight corners.
	chunk(neighbor000, -1, -1, -1, -1, -1, -1, ChunkInterior-1, ChunkInterior-1, ChunkInterior-1, 1, 1, 1)
	chunk(neighbor200, 1, -1, -1, ChunkInterior, -1, -1, 0, ChunkInterior-1, ChunkInterior-1, 1, 1, 1)
	chunk(neighbor020, -1, 1, -1, -1, ChunkInterior, -1, ChunkInterior-1, 0, ChunkInterior-1, 1, 1, 1)
	chunk(neighbor220, 1, 1, -1, ChunkInterior, ChunkInterior, -1, 0, 0, ChunkInterior-1, 1, 1, 1)
	chunk(neighbor002, -1, -1, 1, -1, -1, ChunkInterior, ChunkInterior-1, ChunkInterior-1, 0, 1, 1, 1)
	chunk(neighbor202, 1, -1, 1, ChunkInterior, -1, ChunkInterior, 0, ChunkInterior-1, 0, 1, 1, 1)
	chunk(neighbor022, -1, 1, 1, -1, ChunkInterior, ChunkInterior, ChunkInterior-1, 0, 0, 1, 1, 1)
	chunk(neighbor222, 1, 1, 1, ChunkInterior, ChunkInterior, ChunkInterior, 0, 0, 0, 1, 1, 1)

	// Four x-dominant edges.
	chunk(neighbor100, 0, -1, -1, 0, -1, -1, 0, ChunkInterior-1, ChunkInterior-1, ChunkInterior, 1, 1)
	chunk(neighbor120, 0, 1, -1, 0, ChunkInterior, -1, 0, 0, ChunkInterior-1, ChunkInterior, 1, 1)
	chunk(neighbor102, 0, -1, 1, 0, -1, ChunkInterior, 0, ChunkInterior-1, 0, ChunkInterior, 1, 1)
	chunk(neighbor122, 0, 1, 1, 0, ChunkInterior, ChunkInterior, 0, 0, 0, ChunkInterior, 1, 1)

	// Four y-dominant edges.
	chunk(neighbor010, -1, 0, -1, -1, 0, -1, ChunkInterior-1, 0, ChunkInterior-1, 1, ChunkInterior, 1)
	chunk(neighbor210, 1, 0, -1, ChunkInterior, 0, -1, 0, 0, ChunkInterior-1, 1, ChunkInterior, 1)
	chunk(neighbor012, -1, 0, 1, -1, 0, ChunkInterior, ChunkInterior-1, 0, 0, 1, ChunkInterior, 1)
	chunk(neighbor212, 1, 0, 1, ChunkInterior, 0, ChunkInterior, 0, 0, 0, 1, ChunkInterior, 1)

	// Four z-dominant edges.
	chunk(neighbor001, -1, -1, 0, -1, -1, 0, ChunkInterior-1, ChunkInterior-1, 0, 1, 1, ChunkInterior)
	chunk(neighbor201, 1, -1, 0, ChunkInterior, -1, 0, 0, ChunkInterior-1, 0, 1, 1, ChunkInterior)
	chunk(neighbor021, -1, 1, 0, -1, ChunkInterior, 0, ChunkInterior-1, 0, 0, 1, 1, ChunkInterior)
	chunk(neighbor221, 1, 1, 0, ChunkInterior, ChunkInterior, 0, 0, 0, 0, 1, 1, ChunkInterior)

	// Two yz faces.
	chunk(neighbor011, -1, 0, 0, -1, 0, 0, ChunkInterior-1, 0, 0, 1, ChunkInterior, ChunkInterior)
	chunk(neighbor211, 1, 0, 0, ChunkInterior, 0, 0, 0, 0, 0, 1, ChunkInterior, ChunkInterior)

	// Two xz faces.
	chunk(neighbor101, 0, -1, 0, 0, -1, 0, 0, ChunkInterior-1, 0, ChunkInterior, 1, ChunkInterior)
	chunk(neighbor121, 0, 1, 0, 0, ChunkInterior, 0, 0, 0, 0, ChunkInterior, 1, ChunkInterior)

	// Two xy faces.
	chunk(neighbor110, 0, 0, -1, 0, 0, -1, 0, 0, ChunkInterior-1, ChunkInterior, ChunkInterior, 1)
	chunk(neighbor112, 0, 0, 1, 0, 0, ChunkInterior, 0, 0, 0, ChunkInterior, ChunkInterior, 1)

	builder.Apply()
}

func cellIndex(loc Location) int {
	return int((loc.Z << ChunkExp2) | (loc.Y << ChunkExp) | loc.X)
}

// Packs a chunk-relative location into a single uint32 for use in an Objet's slot.
func PosFromVec(pos [3]int32) Position {
	return Position((pos[2] << ChunkExp2) | (pos[1] << ChunkExp) | pos[0])
}

func PosFrom(x, y, z int32) Position {
	return Position((z << ChunkExp2) | (y << ChunkExp) | x)
}

func VecFromPos(pos Position) [3]int32 {
	return [3]int32{
		int32((pos >> 0) & (ChunkSize - 1)),
		int32((pos >> ChunkExp) & (ChunkSize - 1)),
		int32((pos >> ChunkExp2) & (ChunkSize - 1)),
	}
}
