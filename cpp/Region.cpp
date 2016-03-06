#include <map>
#include <math.h>

#include <Urho3D/Urho3D.h>
#include <Urho3D/Container/Vector.h>
#include <Urho3D/Graphics/Material.h>
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
#include "Perlin.h"

#include "March.inc"

void MarchCube(Vector3 pos, float *cube, std::map<uint32_t, uint16_t> &vertIndex, PODVector<float> &verts, PODVector<uint16_t> &indices);
Vector3 normalForPoint(Vector3* normals, float* pos);

/* static */ void Region::RegisterObject(Context* context) {
  context->RegisterFactory<Region>("Eden");
}

Region::Region(Context* context):
  Drawable(context, DRAWABLE_GEOMETRY)
{
  geometry_ = new Geometry(context);
  vertexBuffer_ = new VertexBuffer(context);
  indexBuffer_ = new IndexBuffer(context);

  ResourceCache* cache = GetSubsystem<ResourceCache>();
  Material* mat = cache->GetResource<Material>("Materials/Green.xml");

  batches_.Resize(1);
  batches_[0].geometry_ = geometry_;
  batches_[0].geometryType_ = GEOM_STATIC;
  batches_[0].worldTransform_ = &Matrix3x4::IDENTITY;
  batches_[0].material_ = mat;

  boundingBox_.Define(-1.0f, RegionData::Size + 1.0f); // +/- 1 for skirt.
}

Region::~Region() {
}

void Region::Init(RegionData* data) {
  data_ = data;
}

void Region::ProcessRayQuery(const RayOctreeQuery& query, PODVector<RayQueryResult>& results) {
  Drawable::ProcessRayQuery(query, results);
}

UpdateGeometryType Region::GetUpdateGeometryType() {
  return data_->dirty_ ? UPDATE_MAIN_THREAD : UPDATE_NONE;
}

void Region::UpdateGeometry(const FrameInfo& frame) {
  Drawable::UpdateGeometry(frame);

  data_->PullFromNeighbors();
  UpdateTerrain();
  UpdatePhysics();
}

void Region::OnWorldBoundingBoxUpdate() {
  worldBoundingBox_ = boundingBox_.Transformed(node_->GetWorldTransform());
}

void Region::UpdatePhysics() {
  RigidBody* body = node_->GetOrCreateComponent<RigidBody>();
  body->SetFriction(1.0f);

  // TODO: Can we avoid creating a model here? Probably cheap, but seems silly.
  if (geometry_->GetVertexBuffer(0)->GetVertexCount() > 0) {
    CollisionShape* shape = node_->GetOrCreateComponent<CollisionShape>();
    Model* model = new Model(context_);
    model->SetNumGeometries(1);
    model->SetGeometry(0, 0, geometry_);
    shape->SetTriangleMesh(model);
  }
}

void Region::UpdateTerrain() {
  // Build mesh verts/indices.
  PODVector<float> verts;
  PODVector<uint16_t> indices;

  // TODO: Could probably do much better than a std::map
  std::map<uint32_t, uint16_t> vertIndex;

  float cube[8];
  for (int x = 0; x < RegionData::Size; x++) {
    for (int y = 0; y < RegionData::Size; y++) {
      for (int z = 0; z < RegionData::Size; z++) {
        FillCube(x, y, z, cube);
        MarchCube(Vector3(x - 1, y - 1, z - 1), cube, vertIndex, verts, indices);
      }
    }
  }

  if (verts.Size() > 0) {
    // Build normals.
    Vector3 normals[RegionData::Stride3];
    CalculateNormals(normals);
    for (int i = 0; i < verts.Size(); i += 6) {
      Vector3 n = normalForPoint(normals, &verts[i]);
      verts[i+3] = n.x_;
      verts[i+4] = n.y_;
      verts[i+5] = n.z_;
    }
  }

  // Build and update the model/geometry.
  float *vertexData = new float[verts.Size()];
  memcpy(vertexData, &verts.Front(), sizeof(float) * verts.Size());
  uint16_t *indexData = new uint16_t[indices.Size()];
  memcpy(indexData, &indices.Front(), sizeof(uint16_t) * indices.Size());

  // Shadowed buffers needed for physics.
  vertexBuffer_->SetShadowed(true);
  vertexBuffer_->SetSize(verts.Size() / 6, MASK_POSITION|MASK_NORMAL);
  vertexBuffer_->SetData(vertexData);

  indexBuffer_->SetShadowed(true);
  indexBuffer_->SetSize(indices.Size(), false);
  indexBuffer_->SetData(indexData);

  geometry_->SetVertexBuffer(0, vertexBuffer_);
  geometry_->SetIndexBuffer(indexBuffer_);
  geometry_->SetDrawRange(TRIANGLE_LIST, 0, indices.Size());
}

