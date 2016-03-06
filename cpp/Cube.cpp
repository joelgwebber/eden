#include <algorithm>

#include <Urho3D/Urho3D.h>
#include <Urho3D/Engine/Application.h>
#include <Urho3D/Container/Vector.h>
#include <Urho3D/Graphics/Camera.h>
#include <Urho3D/Graphics/Material.h>
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

#include "Cube.h"

void Cube::RegisterObject(Context* context) {
  context->RegisterFactory<Cube>("Eden");
  COPY_BASE_ATTRIBUTES(Drawable);
}

Cube::Cube(Context* context): Drawable(context, DRAWABLE_GEOMETRY) {
  boundingBox_.Define(0.0f, 1.0f);

  geometry_ = new Geometry(context);
  vertexBuffer_ = new VertexBuffer(context);
  indexBuffer_ = new IndexBuffer(context);

  batches_.Resize(1);
  batches_[0].geometry_ = geometry_;
  batches_[0].geometryType_ = GEOM_STATIC;
  batches_[0].worldTransform_ = &Matrix3x4::IDENTITY;
  
  UpdateAll();
}

Cube::~Cube() {
}

void Cube::Update(const FrameInfo &frame) {
  Drawable::Update(frame);
}

void Cube::UpdateGeometry(const FrameInfo& frame) {
  Drawable::UpdateGeometry(frame);
  UpdateAll();
}

void Cube::ProcessRayQuery(const RayOctreeQuery& query, PODVector<RayQueryResult>& results) {
  Drawable::ProcessRayQuery(query, results);
}

void Cube::OnWorldBoundingBoxUpdate() {
  worldBoundingBox_ = boundingBox_.Transformed(node_->GetWorldTransform());
}

void Cube::UpdateAll() {
  float vertexData[24*6] = {
    0, 0, 0, -1, 0, 0, 0, 0, 1, -1, 0, 0, 0, 1, 1, -1, 0, 0, 0, 1, 0, -1, 0, 0,
    1, 0, 0,  1, 0, 0, 1, 1, 0,  1, 0, 0, 1, 1, 1,  1, 0, 0, 1, 0, 1,  1, 0, 0,
    0, 0, 0, 0, -1, 0, 1, 0, 0, 0, -1, 0, 1, 0, 1, 0, -1, 0, 0, 0, 1, 0, -1, 0,
    0, 1, 0, 0,  1, 0, 0, 1, 1, 0,  1, 0, 1, 1, 1, 0,  1, 0, 1, 1, 0, 0,  1, 0,
    0, 0, 0, 0, 0, -1, 0, 1, 0, 0, 0, -1, 1, 1, 0, 0, 0, -1, 1, 0, 0, 0, 0, -1,
    0, 0, 1, 0, 0,  1, 1, 0, 1, 0, 0,  1, 1, 1, 1, 0, 0,  1, 0, 1, 1, 0, 0,  1,
  };
  uint16_t indexData[36] = {
    0+0, 0+1, 0+2, 0+2, 0+3, 0+0,
    4+0, 4+1, 4+2, 4+2, 4+3, 4+0,
    8+0, 8+1, 8+2, 8+2, 8+3, 8+0,
    12+0, 12+1, 12+2, 12+2, 12+3, 12+0,
    16+0, 16+1, 16+2, 16+2, 16+3, 16+0,
    20+0, 20+1, 20+2, 20+2, 20+3, 20+0,
  };

  vertexBuffer_->SetShadowed(true);
  vertexBuffer_->SetSize(24, MASK_POSITION | MASK_NORMAL);
  vertexBuffer_->SetData(vertexData);

  indexBuffer_->SetShadowed(true);
  indexBuffer_->SetSize(36, false);
  indexBuffer_->SetData(indexData);

  geometry_->SetVertexBuffer(0, vertexBuffer_);
  geometry_->SetIndexBuffer(indexBuffer_);
  geometry_->SetDrawRange(TRIANGLE_LIST, 0, 36);
}
