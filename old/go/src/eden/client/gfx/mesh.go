package gfx

import (
	"eden/yolo"
	"eden/client/gfx/proto"
	"eden/client/res"
	capn "github.com/glycerine/go-capnproto"
	"github.com/go-gl/gl"
	"github.com/go-gl/mathgl/mgl32"
)

type Mesh struct {
	vao gl.VertexArray
	vbo gl.Buffer
	ibo gl.Buffer

	numVerts   int
	numIndices int

	mat *Material
}

type VertDef struct {
	Name   string
	Size   int
	Offset int
}

func (vd *VertDef) fromProto(p proto.VertDef) {
	vd.Name = p.Name()
	vd.Size = int(p.Size())
	vd.Offset = int(p.Offset())
}

func LoadMesh(filename string) (*Mesh, error) {
	buf, err := res.Load(filename)
	if err != nil {
		return nil, err
	}

	s, _, err := capn.ReadFromMemoryZeroCopy(buf)
	if err != nil {
		return nil, err
	}
	def := proto.ReadRootMeshDef(s)

	mat, err := LoadMaterial(def.MaterialFile())
	if err != nil {
		return nil, err
	}

	verts := yolo.SliceFloat32(def.Verts())
	indices := yolo.SliceUint16(def.Indices())

	pVertDefs := def.VertDefs()
	vertDefs := make([]VertDef, def.VertDefs().Len())
	for i := 0; i < pVertDefs.Len(); i++ {
		vertDefs[i].fromProto(pVertDefs.At(i))
	}
	return NewMesh(vertDefs, verts, indices, mat), nil
}

func NewMesh(vertDefs []VertDef, verts []float32, indices []uint16, mat *Material) *Mesh {
	m := &Mesh{
		numVerts:   len(verts),
		numIndices: len(indices),
		mat:        mat,
	}

	var stride uint
	for _, vd := range vertDefs {
		stride += uint(vd.Size)
	}

	m.vao = gl.GenVertexArray()
	m.vao.Bind()

	// Create vertex buffer and bind to shader attributes.
	m.vbo = gl.GenBuffer()
	m.vbo.Bind(gl.ARRAY_BUFFER)
	gl.BufferData(gl.ARRAY_BUFFER, 4*m.numVerts, verts, gl.STATIC_DRAW)

	shader := mat.Shader
	for _, vd := range vertDefs {
		attrib := shader.GetAttribLocation(vd.Name)
		attrib.AttribPointer(uint(vd.Size), gl.FLOAT, false, int(stride*4), uintptr(vd.Offset*4))
		attrib.EnableArray()
	}

	m.vbo.Unbind(gl.ARRAY_BUFFER)

	// Create index buffer.
	m.ibo = gl.GenBuffer()
	m.ibo.Bind(gl.ELEMENT_ARRAY_BUFFER)
	gl.BufferData(gl.ELEMENT_ARRAY_BUFFER, 2*m.numIndices, indices, gl.STATIC_DRAW)
	m.ibo.Unbind(gl.ELEMENT_ARRAY_BUFFER)

	m.vao.Unbind()
	return m
}

func (m *Mesh) Draw(camera, xform mgl32.Mat4) {
	m.mat.Use()
	m.mat.SetCameraTransform(camera)
	m.mat.SetModelTransform(xform)

	m.vao.Bind()
	m.ibo.Bind(gl.ELEMENT_ARRAY_BUFFER)

	gl.DrawElements(gl.TRIANGLES, m.numIndices, gl.UNSIGNED_SHORT, uintptr(0))

	m.ibo.Unbind(gl.ELEMENT_ARRAY_BUFFER)
	m.vao.Unbind()
}
