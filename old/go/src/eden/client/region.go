package client

import (
	"eden/client/gfx"
	"eden/math32"
	"github.com/go-gl/mathgl/mgl32"
)

type CellType int

const (
	RegionSize    int = 16
	RegionStride  int = RegionSize + 4
	RegionStride2 int = RegionStride * RegionStride
	RegionStride3 int = RegionStride2 * RegionStride
)

const (
	// Cell types
	CellEmpty CellType = iota
	CellTerrain
	CellWall
	CellWindow
)

const (
	// Neighbor bitfield
	Neighbor000 uint32 = 1 << iota
	Neighbor100
	Neighbor200
	Neighbor010
	Neighbor110
	Neighbor210
	Neighbor020
	Neighbor120
	Neighbor220
	Neighbor001
	Neighbor101
	Neighbor201
	Neighbor011
	Neighbor111
	Neighbor211
	Neighbor021
	Neighbor121
	Neighbor221
	Neighbor002
	Neighbor102
	Neighbor202
	Neighbor012
	Neighbor112
	Neighbor212
	Neighbor022
	Neighbor122
	Neighbor222
)

type Cell struct {
	Type    CellType
	Density float32
	render  renderBlock
}

type Region struct {
	X, Y, Z int
	Cells   []Cell
	world   *World
	terrain Terrain
	dirty   uint32
}

type renderBlock struct {
	mesh     *gfx.Mesh
	xformIdx int
}

type s struct {
	x, y, z int
	t       CellType
}

type archetype struct {
	environ  []s
	meshName string
	xformIdx int
}

var stdXforms [8]mgl32.Mat4
var archetypes map[CellType][]archetype

func init() {
	up := mgl32.Vec3{0, 1, 0}
	for i := 0; i < 8; i++ {
		stdXforms[i] = mgl32.QuatRotate(math32.Tau*float32(i)/8, up).Mat4()
	}

	archetypes = map[CellType][]archetype{
		CellWindow: []archetype{
			{[]s{{-1, 0, 0, CellWall}, {1, 0, 0, CellWall}}, "wall_window.mesh", 0},
			{[]s{{0, 0, -1, CellWall}, {0, 0, 1, CellWall}}, "wall_window.mesh", 2},
			{[]s{}, "wall_window.mesh", 0},
		},
		CellWall: []archetype{
			// normal
			{[]s{{-1, 0, 0, CellWall}, {1, 0, 0, CellWall}, {0, 0, -1, CellWall}, {0, 0, 1, CellWall}}, "wall_cross.mesh", 0},
			{[]s{{1, 0, 0, CellWall}, {0, 0, -1, CellWall}, {0, 0, 1, CellWall}}, "wall_tee.mesh", 0},
			{[]s{{-1, 0, 0, CellWall}, {1, 0, 0, CellWall}, {0, 0, -1, CellWall}}, "wall_tee.mesh", 2},
			{[]s{{-1, 0, 0, CellWall}, {0, 0, -1, CellWall}, {0, 0, 1, CellWall}}, "wall_tee.mesh", 4},
			{[]s{{-1, 0, 0, CellWall}, {1, 0, 0, CellWall}, {0, 0, 1, CellWall}}, "wall_tee.mesh", 6},
			{[]s{{-1, 0, 0, CellWall}, {1, 0, 0, CellWall}}, "wall_straight.mesh", 0},
			{[]s{{0, 0, -1, CellWall}, {0, 0, 1, CellWall}}, "wall_straight.mesh", 2},
			{[]s{{1, 0, 0, CellWall}, {0, 0, 1, CellWall}}, "wall_corner.mesh", 0},
			{[]s{{1, 0, 0, CellWall}, {0, 0, -1, CellWall}}, "wall_corner.mesh", 2},
			{[]s{{-1, 0, 0, CellWall}, {0, 0, -1, CellWall}}, "wall_corner.mesh", 4},
			{[]s{{-1, 0, 0, CellWall}, {0, 0, 1, CellWall}}, "wall_corner.mesh", 6},
			{[]s{{1, 0, 0, CellWall}}, "wall_end.mesh", 0},
			{[]s{{0, 0, -1, CellWall}}, "wall_end.mesh", 2},
			{[]s{{-1, 0, 0, CellWall}}, "wall_end.mesh", 4},
			{[]s{{0, 0, 1, CellWall}}, "wall_end.mesh", 6},
			// diag
			{[]s{{1, 0, -1, CellWall}, {-1, 0, 1, CellWall}}, "wall_diag_straight.mesh", 0},
			{[]s{{-1, 0, -1, CellWall}, {1, 0, 1, CellWall}}, "wall_diag_straight.mesh", 2},
			{[]s{{1, 0, -1, CellWall}, {1, 0, 1, CellWall}}, "wall_diag_corner.mesh", 0},
			{[]s{{-1, 0, -1, CellWall}, {1, 0, -1, CellWall}}, "wall_diag_corner.mesh", 2},
			{[]s{{-1, 0, -1, CellWall}, {-1, 0, 1, CellWall}}, "wall_diag_corner.mesh", 4},
			{[]s{{-1, 0, 1, CellWall}, {1, 0, 1, CellWall}}, "wall_diag_corner.mesh", 6},
			{[]s{{1, 0, -1, CellWall}}, "wall_diag_end.mesh", 0},
			{[]s{{-1, 0, -1, CellWall}}, "wall_diag_end.mesh", 2},
			{[]s{{-1, 0, 1, CellWall}}, "wall_diag_end.mesh", 4},
			{[]s{{1, 0, 1, CellWall}}, "wall_diag_end.mesh", 6},
			// lonely
			{[]s{}, "wall.mesh", 0},
		},
	}
}

