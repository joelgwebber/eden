package main

import (
	"eden/client"

	"eden/client/gfx"
	"fmt"
	"github.com/go-gl/gl"
)

func main() {
	// Make the window.
	wnd := gfx.NewWindow()
	defer wnd.Shutdown()

	// Initialize GL. Must be done after the window is created.
	initGL()

	// Run the game.
	g := client.NewGame(wnd)
	wnd.Run(func(elapsed float64) {
		g.Sim() // TODO: put this on another goroutine and make it fixed rate.
		g.Frame()
	})
}

func initGL() {
	if status := gl.Init(); status != gl.FALSE {
		panic("Unable to initialize GL")
	}

	// Echo GL version and extensions.
	version := gl.GetString(gl.VERSION)
	fmt.Println("OpenGL version", version)

	// Configure global settings
	gl.Enable(gl.CULL_FACE)
	gl.Enable(gl.DEPTH_TEST)
	gl.DepthFunc(gl.LESS)
	gl.ClearColor(0, 0, 0, 1.0)
}
