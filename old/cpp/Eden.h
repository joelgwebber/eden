#pragma once

#include <Urho3D/Engine/Application.h>

using namespace Urho3D;

class Eden : public Application
{
  OBJECT(Eden);

public:
  Eden(Context* context);

  virtual void Setup();
  virtual void Start();
  virtual void Stop();

private:
  void InitScripts();

  SharedPtr<LuaScript> luaScript_;
};
