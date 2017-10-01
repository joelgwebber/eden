@0x8cd4d0a9119915f4;
using Go = import "go.capnp";

$Go.package("proto");
$Go.import("eden/client/gfx/proto");

struct MeshDef {
  materialFile @0 :Text;
  vertDefs     @1 :List(VertDef);
  verts        @2 :Data; # []float32
  indices      @3 :Data; # []uint16
}

struct VertDef {
  size   @0 :UInt32;
  offset @1 :UInt32;
  name   @2 :Text;
}
