package gfx

import (
	"bytes"
	"eden/client/res"
	"encoding/json"
	"github.com/go-gl/gl"
	"github.com/go-gl/mathgl/mgl32"
)

type Material struct {
	def      MaterialDef
	Shader   *ShaderProgram
	Textures []*Texture
}

type SamplerDef struct {
	Name        string
	TextureFile string
}

type MaterialDef struct {
	VertexShader    string // @filename or shader source
	FragmentShader  string // @filename or shader source
	ModelTransform  string
	CameraTransform string
	Samplers        []SamplerDef
}

func LoadMaterial(filename string) (*Material, error) {
	buf, err := res.Load(filename)
	if err != nil {
		return nil, err
	}

	var def MaterialDef
	if err = json.NewDecoder(bytes.NewReader(buf)).Decode(&def); err != nil {
		return nil, err
	}

	return NewMaterial(def)
}

func NewMaterial(def MaterialDef) (*Material, error) {
	vertShader, err := shaderSource(def.VertexShader)
	if err != nil {
		return nil, err
	}
	fragShader, err := shaderSource(def.FragmentShader)
	if err != nil {
		return nil, err
	}

	mat := &Material{
		def:    def,
		Shader: NewShaderProgram(vertShader, fragShader),
	}

	mat.Textures = make([]*Texture, len(def.Samplers))
	for i, sampler := range def.Samplers {
		tex, err := NewTexture(sampler.TextureFile)
		if err != nil {
			return nil, err
		}
		mat.Textures[i] = tex
		mat.Shader.SetSamplerIndex(sampler.Name, i)
	}

	return mat, nil
}

func (mat *Material) Use() {
	mat.Shader.Use()
	for i, tex := range mat.Textures {
		tex.Bind(gl.GLenum(int(gl.TEXTURE0) + i))
	}
}

func (m *Material) SetCameraTransform(xform mgl32.Mat4) {
	m.Shader.GetUniformLocation(m.def.CameraTransform).UniformMatrix4fv(false, xform)
}

func (m *Material) SetModelTransform(xform mgl32.Mat4) {
	m.Shader.GetUniformLocation(m.def.ModelTransform).UniformMatrix4fv(false, xform)
}

func shaderSource(def string) (string, error) {
	if def[0] == '@' {
		buf, err := res.Load(def[1:])
		if err != nil {
			return "", err
		}
		return string(buf), nil
	}

	return def, nil
}
