package server

type Actor interface {
	Think()
	Objet() Objet
}
