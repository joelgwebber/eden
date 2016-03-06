#include <math.h>

#include <Urho3D/Urho3D.h>
#include <Urho3D/Graphics/Camera.h>
#include <Urho3D/Core/CoreEvents.h>
#include <Urho3D/Engine/Engine.h>
#include <Urho3D/UI/Font.h>
#include <Urho3D/Graphics/Geometry.h>
#include <Urho3D/Graphics/Graphics.h>
#include <Urho3D/Graphics/IndexBuffer.h>
#include <Urho3D/Input/Input.h>
#include <Urho3D/Graphics/Light.h>
#include <Urho3D/IO/Log.h>
#include <Urho3D/Graphics/Model.h>
#include <Urho3D/Graphics/Octree.h>
#include <Urho3D/Core/Profiler.h>
#include <Urho3D/Graphics/Renderer.h>
#include <Urho3D/Resource/ResourceCache.h>
#include <Urho3D/Scene/Scene.h>
#include <Urho3D/Graphics/StaticModel.h>
#include <Urho3D/UI/Text.h>
#include <Urho3D/Graphics/VertexBuffer.h>
#include <Urho3D/UI/UI.h>
#include <Urho3D/Graphics/Zone.h>
#include <Urho3D/Physics/CollisionShape.h>
#include <Urho3D/Physics/RigidBody.h>

#include "World.h"
#include "Region.h"
#include "Cube.h"
#include "Perlin.h"

// Neighbor bitfield
enum Neighbor {
  Neighbor000 = 0x00000001,
  Neighbor100 = 0x00000002,
  Neighbor200 = 0x00000004,
  Neighbor010 = 0x00000008,
  Neighbor110 = 0x00000010,
  Neighbor210 = 0x00000020,
  Neighbor020 = 0x00000040,
  Neighbor120 = 0x00000080,
  Neighbor220 = 0x00000100,
  Neighbor001 = 0x00000200,
  Neighbor101 = 0x00000400,
  Neighbor201 = 0x00000800,
  Neighbor011 = 0x00001000,
  Neighbor111 = 0x00002000,
  Neighbor211 = 0x00004000,
  Neighbor021 = 0x00008000,
  Neighbor121 = 0x00010000,
  Neighbor221 = 0x00020000,
  Neighbor002 = 0x00040000,
  Neighbor102 = 0x00080000,
  Neighbor202 = 0x00100000,
  Neighbor012 = 0x00200000,
  Neighbor112 = 0x00400000,
  Neighbor212 = 0x00800000,
  Neighbor022 = 0x01000000,
  Neighbor122 = 0x02000000,
  Neighbor222 = 0x04000000
};

/* static */ void World::RegisterObject(Context* context) {
  context->RegisterFactory<World>("Eden");
}

World::World(Context* context):
    LogicComponent(context)
{
}

World::~World() {
}

void World::Update(float timeStep) {
}

void World::SetPlayerPos(Vector3 pos) {
  // Ensure regions around the player.
  int x_ = roundf(pos.x_ / RegionData::Size);
  int y_ = roundf(pos.y_ / RegionData::Size);
  int z_ = roundf(pos.z_ / RegionData::Size);
  for (int x = x_-1; x <= x_+1; x++) {
    for (int y = y_-1; y <= y_+1; y++) {
      for (int z = z_-1; z <= z_+1; z++) {
        RegionAt(x, y, z)->GetRegion();
      }
    }
  }
}

RegionData* World::RegionAt(int x, int y, int z) {
  Location loc = Location(x, y, z);
  if (regions_.count(loc)) {
    return regions_[loc];
  }

  RegionData* rd = new RegionData(this, x, y, z);
  regions_[loc] = rd;
  return rd;
}

RegionData::RegionData(World* world, int x, int y, int z):
  x_(x), y_(y), z_(z),
  dirty_(0xffffffff),
  world_(world)
{
    Randomize();
}

void RegionData::Randomize() {
  for (int x = 0; x < Size; x++) {
    for (int z = 0; z < Size; z++) {
      float ht = world_->noise.FractalNoise2D(x_ * Size + x, z_ * Size + z, 1, 10, 4) + 3;
      for (int y = y_ * Size; y < int(ht)+1 && y < y_*Size+Size; y++) {
        if (ht-y > 0) {
          SetType(x, y-(y_*Size), z, CellTerrain, std::min(1.0f, ht-y));
        }
      }
    }
  }
}

Region* RegionData::GetRegion() {
  if (!node_) {
    node_ = world_->node_->CreateChild();
    region_ = node_->CreateComponent<Region>();
    region_->Init(this);
    node_->Translate(Vector3(x_ * Size, y_ * Size, z_ * Size));
  }
  return region_;
}

