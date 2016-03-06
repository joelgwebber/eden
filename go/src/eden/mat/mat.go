package mat

import (
	"C"
	"unsafe"
)

type Vec3 [3]float32
type Mat4 [16]float32

func NewVec3(x, y, z float32) *Vec3 {
	v := [3]float32{x, y, z}
	return (*Vec3)(&v)
}

func NewVec3s(n int) []float32 {
	return make([]float32, n*3)
}

func Vec3At(vs []float32, n int) *Vec3 {
	return (*Vec3)(unsafe.Pointer(&vs[n * 3]))
}

func NewMat4() *Mat4 {
	m := [16]float32{}
	return (*Mat4)(&m)
}

func (m *Mat4) Identity() {
	for i := 0; i < 16; i++ {
		m[i] = 0
	}
	m[0] = 1; m[5] = 1; m[10] = 1; m[15] = 1
}

func (m *Mat4) Mul4(m2 *Mat4, dst *Mat4) {
	for i := 0; i < 16; i+=4 {
		for j := 0; j < 4; j++ {
			dst[i+j] = m2[i]*m[j]+m2[i+1]*m[j+4]+m2[i+2]*m[j+8]+m2[i+3]*m[j+12];
		}
	}
}

func (m *Mat4) MulVec3(v *Vec3, dst *Vec3) {
	dst[0] = m[0]*v[0] + m[4]*v[1] + m[8]*v[2]
	dst[1] = m[1]*v[0] + m[5]*v[1] + m[9]*v[2]
	dst[2] = m[2]*v[0] + m[6]*v[1] + m[10]*v[2]
}

func (a *Vec3) Dot(b *Vec3) float32 {
	return float32(a[0] * b[0] + a[1] * b[1] + a[2] * b[2])
}
