package client

import (
	"eden/client/gfx"
	. "github.com/go-gl/mathgl/mgl32"
	"math"
)

var terrainVertShader string = `
	#version 330

	uniform mat4 camera;
	uniform mat4 model;

	in vec3 vert;
	in vec3 normal;

	out vec3 fragNormal;
	out vec3 pos;

	void main() {
		fragNormal = normal;
		pos = vert;
		gl_Position = camera * model * vec4(vert, 1);
	}
`

var terrainFragShader = `
	#version 330

	uniform sampler2D topTex;
	uniform sampler2D sideTex;

	in vec3 fragNormal;
	in vec3 pos;

	out vec4 outputColor;

	float ambient = 0.5;

	void main() {
		// TODO: Parameterize the light direction.
		float light = clamp(dot(fragNormal, vec3(-0.577, 0.577, -0.577)), 0, 1);

		// TODO: Fix this crappy hack to avoid sending texture atlas location.
		vec2 xzUv = vec2(0.0/2, 0.0/2) + fract(pos.xz) / 2;
		vec2 xyUv = vec2(1.0/2, 0.0/2) + fract(pos.xy) / 2;
		vec2 yzUv = vec2(1.0/2, 0.0/2) + fract(pos.yz) / 2;

		// Calculate blending factor.
		vec3 blend = abs(fragNormal);
		blend = normalize(max(blend, 0.00001));
		float b = blend.x + blend.y + blend.z;
		blend /= vec3(b, b, b);

		vec4 xaxis = texture(topTex,  yzUv);
		vec4 yaxis = texture(sideTex, xzUv);
		vec4 zaxis = texture(sideTex, xyUv);
		vec4 tex = xaxis * blend.x + yaxis * blend.y + zaxis * blend.z;

		outputColor = tex * (light + ambient);
	}
`

type Terrain struct {
	mesh    *gfx.Mesh
	mat     *gfx.Material
	normals []Vec3
}

var terrainMat *gfx.Material

func (t *Terrain) Init() {
	if terrainMat == nil {
		var err error
		terrainMat, err = gfx.NewMaterial(gfx.MaterialDef{
			VertexShader:    terrainVertShader,
			FragmentShader:  terrainFragShader,
			ModelTransform:  "model",
			CameraTransform: "camera",
			Samplers: []gfx.SamplerDef{
				gfx.SamplerDef{Name: "topTex", TextureFile: "terrain.png"},
				gfx.SamplerDef{Name: "sideTex", TextureFile: "terrain.png"},
			},
		})
		if err != nil {
			panic(err)
		}
	}

	t.mat = terrainMat
}

// Updates the terrain for the given region data. This rebuilds the entire
// terrain mesh from scratch.
func (t *Terrain) Update(r *Region) {
	// Build mesh verts/indices.
	verts := make([]float32, 0)
	indices := make([]uint16, 0)

	var cube [8]float32
	index := make(map[uint64]uint16)
	count := 0
	for x := 0; x < RegionSize; x++ {
		for y := 0; y < RegionSize; y++ {
			for z := 0; z < RegionSize; z++ {
				t.fillCube(x, y, z, r, &cube)
				verts, indices = marchCube(Vec3{float32(x - 1), float32(y - 1), float32(z - 1)}, &cube, index, verts, indices)
				count++
			}
		}
	}

	if len(verts) > 0 {
		// Build normals.
		t.calculateNormals(r)
		for i := 0; i < len(verts); i += 6 {
			n := t.normalForPoint(verts[i : i+3])
			verts[i+3] = n[0]
			verts[i+4] = n[1]
			verts[i+5] = n[2]
		}

		// Build mesh (if there are any verts).
		t.mesh = gfx.NewMesh(
			[]gfx.VertDef{
				gfx.VertDef{Size: 3, Offset: 0, Name: "vert"},
				gfx.VertDef{Size: 3, Offset: 3, Name: "normal"},
			}, verts, indices, t.mat)
	}
}

func (t *Terrain) calculateNormals(r *Region) {
	t.normals = make([]Vec3, RegionStride3)

	for y := -1; y < RegionSize+1; y++ {
		for z := -1; z < RegionSize+1; z++ {
			for x := -1; x < RegionSize+1; x++ {
				dx := r.Cell(x+1, y, z).Density - r.Cell(x-1, y, z).Density
				dy := r.Cell(x, y+1, z).Density - r.Cell(x, y-1, z).Density
				dz := r.Cell(x, y, z+1).Density - r.Cell(x, y, z-1).Density

				idx := (x+2) + (y+2)*RegionStride + (z+2)*RegionStride2
				t.normals[idx] = Vec3([3]float32{dx, dy, dz}).Normalize()
			}
		}
	}
}

