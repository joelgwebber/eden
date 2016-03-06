package math32

import "math"

const Tau = float32(2 * math.Pi)

func Min(x, y float32) float32 {
	return float32(math.Min(float64(x), float64(y)))
}

func MinInt(x, y int) int {
	return int(math.Min(float64(x), float64(y)))
}

func Max(x, y float32) float32 {
	return float32(math.Max(float64(x), float64(y)))
}

func MaxInt(x, y int) int {
	return int(math.Max(float64(x), float64(y)))
}

func Sincos(x float32) (float32, float32) {
	s, c := math.Sincos(float64(x))
	return float32(s), float32(c)
}

func Sin(x float32) float32 {
	return float32(math.Sin(float64(x)))
}

func Cos(x float32) float32 {
	return float32(math.Cos(float64(x)))
}

func Acos(x float32) float32 {
	return float32(math.Acos(float64(x)))
}

func Asin(x float32) float32 {
	return float32(math.Asin(float64(x)))
}

func Sqrt(x float32) float32 {
	return float32(math.Sqrt(float64(x)))
}

func Floor(x float32) int {
	return int(math.Floor(float64(x)))
}

func Clamp(x, min, max float32) float32 {
	if x < min {
		x = min
	}
	if x > max {
		x = max
	}
	return x
}
