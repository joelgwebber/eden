// Simple tool for creating mesh/material files for the Go client.
package main

import (
	"flag"
	"fmt"
	"os"

	"eden/client/gfx/proto"
	wf "eden/tools/wavefront"
	"eden/yolo"

	capn "github.com/glycerine/go-capnproto"
)

// TODO: Handle multiple objects.
func main() {
	input := flag.String("input", "input.obj", "input file name")
	output := flag.String("output", "output.mesh", "output file name")
	material := flag.String("material", "", "material file to associate with this mesh")
	flag.Parse()

	fmt.Printf("%s -> %s\n", *input, *output)

	wm, err := wf.LoadObj(*input)
	if err != nil {
		panic(err)
	}

	computeNormals(wm)
	fillInTexCoords(wm)
	m, s := translate(wm)
	m.SetMaterialFile(*material)

	err = writeMesh(s, *output)
	if err != nil {
		panic(err)
	}
}

// Computes normals for the Wavefront mesh, if absent.
func computeNormals(wm *wf.Mesh) {
	// Assume any normals means all normals are precomputed.
	if len(wm.Normals) != 0 {
		return
	}

	// TODO: Actually compute normals. This just assigns them all to {1, 0, 0}.
	wm.Normals = []wf.Vector{wf.Vector{1, 0, 0}}
	for _, obj := range wm.Objs {
		for _, f := range obj.Faces {
			for i := 0; i < len(f.N); i++ {
				f.N[i] = 0
			}
		}
	}
}

func fillInTexCoords(wm *wf.Mesh) {
	if len(wm.TexCoords) != 0 {
		return
	}

	// Just set them all to 0, 0.
	wm.TexCoords = []wf.Vector{wf.Vector{0, 0, 0}}
	for _, obj := range wm.Objs {
		for _, f := range obj.Faces {
			for i := 0; i < len(f.T); i++ {
				f.T[i] = 0
			}
		}
	}
}

type vertKey struct{ v, t, n int }

func translate(wm *wf.Mesh) (*proto.MeshDef, *capn.Segment) {
	// For now, we always produce precisely vert/tex/normal 3/2/3 verts.
	s := capn.NewBuffer(nil)
	m := proto.NewRootMeshDef(s)
	defs := proto.NewVertDefList(s, 3)
	def := proto.NewVertDef(s)
	def.SetSize(3)
	def.SetOffset(0)
	def.SetName("vert")
	defs.Set(0, def)
	def = proto.NewVertDef(s)
	def.SetSize(2)
	def.SetOffset(3)
	def.SetName("texCoord")
	defs.Set(1, def)
	def = proto.NewVertDef(s)
	def.SetSize(3)
	def.SetOffset(5)
	def.SetName("normal")
	defs.Set(2, def)
	m.SetVertDefs(defs)

	// Compute unique verts.
	vertIdx := make(map[vertKey]uint16)
	if len(wm.Objs) != 1 {
		panic("nyi: multiple objects in wavefront obj")
	}
	obj := wm.Objs[0]

	verts := make([]float32, 0)
	indices := make([]uint16, 0)
	for _, f := range obj.Faces {
		var fanOrigin uint16
		for vi := 0; vi < len(f.V); vi++ {
			key := vertKey{f.V[vi], f.T[vi], f.N[vi]}
			if _, exists := vertIdx[key]; !exists {
				if len(verts) == 0xffff {
					panic("exceeded maximum vertex count of 0x10000")
				}
				vertIdx[key] = uint16(len(verts) / 8)
				verts = append(verts, []float32{
					wm.Vertices[f.V[vi]].X,
					wm.Vertices[f.V[vi]].Y,
					wm.Vertices[f.V[vi]].Z,
					wm.TexCoords[f.T[vi]].X,
					1.0 - wm.TexCoords[f.T[vi]].Y, // Use GL texture coordinate system
					wm.Normals[f.N[vi]].X,
					wm.Normals[f.N[vi]].Y,
					wm.Normals[f.N[vi]].Z,
				}...)
			}

			// Triangulate face.
			idx := vertIdx[key]
			if vi < 3 {
				if vi == 0 {
					fanOrigin = idx
				}
				// Initial triangle.
				indices = append(indices, idx)
			} else {
				// Continue the fan.
				indices = append(indices, fanOrigin)
				indices = append(indices, indices[len(indices)-2])
				indices = append(indices, idx)
			}
		}
	}

	m.SetVerts(yolo.SliceFloat32Bytes(verts))
	m.SetIndices(yolo.SliceUint16Bytes(indices))

	return &m, s
}

func writeMesh(s *capn.Segment, filename string) error {
	meshfile, err := os.Create(filename)
	if err != nil {
		return err
	}
	defer meshfile.Close()
	_, err = s.WriteTo(meshfile)
	return err
}
