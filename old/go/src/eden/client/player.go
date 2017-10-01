package client

import (
	"eden/math32"
	"github.com/go-gl/glfw3"
	"github.com/go-gl/mathgl/mgl32"
)

type Player struct {
	game     *Game
	camera   mgl32.Mat4
	rot      mgl32.Mat3
	pos      mgl32.Vec3
	velocity mgl32.Vec3
}

func NewPlayer(game *Game) *Player {
	p := &Player{
		game: game,
	}
	return p
}

func (p *Player) OnKey(key glfw3.Key, action glfw3.Action, mods glfw3.ModifierKey) {
	switch action {
	case glfw3.Press:
		switch key {
		case glfw3.KeyW:
			p.velocity[2] -= 1
		case glfw3.KeyS:
			p.velocity[2] += 1
		case glfw3.KeyA:
			p.velocity[2] -= 1
		case glfw3.KeyD:
			p.velocity[2] += 1
		case glfw3.KeyQ:
			p.velocity[1] -= 1
		case glfw3.KeyE:
			p.velocity[1] += 1
		}

	case glfw3.Release:
		switch key {
		case glfw3.KeyW:
			p.velocity[2] += 1
		case glfw3.KeyS:
			p.velocity[2] -= 1
		case glfw3.KeyA:
			p.velocity[2] += 1
		case glfw3.KeyD:
			p.velocity[2] -= 1
		case glfw3.KeyQ:
			p.velocity[1] += 1
		case glfw3.KeyE:
			p.velocity[1] -= 1
		}
	}
}

func (p *Player) Sim() {
	w, h := p.game.window.GetSize()
	x, y := p.game.window.GetCursorPosition()

	fw, fh := float32(w), float32(h)
	fx, fy := float32(x), float32(y)

	// Take rotation from cursor position.
	theta := (fw/2 - fx) / fw * math32.Tau
	phi := (fh/2 - fy) / fh * math32.Tau / 2
	if phi > math32.Tau/4 {
		phi = math32.Tau / 4
	}
	if phi < -math32.Tau/4 {
		phi = -math32.Tau / 4
	}

	p.rot = mgl32.Rotate3DY(theta).Mul3(mgl32.Rotate3DX(phi))

	// Update translation based upon current velocity.
	dir := p.rot.Mul3x1(p.velocity)
	p.pos = p.pos.Add(dir)

	// Build the transform and stick it in p.camera.
	RT := p.rot.Transpose()
	RTt := RT.Mul3x1(p.pos)
	xform := p.rot.Transpose().Mat4()
	xform[12] = -RTt[0]
	xform[13] = -RTt[1]
	xform[14] = -RTt[2]

	p.camera = mgl32.Perspective(70.0, float32(w)/float32(h), 0.1, 10000.0).Mul4(xform)
}

func (p *Player) Draw() {
	// For now, just draw the 27-box of regions around the player.
	_x := int(p.pos[0])
	_y := int(p.pos[1])
	_z := int(p.pos[2])
	x := _x / RegionSize
	y := _y / RegionSize
	z := _z / RegionSize
	for ox := -4; ox <= 4; ox++ {
		for oy := -4; oy <= 4; oy++ {
			for oz := -4; oz <= 4; oz++ {
				r := p.game.world.RegionAt(x+ox, y+oy, z+oz)
				r.Draw(p.camera)
			}
		}
	}
}

// The one in mgl32 returns y/z backwards.
func sphere2cart(r, theta, phi float32) mgl32.Vec3 {
	st, ct := math32.Sincos(theta)
	sp, cp := math32.Sincos(phi)

	return mgl32.Vec3{r * float32(st*cp), r * float32(ct), r * float32(st*sp)}
}
