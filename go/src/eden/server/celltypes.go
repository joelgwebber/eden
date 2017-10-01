package server

type (
	GroundType uint16
	LiquidType uint8
)

const (
	// Ground types stored in the low 16-bits.
	GroundTypeShift = uint32(0)
	GroundTypeMask  = uint32(0xffff)

	GroundFillShift = uint32(16)
	GroundFillMask  = uint32(0x1f)

	LiquidTypeShift = uint32(21)
	LiquidTypeMask  = uint32(0x3f)

	LiquidFillShift = uint32(27)
	LiquidFillMask  = uint32(0x1f)

	// Ground types.
	GroundDirt  = GroundType(0x0001)
	GroundGrass = GroundType(0x0002)
	// ...

	// Liquid types.
	LiquidWater = LiquidType(0x01)
	LiquidIce   = LiquidType(0x02)
	LiquidLava  = LiquidType(0x03)
	LiquidCloud = LiquidType(0x04)
	// ...
)

func groundType(cell uint32) GroundType {
	return GroundType(uint16((uint32(cell) >> GroundTypeShift) & GroundTypeMask))
}

func groundFill(cell uint32) GroundType {
	return GroundType(uint16((uint32(cell) >> GroundFillShift) & GroundFillMask))
}

func liquidType(cell uint32) LiquidType {
	return LiquidType(uint16((uint32(cell) >> LiquidTypeShift) & LiquidTypeMask))
}

func liquidFill(cell uint32) LiquidType {
	return LiquidType(uint16((uint32(cell) >> LiquidFillShift) & LiquidFillMask))
}

func groundCell(typ GroundType, density float32) uint32 {
	fill := uint8(density * float32(GroundFillMask))
	return (uint32(fill) << GroundFillShift) | uint32(typ)
}
