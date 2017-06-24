#version 330

uniform sampler2D tex;

in vec2 fragTexCoord;
in vec3 fragNormal;

out vec4 outputColor;

float ambient = 0.5;

void main() {
  float light = clamp(dot(fragNormal, vec3(0.577, 0.577, 0.577)), 0, 1);
  outputColor = texture(tex, fragTexCoord) * (light + ambient);
}