func NewRegion(world *World, x, y, z int) *Region {
	region := &Region{
		world:   world,
		X:       x,
		Y:       y,
		Z:       z,
		Cells:   make([]Cell, RegionStride*RegionStride*RegionStride),
		terrain: Terrain{},
		dirty:   0xffffffff,
	}

	region.terrain.Init()
	return region
}

func (r *Region) Randomize(noise *Perlin) {
	for x := 0; x < RegionSize; x++ {
		for z := 0; z < RegionSize; z++ {
			ht := noise.FractalNoise2D(float32(r.X*RegionSize+x), float32(r.Z*RegionSize+z), 1, 10, 4)-2
			for y := r.Y * RegionSize; y < int(ht)+1 && y < r.Y*RegionSize+RegionSize; y++ {
				if ht-float32(y) > 0 {
					r.SetType(x, y-(r.Y*RegionSize), z, CellTerrain, math32.Min(1, ht-float32(y)))
				}
			}
		}
	}
}

func (r *Region) SetCell(x, y, z int, c *Cell) {
	// TODO: set neighbor dirty bits.
	*r.Cell(x, y, z) = *c
}

func (r *Region) SetType(x, y, z int, t CellType, d float32) {
	// TODO: set neighbor dirty bits.
	c := r.Cell(x, y, z)
	c.Type = t
	c.Density = d
}

func (r *Region) Cell(x, y, z int) *Cell {
	x += 2
	y += 2
	z += 2
	return &r.Cells[z*RegionStride2+y*RegionStride+x]
}

func (r *Region) Update() {
	if r.dirty == 0 {
		return
	}

	// Pull neighbors' cells, as dictated by dirty bits.
	r.pullFromNeighbors()

	// Update the entire terrain mesh.
	r.terrain.Update(r)

	// Update cell meshes.
	// TODO: Minimal update for range of affected cells.
	for z := 0; z < RegionSize; z++ {
		for y := 0; y < RegionSize; y++ {
			for x := 0; x < RegionSize; x++ {
				r.Cell(x, y, z).render = r.renderBlockFor(x, y, z)
			}
		}
	}

	r.dirty = 0
}

func (r *Region) Draw(camera mgl32.Mat4) {
	xform := mgl32.Ident4()
	rx := r.X * RegionSize
	ry := r.Y * RegionSize
	rz := r.Z * RegionSize

	// Draw the terrain.
	if r.terrain.mesh != nil {
		xform[12] = float32(rx)
		xform[13] = float32(ry)
		xform[14] = float32(rz)
		r.terrain.mesh.Draw(camera, xform)
	}

	// Draw cell meshes.
	for z := 0; z < RegionSize; z++ {
		for y := 0; y < RegionSize; y++ {
			for x := 0; x < RegionSize; x++ {
				rb := r.Cell(x, y, z).render
				if rb.mesh != nil {
					xform := stdXforms[rb.xformIdx]
					xform[12] = float32(x + rx)
					xform[13] = float32(y + ry)
					xform[14] = float32(z + rz)
					rb.mesh.Draw(camera, xform)
				}
			}
		}
	}
}

func (r *Region) renderBlockFor(x, y, z int) renderBlock {
	archs, ok := archetypes[r.Cell(x, y, z).Type]
	if !ok {
		return renderBlock{nil, 0}
	}

nextArch:
	for _, arch := range archs {
		env := arch.environ
		for _, s := range env {
			cell := r.Cell(x+s.x, y+s.y, z+s.z)
			if cell.Type != s.t {
				continue nextArch
			}
		}
		return renderBlock{r.world.game.MeshByName(arch.meshName), arch.xformIdx}
	}
	return renderBlock{nil, 0}
}

