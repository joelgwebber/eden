#pragma once

class Perlin {
public:
  Perlin();

  float FractalNoise1D(float x, int octNum, float frq, float amp);
  float FractalNoise2D(float x, float y, int octNum, float frq, float amp);
  float FractalNoise3D(float x, float y, float z, int octNum, float frq, float amp);

private:
  float Noise1D(float x);
  float Noise2D(float x, float y);
  float Noise3D(float x, float y, float z);

  int* _perm;
};
