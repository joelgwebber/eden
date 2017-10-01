package gfx

import (
	"fmt"
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"runtime"
)

const (
	WindowWidth  = 1024
	WindowHeight = 768
)

type Window struct {
	*glfw.Window
	previousTime float64
}

func init() {
	// GLFW event handling must run on the main OS thread
	runtime.LockOSThread()

	// Initialize GLFW for window management
	glfw.SetErrorCallback(onError)
	if !glfw.Init() {
		panic("failed to initialize glfw")
	}
}

func NewWindow() *Window {
	glfw.GetTime()
	glfw.WindowHint(glfw.Resizable, glfw.False)
	glfw.WindowHint(glfw.ContextVersionMajor, 3)
	glfw.WindowHint(glfw.ContextVersionMinor, 3)
	glfw.WindowHint(glfw.OpenglForwardCompatible, glfw.True)    // Necessary for OS X
	glfw.WindowHint(glfw.OpenglProfile, glfw.OpenglCoreProfile) // Necessary for OS X
	glfw.WindowHint(glfw.OpenglDebugContext, glfw.True)

	window, err := glfw.CreateWindow(WindowWidth, WindowHeight, "Eden", nil, nil)
	if err != nil {
		panic(err)
	}
	window.MakeContextCurrent()

	window.SetSizeCallback(onResize)

	return &Window{
		Window:       window,
		previousTime: glfw.GetTime(),
	}
}

func (wnd *Window) Run(renderFrame func(elapsed float64)) {
	for !wnd.ShouldClose() {
		gl.ClearColor(0.6, 0.6, 1.0, 1.0)
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		time := glfw.GetTime()
		elapsed := time - wnd.previousTime
		wnd.previousTime = time

		renderFrame(elapsed)

		wnd.SwapBuffers()
		glfw.PollEvents()
	}
}

func (wnd *Window) Shutdown() {
	glfw.Terminate()
}

func onError(err glfw.ErrorCode, desc string) {
	fmt.Printf("GLFW error %v: %v\n", err, desc)
}

func onResize(w *glfw.Window, width int, height int) {
}
