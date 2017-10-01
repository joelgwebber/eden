package server

const (
	ObjetTypePlayer ObjetType = 1
)

type Container interface {
  RemoveObjet(id uint32)
}

// TODO: This is shite. Find a better way to allocate global ids.
var curObjetId = uint64(0)

func NewObjet(typ ObjetType) Objet {
	return Objet{
		Id:    newId(),
		Type:  typ,
	}
}

func newId() uint64 {
	curObjetId++
	return curObjetId
}
