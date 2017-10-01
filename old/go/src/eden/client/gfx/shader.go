package gfx

import (
	"fmt"
	"github.com/go-gl/gl"
)

type ShaderProgram struct {
	vertShader gl.Shader
	fragShader gl.Shader
	program    gl.Program
}

func NewShaderProgram(vertexShader, fragmentShader string) *ShaderProgram {
	prog := &ShaderProgram{}

	prog.vertShader = gl.CreateShader(gl.VERTEX_SHADER)
	prog.vertShader.Source(vertexShader)
	prog.vertShader.Compile()

	prog.fragShader = gl.CreateShader(gl.FRAGMENT_SHADER)
	prog.fragShader.Source(fragmentShader)
	prog.fragShader.Compile()

	prog.program = gl.CreateProgram()
	prog.program.AttachShader(prog.vertShader)
	prog.program.AttachShader(prog.fragShader)

	prog.program.BindFragDataLocation(0, "outputColor")
	prog.program.Link()

	fmt.Printf(prog.vertShader.GetInfoLog())
	fmt.Printf(prog.fragShader.GetInfoLog())
	fmt.Printf(prog.program.GetInfoLog())
	return prog
}

func (prog *ShaderProgram) Dispose() {
	prog.program.Delete()
}

func (prog *ShaderProgram) Use() {
	prog.program.Use()
}

func (prog *ShaderProgram) SetSamplerIndex(name string, idx int) {
	prog.program.GetUniformLocation(name).Uniform1i(idx)
}

func (prog *ShaderProgram) GetUniformLocation(name string) gl.UniformLocation {
	return prog.program.GetUniformLocation(name)
}

func (prog *ShaderProgram) GetAttribLocation(name string) gl.AttribLocation {
	return prog.program.GetAttribLocation(name)
}
