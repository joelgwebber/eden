package gfx

import (
	"bytes"
	"eden/client/res"
	"fmt"
	"github.com/go-gl/gl"
	"image"
	"image/draw"
	_ "image/png"
)

type Texture struct {
	texture gl.Texture
}

// TODO: Defs for repeat/filter/etc.
func NewTexture(filename string) (*Texture, error) {
	buf, err := res.Load(filename)
	if err != nil {
		return nil, err
	}
	img, _, err := image.Decode(bytes.NewReader(buf))
	if err != nil {
		return nil, err
	}

	rgba := image.NewRGBA(img.Bounds())
	if rgba.Stride != rgba.Rect.Size().X*4 {
		return nil, fmt.Errorf("unsupported stride")
	}
	draw.Draw(rgba, rgba.Bounds(), img, image.Point{0, 0}, draw.Src)

	texture := gl.GenTexture()
	gl.ActiveTexture(gl.TEXTURE0)
	texture.Bind(gl.TEXTURE_2D)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
	gl.TexParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)
	gl.TexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, rgba.Rect.Size().X, rgba.Rect.Size().Y, 0, gl.RGBA, gl.UNSIGNED_BYTE, rgba.Pix)

	return &Texture{
		texture: texture,
	}, nil
}

func (tex *Texture) Bind(unit gl.GLenum) {
	gl.ActiveTexture(unit)
	tex.texture.Bind(gl.TEXTURE_2D)
}
