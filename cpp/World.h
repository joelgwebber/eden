#pragma once

#include <map>
#include <Urho3D/Engine/Application.h>
#include <Urho3D/Scene/LogicComponent.h>
#include "Perlin.h"

namespace Urho3D {
  class Node;
  class Scene;
}

class Region;
class RegionData;

using namespace Urho3D;

struct Location {
  int x; int y; int z;
  Location(int _x, int _y, int _z): x(_x), y(_y), z(_z) {}
};

struct LocationCmp : std::binary_function<Location, Location, bool> {
  // TODO: better than this. Maybe expand to 64 bits and give 21 bits per axis.
  bool operator()(const Location& l, const Location& r) const {
    return l.x + (l.y << 10) + (l.z << 20) <
           r.x + (r.y << 10) + (r.z << 20);
  }
};

class World : public LogicComponent {
  OBJECT(World);
  friend class Region;
  friend class RegionData;

public:
  World(Context* context);
  virtual ~World();
  static void RegisterObject(Context* context);

  void SetPlayerPos(Vector3 pos);
  virtual void Update(float timeStep);

  RegionData* RegionAt(int x, int y, int z);

private:
  Perlin noise;
  std::map<Location, RegionData*, LocationCmp> regions_;
};

// Region data.
enum CellType {
  CellEmpty, CellTerrain, CellWall, CellWindow
};

struct Cell {
  CellType type;
  float density;
};

class RegionData {
public:
  static const int Size    = 16;
  static const int Stride  = Size + 4;
  static const int Stride2 = Stride * Stride;
  static const int Stride3 = Stride2 * Stride;

  RegionData(World* world, int x, int y, int z);

  void Randomize();
  Region* GetRegion();

  void SetCell(int x, int y, int z, Cell* c) {
    // TODO: set neighbor dirty bits.
    *CellAt(x, y, z) = *c;
  }

  void SetType(int x, int y, int z, CellType t, float d) {
    // TODO: set neighbor dirty bits.
    Cell *c = CellAt(x, y, z);
    c->type = t;
    c->density = d;
  }

  Cell* CellAt(int x, int y, int z) {
    x += 2; y += 2; z += 2;
    return &cells_[z*Stride2 + y*Stride + x];
  }

  void PullFromChunk(uint32_t bit, int rofsx, int rofsy, int rofsz, int rx, int ry, int rz, int r1x, int r1y, int r1z, int sx, int sy, int sz);
  void PullFromNeighbors();

 	int x_, y_, z_;
  uint32_t dirty_;
  Cell cells_[Stride3];
  SharedPtr<Node> node_;
  SharedPtr<Region> region_;
  World* world_;
};
