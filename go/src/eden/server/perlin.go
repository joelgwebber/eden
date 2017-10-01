package server

import (
	math "eden/math32"
	"math/rand"
)

const B = 256

type Perlin struct {
	perm []int
}

func NewPerlin(seed int64) *Perlin {
	p := &Perlin{
		perm: make([]int, B+B),
	}
	rand.Seed(seed)

	i := 0
	for ; i < B; i++ {
		p.perm[i] = i
	}

	for ; i != 0; i-- {
		k := p.perm[i]
		j := rand.Intn(B)
		p.perm[i] = p.perm[j]
		p.perm[j] = k
	}

	for i = 0; i < B; i++ {
		p.perm[B+i] = p.perm[i]
	}

	return p
}

func (p *Perlin) FractalNoise1D(x float32, octNum int, frq, amp float32) float32 {
	gain := float32(1.0)
	sum := float32(0.0)

	for i := 0; i < octNum; i++ {
		sum += p.noise1D(x*gain/frq) * amp / gain
		gain *= 2.0
	}
	return sum
}

func (p *Perlin) FractalNoise2D(x, y float32, octNum int, frq, amp float32) float32 {
	gain := float32(1.0)
	sum := float32(0.0)

	for i := 0; i < octNum; i++ {
		sum += p.noise2D(x*gain/frq, y*gain/frq) * amp / gain
		gain *= 2.0
	}
	return sum
}

func (p *Perlin) FractalNoise3D(x, y, z float32, octNum int, frq, amp float32) float32 {
	gain := float32(1.0)
	sum := float32(0.0)

	for i := 0; i < octNum; i++ {
		sum += p.noise3D(x*gain/frq, y*gain/frq, z*gain/frq) * amp / gain
		gain *= 2.0
	}
	return sum
}

//returns a noise value between -0.5 and 0.5
func (p *Perlin) noise1D(x float32) float32 {
	ix0 := math.Floor(x)
	fx0 := x - float32(ix0)
	fx1 := fx0 - 1.0
	ix1 := (ix0 + 1) & 0xff
	ix0 = ix0 & 0xff

	s := fade(fx0)

	n0 := grad1(p.perm[ix0], fx0)
	n1 := grad1(p.perm[ix1], fx1)
	return 0.188 * lerp(s, n0, n1)
}

//returns a noise value between -0.75 and 0.75
func (p *Perlin) noise2D(x, y float32) float32 {
	ix0 := math.Floor(x)
	iy0 := math.Floor(y)
	fx0 := x - float32(ix0)
	fy0 := y - float32(iy0)
	fx1 := fx0 - 1.0
	fy1 := fy0 - 1.0
	ix1 := (ix0 + 1) & 0xff
	iy1 := (iy0 + 1) & 0xff
	ix0 = ix0 & 0xff
	iy0 = iy0 & 0xff

	t := fade(fy0)
	s := fade(fx0)

	nx0 := grad2(p.perm[ix0+p.perm[iy0]], fx0, fy0)
	nx1 := grad2(p.perm[ix0+p.perm[iy1]], fx0, fy1)

	n0 := lerp(t, nx0, nx1)

	nx0 = grad2(p.perm[ix1+p.perm[iy0]], fx1, fy0)
	nx1 = grad2(p.perm[ix1+p.perm[iy1]], fx1, fy1)

	n1 := lerp(t, nx0, nx1)

	return 0.507 * lerp(s, n0, n1)
}

//returns a noise value between -1.5 and 1.5
func (p *Perlin) noise3D(x, y, z float32) float32 {
	ix0 := math.Floor(x)
	iy0 := math.Floor(y)
	iz0 := math.Floor(z)
	fx0 := x - float32(ix0)
	fy0 := y - float32(iy0)
	fz0 := z - float32(iz0)
	fx1 := fx0 - 1.0
	fy1 := fy0 - 1.0
	fz1 := fz0 - 1.0
	ix1 := (ix0 + 1) & 0xff
	iy1 := (iy0 + 1) & 0xff
	iz1 := (iz0 + 1) & 0xff
	ix0 = ix0 & 0xff
	iy0 = iy0 & 0xff
	iz0 = iz0 & 0xff

	r := fade(fz0)
	t := fade(fy0)
	s := fade(fx0)

	nxy0 := grad3(p.perm[ix0+p.perm[iy0+p.perm[iz0]]], fx0, fy0, fz0)
	nxy1 := grad3(p.perm[ix0+p.perm[iy0+p.perm[iz1]]], fx0, fy0, fz1)
	nx0 := lerp(r, nxy0, nxy1)

	nxy0 = grad3(p.perm[ix0+p.perm[iy1+p.perm[iz0]]], fx0, fy1, fz0)
	nxy1 = grad3(p.perm[ix0+p.perm[iy1+p.perm[iz1]]], fx0, fy1, fz1)
	nx1 := lerp(r, nxy0, nxy1)

	n0 := lerp(t, nx0, nx1)

	nxy0 = grad3(p.perm[ix1+p.perm[iy0+p.perm[iz0]]], fx1, fy0, fz0)
	nxy1 = grad3(p.perm[ix1+p.perm[iy0+p.perm[iz1]]], fx1, fy0, fz1)
	nx0 = lerp(r, nxy0, nxy1)

	nxy0 = grad3(p.perm[ix1+p.perm[iy1+p.perm[iz0]]], fx1, fy1, fz0)
	nxy1 = grad3(p.perm[ix1+p.perm[iy1+p.perm[iz1]]], fx1, fy1, fz1)
	nx1 = lerp(r, nxy0, nxy1)

	n1 := lerp(t, nx0, nx1)

	return 0.936 * lerp(s, n0, n1)
}

func fade(t float32) float32 {
	return t * t * t * (t*(t*6.0-15.0) + 10.0)
}

func lerp(t, a, b float32) float32 {
	return a + t*(b-a)
}

func grad1(hash int, x float32) float32 {
	h := hash % 16
	grad := float32(1.0) + float32(h%8)
	if (h % 8) < 4 {
		grad = -grad
	}
	return grad * x
}

func grad2(hash int, x, y float32) float32 {
	h := hash % 16

	var u, v float32
	if h < 4 {
		u = x
		v = y
	} else {
		u = y
		v = x
	}

	if h%2 != 0 {
		u = -u
	}
	if (h/2)%2 != 0 {
		v = -v
	}
	return u + 2.0*v
}

func grad3(hash int, x, y, z float32) float32 {
	h := hash % 16

	var u float32
	if h < 8 {
		u = x
	} else {
		u = y
	}

	var v float32
	if h < 4 {
		v = y
	} else {
		if h == 12 || h == 14 {
			v = x
		} else {
			v = z
		}
	}

	if h%2 != 0 {
		u = -u
	}
	if (h/2)%2 != 0 {
		v = -v
	}
	return u + 2.0*v
}
