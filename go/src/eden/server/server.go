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

	addCh    chan *Player
	removeCh chan *Player
	doneCh   chan bool
	errCh    chan error
}

func NewServer() *Server {
	s := &Server{
		players:  make(map[int]*Player),
		addCh:    make(chan *Player),
		removeCh: make(chan *Player),
		doneCh:   make(chan bool),
		errCh:    make(chan error),
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

func (s *Server) Done() {
	s.doneCh <- true
}

func (s *Server) Err(err error) {
	s.errCh <- err
}

func (s *Server) Listen() {
	onConnected := func(ws *websocket.Conn) {
		defer func() {
			err := ws.Close()
			if err != nil {
				s.errCh <- err
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

		case err := <-s.errCh:
			log.Println("Error:", err.Error())

		case <-s.doneCh:
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
