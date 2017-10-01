package client

import (
	"eden/client/gfx"
	"github.com/go-gl/glfw3"
	"log"
)

type Game struct {
	window *gfx.Window
	player *Player
	world  *World
	meshes map[string]*gfx.Mesh
}

func NewGame(wnd *gfx.Window) *Game {
	g := &Game{
		window: wnd,
		meshes: make(map[string]*gfx.Mesh),
	}

	g.world = NewWorld(g)
	g.player = NewPlayer(g)

	g.window.SetKeyCallback(func(w *glfw3.Window, key glfw3.Key, scancode int, action glfw3.Action, mods glfw3.ModifierKey) {
		// ESC to quit for now.
		if action == glfw3.Press && key == glfw3.KeyEscape {
			g.window.SetShouldClose(true)
			return
		}

		g.player.OnKey(key, action, mods)
	})
	return g
}

func (g *Game) MeshByName(meshName string) *gfx.Mesh {
	// TODO: Make meshes and other resources ref-counted.
	mesh, exists := g.meshes[meshName]
	if !exists {
		var err error
		mesh, err = gfx.LoadMesh(meshName)
		if err != nil {
			// Log an error and return nil, so we don't have to crash.
			log.Printf("error loading mesh %s : %s", meshName, err)
		} else {
			g.meshes[meshName] = mesh
		}
	}
	return mesh
}

func (g *Game) Sim() {
	g.player.Sim()
	g.world.Sim()
}

func (g *Game) Frame() {
	g.player.Draw()
}
