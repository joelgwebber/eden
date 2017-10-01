package server

import (
	"fmt"
	"io"

	"golang.org/x/net/websocket"
	"log"
)

const (
	channelBufSize = 256
)

type Player struct {
	id     int
	conn   *websocket.Conn
	server *Server
	ch     chan *Message
	doneCh chan bool

	name  string
	obj   Objet
	chunk *Chunk

	focus map[*Chunk]int // Chunk -> client version
}

func NewPlayer(conn *websocket.Conn, server *Server, id int) *Player {
	return &Player{
		id:     id,
		conn:   conn,
		server: server,
		ch:     make(chan *Message, channelBufSize),
		doneCh: make(chan bool),
		focus:  make(map[*Chunk]int),
	}
}

func (p *Player) Conn() *websocket.Conn {
	return p.conn
}

func (p *Player) Send(msg *Message) {
	select {
	case p.ch <- msg:
	default:
		p.server.Remove(p)
		err := fmt.Errorf("player %d is disconnected.", p.id)
		p.server.Err(err)
	}
}

func (p *Player) Done() {
	p.doneCh <- true
}

// TODO: Ugh, do we really need two goroutines to handle each player?
func (p *Player) Listen() {
	go p.listenSend()
	p.listenRead()
}

func (p *Player) listenSend() {
	for {
		select {
		case msg := <-p.ch:
			websocket.JSON.Send(p.conn, msg)

		case <-p.doneCh:
			p.server.Remove(p)
			p.Done()
			return
		}
	}
}

func (p *Player) listenRead() {
	for {
		select {
		case <-p.doneCh:
			p.server.Remove(p)
			p.Done()
			return

		default:
			var msg Message
			err := websocket.JSON.Receive(p.conn, &msg)
			if err == io.EOF {
				p.Done()
			} else if err != nil {
				p.server.Err(err)
			} else {
				p.recvMessage(&msg)
			}
		}
	}
}

func (p *Player) recvMessage(msg *Message) {
	switch msg.Type {
	case MessageTypeConnect:
		p.handleConnect(msg.Connect)
	case MessageTypePlayerCmd:
		p.handleCmd(msg.PlayerCmd.Cmd, msg.PlayerCmd.Args)
	}
}

func (p *Player) handleCmd(cmd string, args []int32) {
	switch cmd {
	case CommandMove:
		builder := p.chunk.BeginMutation()
		newChunk, newPos := builder.MoveObjet(p.obj.Id, Delta{args[0], args[1], args[2]})
		builder.Apply()

		if newChunk != nil {
			newBuilder := newChunk.BeginMutation()
			newBuilder.AddObjet(p.obj, newPos)
			newBuilder.Apply()
			p.chunk = newChunk
		}
	}
}

func (p *Player) handleConnect(connect *MessageConnect) {
	pos := PosFrom(7, 7, 7)
	obj := NewObjet(ObjetTypePlayer)
	p.name = connect.Name
	p.obj = obj
	p.chunk = p.server.world.Chunk(Location{})

	builder := p.chunk.BeginMutation()
	builder.AddObjet(obj, pos)
	builder.Apply()

	// Send chunks before connected message, so the client has something to render.
	p.Tick()

	// Now send the connected message, which will cause the client to become interactive.
	p.Send(&Message{
		Type: MessageTypePlayerObj,
		PlayerObj: &MessagePlayerObj{
			PlayerObjId: p.obj.Id,
		},
	})
}

func (p *Player) sendChunkUpdates() {
	for chunk, version := range p.focus {
		if version < chunk.version {
			log.Printf("> sending chunk %v updates [%d, %d)", chunk.loc, version, chunk.version)
			p.Send(&Message{
				Type: MessageTypeChunk,
				Chunk: &MessageChunk{
					Loc:  chunk.loc,
					Muts: chunk.MutsSince(version),
				},
			})
			p.focus[chunk] = chunk.version
		}
	}
}

func (p *Player) Tick() {
	p.updateFocus()
	p.sendChunkUpdates()
}

func (p *Player) updateFocus() {
	center := p.chunk.loc

	toRemove := make(map[*Chunk]bool)
	for chunk, _ := range p.focus {
		toRemove[chunk] = true
	}

	for x := center.X - 1; x <= center.X+1; x++ {
		for y := center.Y - 1; y <= center.Y+1; y++ {
			for z := center.Z - 1; z <= center.Z+1; z++ {
				loc := Location{x, y, z}
				p.server.world.EnsureChunk(loc)
				chunk := p.server.world.Chunk(loc)
				if _, exists := p.focus[chunk]; exists {
					delete(toRemove, chunk)
				} else {
					p.focus[chunk] = -1
				}
			}
		}
	}

	for chunk, _ := range toRemove {
		delete(p.focus, chunk)
	}
}
