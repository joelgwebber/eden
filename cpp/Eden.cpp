#include <Urho3D/Urho3D.h>

#include <Urho3D/Engine/Engine.h>
#include <Urho3D/Engine/Application.h>
#include <Urho3D/Graphics/Graphics.h>
#include <Urho3D/Graphics/Camera.h>
#include <Urho3D/Graphics/Renderer.h>
#include <Urho3D/Graphics/Texture2D.h>
#include <Urho3D/Graphics/CustomGeometry.h>
#include <Urho3D/IO/FileSystem.h>
#include <Urho3D/IO/Log.h>
#include <Urho3D/Core/Main.h>
#include <Urho3D/Core/ProcessUtils.h>
#include <Urho3D/Resource/ResourceCache.h>
#include <Urho3D/Resource/ResourceEvents.h>
#include <Urho3D/LuaScript/LuaScript.h>
#include <Urho3D/DebugNew.h>

#include "Eden.h"
#include "World.h"
#include "Region.h"
#include "Cube.h"

extern int tolua_Eden_open(lua_State*);

DEFINE_APPLICATION_MAIN(Eden);

Eden::Eden(Context* context):
    Application(context)
{
  World::RegisterObject(context);
  Region::RegisterObject(context);
  Cube::RegisterObject(context);
}

void Eden::Setup() {
  engineParameters_ = Engine::ParseParameters(GetArguments());
  engineParameters_["LogName"] = "Eden.log";
  engineParameters_["FullScreen"] = false; // Force windowed for now.
}

void Eden::Start() {
  InitScripts();

  if (!luaScript_->ExecuteFile("Scripts/Eden.lua")) {
    ErrorExit();
    return;
  }

  luaScript_->ExecuteFunction("Start");
}

void Eden::Stop() {
  LuaScript* luaScript = GetSubsystem<LuaScript>();
  if (luaScript && luaScript->GetFunction("Stop", true)) {
    luaScript->ExecuteFunction("Stop");
  }
}

void Eden::InitScripts() {
  luaScript_ = new LuaScript(context_);
  context_->RegisterSubsystem(luaScript_);

  tolua_Eden_open(luaScript_->GetState());
}