void Region::FillCube(int x, int y, int z, float *cube) {
  for (int i = 0; i < 8; i++) {
    int _x = x + intVertexOffset[i][0];
    int _y = y + intVertexOffset[i][1];
    int _z = z + intVertexOffset[i][2];
    Cell *c = data_->CellAt(_x, _y, _z);
    if (c->type == CellTerrain) {
      cube[i] = c->density;
    } else {
      cube[i] = 0;
    }
  }
}

void Region::CalculateNormals(Vector3* normals) {
  for (int y = -1; y < RegionData::Size+1; y++) {
    for (int z = -1; z < RegionData::Size+1; z++) {
      for (int x = -1; x < RegionData::Size+1; x++) {
        float dx = data_->CellAt(x+1, y, z)->density - data_->CellAt(x-1, y, z)->density;
        float dy = data_->CellAt(x, y+1, z)->density - data_->CellAt(x, y-1, z)->density;
        float dz = data_->CellAt(x, y, z+1)->density - data_->CellAt(x, y, z-1)->density;

        int idx = (x+2) + (y+2)*RegionData::Stride + (z+2)*RegionData::Stride2;
        normals[idx] = Vector3(dx, dy, dz);
        normals[idx].Normalize();
      }
    }
  }
}

float getOffset(float v1, float v2) {
  float delta = v2 - v1;
  if (delta == 0.0) {
    return 0.5;
  }
  return (0.5 - v1) / delta;
}

void MarchCube(Vector3 pos, float *cube, std::map<uint32_t, uint16_t> &vertIndex, PODVector<float> &verts, PODVector<uint16_t> &indices) {
  int flagIndex = 0;
  float offset = 0;
  Vector3 edgeVertex[12];

  // Find which vertices are inside of the surface and which are outside.
  for (int i = 0; i < 8; i++) {
    if (cube[i] <= 0.5f) {
      flagIndex |= 1 << i;
    }
  }

  // Find which edges are intersected by the surface.
  int edgeFlags = cubeEdgeFlags[flagIndex];

  // If the cube is entirely inside or outside of the surface, then there will be no intersections.
  if (edgeFlags == 0) {
    return;
  }

  // Find the point of intersection of the surface with each edge.
  for (int i = 0; i < 12; i++) {
    // If there is an intersection on this edge.
    if ((edgeFlags & (1 << i)) != 0) {
      offset = getOffset(cube[edgeConnection[i][0]], cube[edgeConnection[i][1]]);

      edgeVertex[i] = pos + Vector3(
        vertexOffset[edgeConnection[i][0]][0] + offset*edgeDirection[i][0],
        vertexOffset[edgeConnection[i][0]][1] + offset*edgeDirection[i][1],
        vertexOffset[edgeConnection[i][0]][2] + offset*edgeDirection[i][2]);
    }
  }

  // Save the triangles that were found. There can be up to five per cube.
  for (int i = 0; i < 5; i++) {
    if (triangleConnectionTable[flagIndex][3*i] < 0) {
      break;
    }

    // Get the three verts for this triangle and compute its normal.
    Vector3 triVerts[3];
    for (int j = 0; j < 3; j++) {
      triVerts[j] = edgeVertex[triangleConnectionTable[flagIndex][3*i+j]];
    }

    int idx = (uint16_t)(verts.Size() / 6);
    for (int j = 0; j < 3; j++) {
      // Build a key for the vertex, by flooring the x.y part and mushing them into a uint64.
      uint32_t _x = (uint32_t)((triVerts[j].x_+2.0f)*32.0f);
      uint32_t _y = (uint32_t)((triVerts[j].y_+2.0f)*32.0f);
      uint32_t _z = (uint32_t)((triVerts[j].z_+2.0f)*32.0f);
      uint32_t key = (_x << 20) | (_y << 10) | _z;

      if (vertIndex.count(key)) {
        // Already have a vertex at roughly this position.
        indices.Push(vertIndex[key]);
      } else {
        // New vertex.
        vertIndex[key] = idx;
        indices.Push(idx);
        verts.Push(triVerts[j].x_);
        verts.Push(triVerts[j].y_);
        verts.Push(triVerts[j].z_);
        verts.Push(0); // normal
        verts.Push(0);
        verts.Push(0);
        idx++;
      }
    }
  }
}

Vector3 normalForPoint(Vector3* normals, float* pos) {
  int x = (int)roundf(pos[0]);
  int y = (int)roundf(pos[1]);
  int z = (int)roundf(pos[2]);
  return normals[(x+3) + (y+3)*RegionData::Stride + (z+3)*RegionData::Stride2] * -1;
}
