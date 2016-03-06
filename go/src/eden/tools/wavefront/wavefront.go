// Wavefront .obj parser, partially taken from the one buried inside gengopher.go.
//
// TODO:
// - Deal with smoothing ('s', 'l')
// - Model groups ('g')
// - Handle materials ('mtllib', 'usemtl')
package wavefront

import (
	"os"
	"io"
	"fmt"
	"bufio"
	"bytes"
	"strconv"
)

type Mesh struct {
	Vertices  []Vector
	TexCoords []Vector
	Normals   []Vector
	Objs      []Obj
}

type Obj struct {
	Name  string
	Faces []Face
}

type Face struct {
	V []int
	T []int
	N []int
}

type Vector struct {
	X, Y, Z float32
}

func LoadObj(filename string) (*Mesh, error) {
	objfile, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer objfile.Close()

	return ParseObj(objfile)
}

func ParseObj(r io.Reader) (m *Mesh, err error) {
	m = &Mesh{}

	line := 0
	defer func() {
		if err != nil {
			err = fmt.Errorf("%d: %v", line, err)
		}
	}()

	o := Obj{}
	done := func() {
		if o.Faces != nil {
			m.Objs = append(m.Objs, o)
			o = Obj{}
		}
	}

	scanner := bufio.NewScanner(r)
	for scanner.Scan() {
		line++
		b := scanner.Bytes()
		if len(b) == 0 {
			continue
		}

		switch {
		case b[0] == '#':
			// comment, ignore

		case b[0] == 'o':
			done()
			o.Name = string(b[2:])

		case b[0] == 'f':
			var f Face
			f, err = parseFace(b[2:])
			if err != nil {
				return
			}
			o.Faces = append(o.Faces, f)

		case b[0] == 'v':
			switch b[1] {
			case ' ':
				var v Vector
				v, err = parseVector(b[2:])
				if err != nil {
					return
				}
				m.Vertices = append(m.Vertices, v)
			case 't':
				var v Vector
				v, err = parseVector(b[3:])
				if err != nil {
					return
				}
				m.TexCoords = append(m.TexCoords, v)
			case 'n':
				var v Vector
				v, err = parseVector(b[3:])
				if err != nil {
					return
				}
				m.Normals = append(m.Normals, v)
			case 'p':
				err = fmt.Errorf("vp not supported")
				return
			}

		// Ignore these for now.
		case b[0] == 's', b[0] == 'l', b[0] == 'g':
		case bytes.HasPrefix(b, []byte("mtllib")):
		case bytes.HasPrefix(b, []byte("usemtl")):

		default:
			err = fmt.Errorf("unknown wavefront prefix: %q", b[0])
			return
		}
	}
	done()

	err = scanner.Err()
	return
}

// TODO: Handle multiple objects (not sure if the struct's right for that yet), and the absence of texture/normals.
func (m *Mesh) Emit(w io.Writer) error {
	for _, v := range m.Vertices {
		if _, err := fmt.Fprintf(w, "v %f %f %f\n", v.X, v.Y, v.Z); err != nil {
			return err
		}
	}
	for _, t := range m.TexCoords {
		if _, err := fmt.Fprintf(w, "vt %f %f\n", t.X, t.Y); err != nil {
			return err
		}
	}
	for _, n := range m.Normals {
		if _, err := fmt.Fprintf(w, "vn %f %f %f\n", n.X, n.Y, n.Z); err != nil {
			return err
		}
	}

	for _, o := range m.Objs {
		// Ignore 'name' for now.
		for _, f := range o.Faces {
			if _, err := fmt.Fprint(w, "f "); err != nil {
				return err
			}
			for i := 0; i < len(f.V); i++ {
				if _, err := fmt.Fprintf(w, "%d/%d/%d ", f.V[i]+1, f.T[i]+1, f.N[i]+1); err != nil {
					return err
				}
			}
			if _, err := fmt.Fprint(w, "\n"); err != nil {
				return err
			}
		}
	}
	return nil
}

func parseVector(line []byte) (v Vector, err error) {
	parts := bytes.Split(line, []byte{' '})
	n := len(parts)

	var x float64
	if n > 0 {
		if x, err = strconv.ParseFloat(string(parts[0]), 32);  err != nil {
			return
		}
		v.X = float32(x)
	}
	if n > 1 {
		if x, err = strconv.ParseFloat(string(parts[1]), 32);  err != nil {
			return
		}
		v.Y = float32(x)
	}
	if n > 2 {
		if x, err = strconv.ParseFloat(string(parts[2]), 32);  err != nil {
			return
		}
		v.Z = float32(x)
	}

	return
}

func parseFace(line []byte) (Face, error) {
	chunks := bytes.Split(line, []byte{' '})
	l := len(chunks)
	f := Face{
		V: make([]int, l),
		T: make([]int, l),
		N: make([]int, l),
	}

	for c, chunk := range chunks {
		vals := [3]int{-1, -1, -1}
		for i, m := range bytes.Split(chunk, []byte{'/'}) {
			if len(m) == 0 {
				continue
			}
			v, err := strconv.ParseInt(string(m), 10, 32)
			if err != nil {
				return f, fmt.Errorf("face[%d]: %s", i, err)
			}
			// wavefront faces are 1-indexed.
			vals[i] = int(v)-1
		}

		f.V[c] = vals[0]
		f.T[c] = vals[1]
		f.N[c] = vals[2]
	}
	return f, nil
}
