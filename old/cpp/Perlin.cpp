#include <stdlib.h>
#include <math.h>
#include "Perlin.h"

const int B = 256;

float fade(float t);
float lerp(float t, float a, float b);
float grad1(int hash, float x);
float grad2(int hash, float x, float y);
float grad3(int hash, float x, float y, float z);

Perlin::Perlin() {
  _perm = new int[B+B];

  int i = 0;
  for (; i < B; i++) {
    _perm[i] = i;
  }

  for (; i != 0; i--) {
    int k = _perm[i];
    int j = rand() * B / RAND_MAX;
    _perm[i] = _perm[j];
    _perm[j] = k;
  }

  for (i = 0; i < B; i++) {
    _perm[B+i] = _perm[i];
  }
}

float Perlin::FractalNoise1D(float x, int octNum, float frq, float amp) {
  float gain = 1.0f;
  float sum = 0.0f;

  for (int i = 0; i < octNum; i++) {
    sum += Noise1D(x*gain/frq) * amp / gain;
    gain *= 2.0;
  }
  return sum;
}

float Perlin::FractalNoise2D(float x, float y, int octNum, float frq, float amp) {
  float gain = 1.0f;
  float sum = 0.0f;

  for (int i = 0; i < octNum; i++) {
    sum += Noise2D(x*gain/frq, y*gain/frq) * amp / gain;
    gain *= 2.0;
  }
  return sum;
}

float Perlin::FractalNoise3D(float x, float y, float z, int octNum, float frq, float amp) {
  float gain = 1.0f;
  float sum = 0.0f;

  for (int i = 0; i < octNum; i++) {
    sum += Noise3D(x*gain/frq, y*gain/frq, z*gain/frq) * amp / gain;
    gain *= 2.0;
  }
  return sum;
}

float Perlin::Noise1D(float x) {
  int ix0 = floorf(x);
  float fx0 = x - ix0;
  float fx1 = fx0 - 1.0f;
  int ix1 = (ix0 + 1) & 0xff;
  ix0 = ix0 & 0xff;

  float s = fade(fx0);

  float n0 = grad1(_perm[ix0], fx0);
  float n1 = grad1(_perm[ix1], fx1);
  return 0.188 * lerp(s, n0, n1);
}

float Perlin::Noise2D(float x, float y) {
  int ix0 = floorf(x);
  int iy0 = floorf(y);
  float fx0 = x - ix0;
  float fy0 = y - iy0;
  float fx1 = fx0 - 1.0;
  float fy1 = fy0 - 1.0;
  int ix1 = (ix0 + 1) & 0xff;
  int iy1 = (iy0 + 1) & 0xff;
  ix0 = ix0 & 0xff;
  iy0 = iy0 & 0xff;

  float t = fade(fy0);
  float s = fade(fx0);

  float nx0 = grad2(_perm[ix0+_perm[iy0]], fx0, fy0);
  float nx1 = grad2(_perm[ix0+_perm[iy1]], fx0, fy1);

  float n0 = lerp(t, nx0, nx1);

  nx0 = grad2(_perm[ix1+_perm[iy0]], fx1, fy0);
  nx1 = grad2(_perm[ix1+_perm[iy1]], fx1, fy1);

  float n1 = lerp(t, nx0, nx1);

  return 0.507 * lerp(s, n0, n1);
}

float Perlin::Noise3D(float x, float y, float z) {
  int ix0 = floorf(x);
  int iy0 = floorf(y);
  int iz0 = floorf(z);
  float fx0 = x - ix0;
  float fy0 = y - iy0;
  float fz0 = z - iz0;
  float fx1 = fx0 - 1.0;
  float fy1 = fy0 - 1.0;
  float fz1 = fz0 - 1.0;
  int ix1 = (ix0 + 1) & 0xff;
  int iy1 = (iy0 + 1) & 0xff;
  int iz1 = (iz0 + 1) & 0xff;
  ix0 = ix0 & 0xff;
  iy0 = iy0 & 0xff;
  iz0 = iz0 & 0xff;

  float r = fade(fz0);
  float t = fade(fy0);
  float s = fade(fx0);

  float nxy0 = grad3(_perm[ix0+_perm[iy0+_perm[iz0]]], fx0, fy0, fz0);
  float nxy1 = grad3(_perm[ix0+_perm[iy0+_perm[iz1]]], fx0, fy0, fz1);
  float nx0 = lerp(r, nxy0, nxy1);

  nxy0 = grad3(_perm[ix0+_perm[iy1+_perm[iz0]]], fx0, fy1, fz0);
  nxy1 = grad3(_perm[ix0+_perm[iy1+_perm[iz1]]], fx0, fy1, fz1);
  float nx1 = lerp(r, nxy0, nxy1);

  float n0 = lerp(t, nx0, nx1);

  nxy0 = grad3(_perm[ix1+_perm[iy0+_perm[iz0]]], fx1, fy0, fz0);
  nxy1 = grad3(_perm[ix1+_perm[iy0+_perm[iz1]]], fx1, fy0, fz1);
  nx0 = lerp(r, nxy0, nxy1);

  nxy0 = grad3(_perm[ix1+_perm[iy1+_perm[iz0]]], fx1, fy1, fz0);
  nxy1 = grad3(_perm[ix1+_perm[iy1+_perm[iz1]]], fx1, fy1, fz1);
  nx1 = lerp(r, nxy0, nxy1);

  float n1 = lerp(t, nx0, nx1);

  return 0.936 * lerp(s, n0, n1);
}

float fade(float t) {
  return t * t * t * (t*(t*6.0-15.0) + 10.0);
}

float lerp(float t, float a, float b) {
  return a + t*(b-a);
}

float grad1(int hash, float x) {
  int h = hash % 16;
  float grad = 1.0f + (h%8);
  if ((h % 8) < 4) {
    grad = -grad;
  }
  return grad * x;
}

float grad2(int hash, float x, float y) {
  int h = hash % 16;

  float u = (h < 4) ? x : y;
  float v = (h < 4) ? y : x;

  if (h%2 != 0) {
    u = -u;
  }
  if ((h/2)%2 != 0) {
    v = -v;
  }
  return u + 2.0f*v;
}

float grad3(int hash, float x, float y, float z) {
  int h = hash % 16;

  float u = (h < 8) ? x : y;
  float v = (h < 4) ? y : ((h == 12 || h == 14) ? x : z);

  if (h%2 != 0) {
    u = -u;
  }
  if ((h/2)%2 != 0) {
    v = -v;
  }
  return u + 2.0*v;
}
