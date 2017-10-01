package proto

// AUTO GENERATED - DO NOT EDIT

import (
	C "github.com/glycerine/go-capnproto"
	"unsafe"
)

type MeshDef C.Struct

func NewMeshDef(s *C.Segment) MeshDef        { return MeshDef(s.NewStruct(0, 4)) }
func NewRootMeshDef(s *C.Segment) MeshDef    { return MeshDef(s.NewRootStruct(0, 4)) }
func AutoNewMeshDef(s *C.Segment) MeshDef    { return MeshDef(s.NewStructAR(0, 4)) }
func ReadRootMeshDef(s *C.Segment) MeshDef   { return MeshDef(s.Root(0).ToStruct()) }
func (s MeshDef) MaterialFile() string       { return C.Struct(s).GetObject(0).ToText() }
func (s MeshDef) SetMaterialFile(v string)   { C.Struct(s).SetObject(0, s.Segment.NewText(v)) }
func (s MeshDef) VertDefs() VertDef_List     { return VertDef_List(C.Struct(s).GetObject(1)) }
func (s MeshDef) SetVertDefs(v VertDef_List) { C.Struct(s).SetObject(1, C.Object(v)) }
func (s MeshDef) Verts() []byte              { return C.Struct(s).GetObject(2).ToData() }
func (s MeshDef) SetVerts(v []byte)          { C.Struct(s).SetObject(2, s.Segment.NewData(v)) }
func (s MeshDef) Indices() []byte            { return C.Struct(s).GetObject(3).ToData() }
func (s MeshDef) SetIndices(v []byte)        { C.Struct(s).SetObject(3, s.Segment.NewData(v)) }

// capn.JSON_enabled == false so we stub MarshallJSON().
func (s MeshDef) MarshalJSON() (bs []byte, err error) { return }

type MeshDef_List C.PointerList

func NewMeshDefList(s *C.Segment, sz int) MeshDef_List {
	return MeshDef_List(s.NewCompositeList(0, 4, sz))
}
func (s MeshDef_List) Len() int         { return C.PointerList(s).Len() }
func (s MeshDef_List) At(i int) MeshDef { return MeshDef(C.PointerList(s).At(i).ToStruct()) }
func (s MeshDef_List) ToArray() []MeshDef {
	return *(*[]MeshDef)(unsafe.Pointer(C.PointerList(s).ToArray()))
}
func (s MeshDef_List) Set(i int, item MeshDef) { C.PointerList(s).Set(i, C.Object(item)) }

type VertDef C.Struct

func NewVertDef(s *C.Segment) VertDef      { return VertDef(s.NewStruct(8, 1)) }
func NewRootVertDef(s *C.Segment) VertDef  { return VertDef(s.NewRootStruct(8, 1)) }
func AutoNewVertDef(s *C.Segment) VertDef  { return VertDef(s.NewStructAR(8, 1)) }
func ReadRootVertDef(s *C.Segment) VertDef { return VertDef(s.Root(0).ToStruct()) }
func (s VertDef) Size() uint32             { return C.Struct(s).Get32(0) }
func (s VertDef) SetSize(v uint32)         { C.Struct(s).Set32(0, v) }
func (s VertDef) Offset() uint32           { return C.Struct(s).Get32(4) }
func (s VertDef) SetOffset(v uint32)       { C.Struct(s).Set32(4, v) }
func (s VertDef) Name() string             { return C.Struct(s).GetObject(0).ToText() }
func (s VertDef) SetName(v string)         { C.Struct(s).SetObject(0, s.Segment.NewText(v)) }

// capn.JSON_enabled == false so we stub MarshallJSON().
func (s VertDef) MarshalJSON() (bs []byte, err error) { return }

type VertDef_List C.PointerList

func NewVertDefList(s *C.Segment, sz int) VertDef_List {
	return VertDef_List(s.NewCompositeList(8, 1, sz))
}
func (s VertDef_List) Len() int         { return C.PointerList(s).Len() }
func (s VertDef_List) At(i int) VertDef { return VertDef(C.PointerList(s).At(i).ToStruct()) }
func (s VertDef_List) ToArray() []VertDef {
	return *(*[]VertDef)(unsafe.Pointer(C.PointerList(s).ToArray()))
}
func (s VertDef_List) Set(i int, item VertDef) { C.PointerList(s).Set(i, C.Object(item)) }
