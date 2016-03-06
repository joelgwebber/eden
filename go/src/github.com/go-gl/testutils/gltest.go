// Copyright 2012 The go-gl Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package gltest

import (
	"log"
	"runtime"
	"sync"
	"time"

	"github.com/go-gl/gl"
	"github.com/go-gl/glfw"
)

var main_thread_setup = make(chan func())
var main_thread_after = make(chan func())
var main_thread_work_done = make(chan bool)

var initialize_opengl sync.Once

// Runs `setup` on the main thread, performs glfw.SwapBuffers, then calls `after`
func OnTheMainThread(setup, after func()) {
	initialize_opengl.Do(StartOpenGL)
	main_thread_setup <- setup
	main_thread_after <- after
	<-main_thread_work_done
}

func StartOpenGL() {
	go func() {
		runtime.LockOSThread()

		if err := glfw.Init(); err != nil {
			log.Panic("glfw Error:", err)
		}

		w, h := 100, 100
		err := glfw.OpenWindow(w, h, 0, 0, 0, 0, 0, 0, glfw.Windowed)
		if err != nil {
			log.Panic("Error:", err)
		}

		if gl.Init() != 0 {
			log.Panic("gl error")
		}

		glfw.SetWindowSizeCallback(Reshape)
		glfw.SwapBuffers()

		for {
			(<-main_thread_setup)()
			glfw.SwapBuffers()
			(<-main_thread_after)()
			main_thread_work_done <- true
		}
	}()
}

// This should be used to resize the window during tests, to ensure that it is
// correctly resized before execution continues.
// Causes buffers to swap.
func SetWindowSize(width, height int) {
	glfw.SetWindowSize(width, height)
	// Need to wait for the reshape event, otherwise it happens at an arbitrary
	// point in the future (some unknown number of SwapBuffers())
	//glfw.PollEvents() // Doesn't work
	//glfw.WaitEvents() // might be racy (ideally, we'd need to send an event)
	time.Sleep(10 * time.Millisecond)
	glfw.SwapBuffers()
}

func Reshape(width, height int) {
	gl.Viewport(0, 0, width, height)

	gl.MatrixMode(gl.PROJECTION)
	gl.LoadIdentity()
	gl.Ortho(-1, 1, -1, 1, -1, 1)
	//gl.Ortho(-2.1, 6.1, -2.25*2, 2.1*2, -1, 1) // Y debug

	gl.MatrixMode(gl.MODELVIEW)
	gl.LoadIdentity()

	gl.ClearColor(0, 0, 0, 1)
	gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
}
