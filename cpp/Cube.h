#pragma once

namespace Urho3D {
  class Node;
  class Model;
  class Drawable;
  class Camera;
  class VertexBuffer;
  class IndexBuffer;
}

using namespace Urho3D;

class Cube : public Drawable {
  OBJECT(Cube);

public:
  Cube(Context* context);
  virtual ~Cube();
  static void RegisterObject(Context* context);

  void UpdateAll();

  virtual void Update(const FrameInfo &frame);
  virtual void UpdateGeometry(const FrameInfo& frame);
  virtual void ProcessRayQuery(const RayOctreeQuery& query, PODVector<RayQueryResult>& results);

protected:
  void OnWorldBoundingBoxUpdate();

private:
  SharedPtr<Geometry> geometry_;
  SharedPtr<VertexBuffer> vertexBuffer_;
  SharedPtr<IndexBuffer> indexBuffer_;
};
