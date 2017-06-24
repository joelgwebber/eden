package yolo

import (
	"reflect"
	"unsafe"
	"bytes"
	"encoding/binary"
)

var uint16SliceType reflect.Type
var uint32SliceType reflect.Type
var float32SliceType reflect.Type

func init() {
	uint16SliceType = reflect.TypeOf(make([]uint16, 0))
	uint32SliceType = reflect.TypeOf(make([]uint32, 0))
	float32SliceType = reflect.TypeOf(make([]float32, 0))
}

// TODO: safety comments.
func SliceFloat32(b []byte) []float32 {
	count := len(b) / 4
	slice := reflect.SliceHeader{uintptr(unsafe.Pointer(&b[0])), count, count}
	return reflect.NewAt(float32SliceType, unsafe.Pointer(&slice)).Elem().Interface().([]float32)
}

func SliceUint32(b []byte) []uint32 {
	count := len(b) / 4
	slice := reflect.SliceHeader{uintptr(unsafe.Pointer(&b[0])), count, count}
	return reflect.NewAt(uint32SliceType, unsafe.Pointer(&slice)).Elem().Interface().([]uint32)
}

func SliceUint16(b []byte) []uint16 {
	count := len(b) / 2
	slice := reflect.SliceHeader{uintptr(unsafe.Pointer(&b[0])), count, count}
	return reflect.NewAt(uint16SliceType, unsafe.Pointer(&slice)).Elem().Interface().([]uint16)
}

func SliceFloat32Len(b []byte) int {
	return len(b) / 4
}

func SliceUint32Len(b []byte) int {
	return len(b) / 4
}

func SliceUint16Len(b []byte) int {
	return len(b) / 2
}

// TODO: doc slowness.
func SliceFloat32Bytes(v []float32) []byte {
	buf := &bytes.Buffer{}
	binary.Write(buf, binary.LittleEndian, v)
	return buf.Bytes()
}

func SliceUint32Bytes(v []uint32) []byte {
	buf := &bytes.Buffer{}
	binary.Write(buf, binary.LittleEndian, v)
	return buf.Bytes()
}

func SliceUint16Bytes(v []uint16) []byte {
	buf := &bytes.Buffer{}
	binary.Write(buf, binary.LittleEndian, v)
	return buf.Bytes()
}