func round(x float32) int {
	if x < 0 {
		return int(math.Ceil(float64(x-0.5)))
	}
	return int(math.Floor(float64(x+0.5)))
}

func (t *Terrain) normalForPoint(pos []float32) Vec3 {
	x := round(pos[0])
	y := round(pos[1])
	z := round(pos[2])

	size := RegionStride
	size2 := size * size

	n := t.normals[(x+3)+(y+3)*size+(z+3)*size2]
	n = Vec3{-n[0], -n[1], -n[2]} // Porque?
	return n
}

// Fills the 8 density values of the voxels surrounding a given position.
func (t *Terrain) fillCube(x, y, z int, r *Region, cube *[8]float32) {
	for i := 0; i < 8; i++ {
		_x := x + intVertexOffset[i][0]
		_y := y + intVertexOffset[i][1]
		_z := z + intVertexOffset[i][2]
		c := r.Cell(_x, _y, _z)
		if c.Type == CellTerrain {
			cube[i] = c.Density
		} else {
			cube[i] = 0
		}
	}
}

// March a single cube, adding new faces to the vert/index buffers.
func marchCube(pos Vec3, cube *[8]float32, oldVerts map[uint64]uint16, verts []float32, indices []uint16) ([]float32, []uint16) {
	flagIndex := 0
	offset := float32(0.0)

	var edgeVertex [12]Vec3

	// Find which vertices are inside of the surface and which are outside.
	for i := uint(0); i < 8; i++ {
		if cube[i] <= 0.5 {
			flagIndex |= 1 << i
		}
	}

	// Find which edges are intersected by the surface.
	edgeFlags := cubeEdgeFlags[flagIndex]

	// If the cube is entirely inside or outside of the surface, then there will be no intersections.
	if edgeFlags == 0 {
		return verts, indices
	}

	// Find the point of intersection of the surface with each edge.
	for i := uint(0); i < 12; i++ {
		// If there is an intersection on this edge.
		if (edgeFlags & (1 << i)) != 0 {
			offset = getOffset(cube[edgeConnection[i][0]], cube[edgeConnection[i][1]])

			edgeVertex[i][0] = pos[0] + vertexOffset[edgeConnection[i][0]][0] + offset*edgeDirection[i][0]
			edgeVertex[i][1] = pos[1] + vertexOffset[edgeConnection[i][0]][1] + offset*edgeDirection[i][1]
			edgeVertex[i][2] = pos[2] + vertexOffset[edgeConnection[i][0]][2] + offset*edgeDirection[i][2]
		}
	}

	// Save the triangles that were found. There can be up to five per cube.
	for i := uint16(0); i < 5; i++ {
		if triangleConnectionTable[flagIndex][3*i] < 0 {
			break
		}

		// Get the three verts for this triangle and compute its normal.
		var triVerts [3]Vec3
		for j := uint16(0); j < 3; j++ {
			triVerts[j] = edgeVertex[triangleConnectionTable[flagIndex][3*i+j]]
		}
		a := triVerts[1].Sub(triVerts[0])
		b := triVerts[2].Sub(triVerts[0])
		normal := a.Cross(b)

		idx := uint16(len(verts) / 6)
		for j := uint16(0); j < 3; j++ {
			// Build a key for the vertex, by flooring the x.y part and mushing them into a uint64.
			_x := uint64(triVerts[j][0]*10) & 0xffff
			_y := uint64(triVerts[j][1]*10) & 0xffff
			_z := uint64(triVerts[j][2]*10) & 0xffff
			key := (_x << 32) | (_y << 16) | _z

			if oldIdx, exists := oldVerts[key]; exists {
				// Already have a vertex at roughly this position. Reuse it and add to its normal
				// (we'll renormalize them later).
				indices = append(indices, oldIdx)
				vertpos := oldIdx * 6
				verts[vertpos+3] += normal[0]
				verts[vertpos+4] += normal[1]
				verts[vertpos+5] += normal[2]
			} else {
				// New vertex.
				oldVerts[key] = idx
				indices = append(indices, idx)
				verts = append(verts, triVerts[j][:]...)
				verts = append(verts, normal[:]...)
				idx++
			}
		}
	}

	return verts, indices
}

func getOffset(v1, v2 float32) float32 {
	delta := v2 - v1
	if delta == 0.0 {
		return 0.5
	}
	return (0.5 - v1) / delta
}
