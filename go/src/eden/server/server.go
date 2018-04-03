package server

import (
	"log"
	"net/http"
	"time"

	"golang.org/x/net/websocket"
)

type Server struct {
	world World

	players     map[int]*Player
	curPlayerId int

	addCh      chan *Player
	removeCh   chan *Player
	shutdownCh chan bool
}

func NewServer() *Server {
	s := &Server{
		players:    make(map[int]*Player),
		addCh:      make(chan *Player),
		removeCh:   make(chan *Player),
		shutdownCh: make(chan bool),
	}
	s.world.Init()
	return s
}

func (s *Server) Add(p *Player) {
	s.addCh <- p
}

func (s *Server) Remove(p *Player) {
	s.removeCh <- p
}

func (s *Server) Shutdown() {
	s.shutdownCh <- true
}

func (s *Server) Listen() {
	onConnected := func(ws *websocket.Conn) {
		defer func() {
			err := ws.Close()
			if err != nil {
				log.Printf("error closing websocket: %s", err)
			}
		}()

		player := NewPlayer(ws, s, s.curPlayerId)
		s.curPlayerId++
		s.Add(player)
		player.Listen()
	}
	http.Handle("/sock", websocket.Handler(onConnected))

	ticker := time.NewTicker(250 * time.Millisecond)
	for {
		select {
		case <-ticker.C:
			s.Tick()

		case c := <-s.addCh:
			log.Println("Added new player")
			s.players[c.id] = c
			log.Println("Now", len(s.players), "players connected.")

		case c := <-s.removeCh:
			log.Println("Removed player")
			delete(s.players, c.id)

		case <-s.shutdownCh:
			return
		}
	}
}

func (s *Server) Tick() {
	s.world.Tick()
	for _, p := range s.players {
		p.Tick()
	}
}
