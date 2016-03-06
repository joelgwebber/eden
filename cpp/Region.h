#pragma once

#include <Urho3D/Engine/Application.h>

namespace Urho3D {
  class Node;
  class Model;
  class Drawable;
  class CollisionShape;
  class VertexBuffer;
  class IndexBuffer;
}

class Perlin;
class World;
class RegionData;

using namespace Urho3D;

struct RenderBlock {
  Model *model;
  int xformIdx;
};

// Region component, used to render a region as a scene node.
class Region : public Drawable {
  OBJECT(Region);
  friend class World;

public:
  static void RegisterObject(Context* context);

  Region(Context* context);
  virtual ~Region();
  void Init(RegionData* data);

  void Randomize(Perlin &noise);

  void ProcessRayQuery(const RayOctreeQuery& query, PODVector<RayQueryResult>& results);
  UpdateGeometryType GetUpdateGeometryType();
  void UpdateGeometry(const FrameInfo& frame);

protected:
  void OnWorldBoundingBoxUpdate();

private:
  void UpdateTerrain();
  void UpdatePhysics();
  void FillCube(int x, int y, int z, float *cube);
  void CalculateNormals(Vector3* normals);

 	RegionData* data_;
  SharedPtr<Geometry> geometry_;
  SharedPtr<VertexBuffer> vertexBuffer_;
  SharedPtr<IndexBuffer> indexBuffer_;
};