void RegionData::PullFromChunk(uint32_t bit, int rofsx, int rofsy, int rofsz, int rx, int ry, int rz, int r1x, int r1y, int r1z, int sx, int sy, int sz) {
	if ((dirty_ & bit) != 0) {
    RegionData* r1 = world_->RegionAt(x_+rofsx, y_+rofsy, z_+rofsz);
    for (int x = 0; x < sx; x++) {
      for (int y = 0; y < sy; y++) {
        for (int z = 0; z < sz; z++) {
          SetCell(rx+x, ry+y, rz+z, r1->CellAt(r1x+x, r1y+y, r1z+z));
        }
      }
    }
  }
}

void RegionData::PullFromNeighbors() {
  // Eight corners.
  PullFromChunk(Neighbor000, -1, -1, -1,   -2,   -2,   -2, Size-2, Size-2, Size-2, 2, 2, 2);
  PullFromChunk(Neighbor200,  1, -1, -1, Size,   -2,   -2,      0, Size-2, Size-2, 2, 2, 2);
  PullFromChunk(Neighbor020, -1,  1, -1,   -2, Size,   -2, Size-2,      0, Size-2, 2, 2, 2);
  PullFromChunk(Neighbor220,  1,  1, -1, Size, Size,   -2,      0,      0, Size-2, 2, 2, 2);
  PullFromChunk(Neighbor002, -1, -1,  1,   -2,   -2, Size, Size-2, Size-2,      0, 2, 2, 2);
  PullFromChunk(Neighbor202,  1, -1,  1, Size,   -2, Size,      0, Size-2,      0, 2, 2, 2);
  PullFromChunk(Neighbor022, -1,  1,  1,   -2, Size, Size, Size-2,      0,      0, 2, 2, 2);
  PullFromChunk(Neighbor222,  1,  1,  1, Size, Size, Size,      0,      0,      0, 2, 2, 2);

  // Four x-dominant edges.
  PullFromChunk(Neighbor100, 0, -1, -1, 0,   -2,   -2, 0, Size-2, Size-2, Size, 2, 2);
  PullFromChunk(Neighbor120, 0,  1, -1, 0, Size,   -2, 0,      0, Size-2, Size, 2, 2);
  PullFromChunk(Neighbor102, 0, -1,  1, 0,   -2, Size, 0, Size-2,      0, Size, 2, 2);
  PullFromChunk(Neighbor122, 0,  1,  1, 0, Size, Size, 0,      0,      0, Size, 2, 2);

  // Four y-dominant edges.
  PullFromChunk(Neighbor010, -1, 0, -1,   -2, 0,   -2, Size-2, 0, Size-2, 2, Size, 2);
  PullFromChunk(Neighbor210,  1, 0, -1, Size, 0,   -2,      0, 0, Size-2, 2, Size, 2);
  PullFromChunk(Neighbor012, -1, 0,  1,   -2, 0, Size, Size-2, 0,      0, 2, Size, 2);
  PullFromChunk(Neighbor212,  1, 0,  1, Size, 0, Size,      0, 0,      0, 2, Size, 2);

  // Four z-dominant edges.
  PullFromChunk(Neighbor001, -1, -1, 0,   -2,   -2, 0, Size-2, Size-2, 0, 2, 2, Size);
  PullFromChunk(Neighbor201,  1, -1, 0, Size,   -2, 0,      0, Size-2, 0, 2, 2, Size);
  PullFromChunk(Neighbor021, -1,  1, 0,   -2, Size, 0, Size-2,      0, 0, 2, 2, Size);
  PullFromChunk(Neighbor221,  1,  1, 0, Size, Size, 0,      0,      0, 0, 2, 2, Size);

  // Two yz faces.
  PullFromChunk(Neighbor011, -1, 0, 0,   -2, 0, 0, Size-2, 0, 0, 2, Size, Size);
  PullFromChunk(Neighbor211,  1, 0, 0, Size, 0, 0,      0, 0, 0, 2, Size, Size);

  // Two xz faces.
  PullFromChunk(Neighbor101, 0, -1, 0, 0,   -2, 0, 0, Size-2, 0, Size, 2, Size);
  PullFromChunk(Neighbor121, 0,  1, 0, 0, Size, 0, 0,      0, 0, Size, 2, Size);

  // Two xy faces.
  PullFromChunk(Neighbor110, 0, 0, -1, 0, 0,   -2, 0, 0, Size-2, Size, Size, 2);
  PullFromChunk(Neighbor112, 0, 0,  1, 0, 0, Size, 0, 0,      0, Size, Size, 2);

  dirty_ = 0;
}
