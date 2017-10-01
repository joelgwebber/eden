package eden

import (
	"log"
	"net/http"

	"golang.org/x/net/websocket"

	"eden/world"
)

type Server struct {
	world *world.World

	players     map[uint32]*Player
	curPlayerId uint32

	addPlayer    chan *Player
	removePlayer chan *Player
	shutdown     chan bool
	errors       chan error
}

func NewServer() *Server {
	s := &Server{
		world:        world.NewWorld(),
		players:      make(map[uint32]*Player),
		addPlayer:    make(chan *Player),
		removePlayer: make(chan *Player),
		shutdown:     make(chan bool),
		errors:       make(chan error),
	}
	return s
}

func (s *Server) AddPlayer(p *Player) {
	s.addPlayer <- p
}

func (s *Server) RemovePlayer(p *Player) {
	s.removePlayer <- p
}

func (s *Server) Shutdown() {
	s.shutdown <- true
}

func (s *Server) Error(err error) {
	s.errors <- err
}

func (s *Server) Listen() {
	onConnected := func(ws *websocket.Conn) {
		defer func() {
			err := ws.Close()
			if err != nil {
				s.errors <- err
			}
		}()

		player := NewPlayer(ws, s, s.curPlayerId)
		s.curPlayerId++
		s.AddPlayer(player)
		player.Listen()
	}
	http.Handle("/sock", websocket.Handler(onConnected))

	for {
		select {
		case c := <-s.addPlayer:
			log.Println("Added new player")
			s.players[c.id] = c
			log.Println("Now", len(s.players), "players connected.")

		case c := <-s.removePlayer:
			log.Println("Removed player")
			delete(s.players, c.id)

		case err := <-s.errors:
			log.Println("Error:", err.Error())

		case <-s.shutdown:
			s.world.Shutdown()
			return
		}
	}
}
