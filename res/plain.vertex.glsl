#version 330

uniform mat4 camera;
uniform mat4 model;

in vec3 vert;
in vec2 texCoord;
in vec3 normal;

out vec2 fragTexCoord;
out vec3 fragNormal;

void main() {
  mat4 xform = camera * model;
  gl_Position = xform * vec4(vert, 1);
  fragNormal = mat3(xform) * normal;
  fragTexCoord = texCoord;
}