// Pulls the outer shell of cells from the 26 (12 edges + 8 corners + 6 faces) neighboring regions,
// into this region, so that rendering never has to reach into a neighboring region directly.
func (r *Region) pullFromNeighbors() {
	chunk := func(bit uint32, rofsx, rofsy, rofsz int, rx, ry, rz int, r1x, r1y, r1z int, sx, sy, sz int) {
		if r.dirty&bit != 0 {
			r1 := r.world.NewRegionAt(r.X+rofsx, r.Y+rofsy, r.Z+rofsz)
			for x := 0; x < sx; x++ {
				for y := 0; y < sy; y++ {
					for z := 0; z < sz; z++ {
						r.SetCell(rx+x, ry+y, rz+z, r1.Cell(r1x+x, r1y+y, r1z+z))
					}
				}
			}
		}
	}

	// Eight corners.
	chunk(Neighbor000, -1, -1, -1, -2, -2, -2, RegionSize-2, RegionSize-2, RegionSize-2, 2, 2, 2)
	chunk(Neighbor200, 1, -1, -1, RegionSize, -2, -2, 0, RegionSize-2, RegionSize-2, 2, 2, 2)
	chunk(Neighbor020, -1, 1, -1, -2, RegionSize, -2, RegionSize-2, 0, RegionSize-2, 2, 2, 2)
	chunk(Neighbor220, 1, 1, -1, RegionSize, RegionSize, -2, 0, 0, RegionSize-2, 2, 2, 2)
	chunk(Neighbor002, -1, -1, 1, -2, -2, RegionSize, RegionSize-2, RegionSize-2, 0, 2, 2, 2)
	chunk(Neighbor202, 1, -1, 1, RegionSize, -2, RegionSize, 0, RegionSize-2, 0, 2, 2, 2)
	chunk(Neighbor022, -1, 1, 1, -2, RegionSize, RegionSize, RegionSize-2, 0, 0, 2, 2, 2)
	chunk(Neighbor222, 1, 1, 1, RegionSize, RegionSize, RegionSize, 0, 0, 0, 2, 2, 2)

	// Four x-dominant edges.
	chunk(Neighbor100, 0, -1, -1, 0, -2, -2, 0, RegionSize-2, RegionSize-2, RegionSize, 2, 2)
	chunk(Neighbor120, 0, 1, -1, 0, RegionSize, -2, 0, 0, RegionSize-2, RegionSize, 2, 2)
	chunk(Neighbor102, 0, -1, 1, 0, -2, RegionSize, 0, RegionSize-2, 0, RegionSize, 2, 2)
	chunk(Neighbor122, 0, 1, 1, 0, RegionSize, RegionSize, 0, 0, 0, RegionSize, 2, 2)

	// Four y-dominant edges.
	chunk(Neighbor010, -1, 0, -1, -2, 0, -2, RegionSize-2, 0, RegionSize-2, 2, RegionSize, 2)
	chunk(Neighbor210, 1, 0, -1, RegionSize, 0, -2, 0, 0, RegionSize-2, 2, RegionSize, 2)
	chunk(Neighbor012, -1, 0, 1, -2, 0, RegionSize, RegionSize-2, 0, 0, 2, RegionSize, 2)
	chunk(Neighbor212, 1, 0, 1, RegionSize, 0, RegionSize, 0, 0, 0, 2, RegionSize, 2)

	// Four z-dominant edges.
	chunk(Neighbor001, -1, -1, 0, -2, -2, 0, RegionSize-2, RegionSize-2, 0, 2, 2, RegionSize)
	chunk(Neighbor201, 1, -1, 0, RegionSize, -2, 0, 0, RegionSize-2, 0, 2, 2, RegionSize)
	chunk(Neighbor021, -1, 1, 0, -2, RegionSize, 0, RegionSize-2, 0, 0, 2, 2, RegionSize)
	chunk(Neighbor221, 1, 1, 0, RegionSize, RegionSize, 0, 0, 0, 0, 2, 2, RegionSize)

	// Two yz faces.
	chunk(Neighbor011, -1, 0, 0, -2, 0, 0, RegionSize-2, 0, 0, 2, RegionSize, RegionSize)
	chunk(Neighbor211, 1, 0, 0, RegionSize, 0, 0, 0, 0, 0, 2, RegionSize, RegionSize)

	// Two xz faces.
	chunk(Neighbor101, 0, -1, 0, 0, -2, 0, 0, RegionSize-2, 0, RegionSize, 2, RegionSize)
	chunk(Neighbor121, 0, 1, 0, 0, RegionSize, 0, 0, 0, 0, RegionSize, 2, RegionSize)

	// Two xy faces.
	chunk(Neighbor110, 0, 0, -1, 0, 0, -2, 0, 0, RegionSize-2, RegionSize, RegionSize, 2)
	chunk(Neighbor112, 0, 0, 1, 0, 0, RegionSize, 0, 0, 0, RegionSize, RegionSize, 2)
}
