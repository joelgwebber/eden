package server

import (
	"fmt"
	"io"
	"log"

	"golang.org/x/net/websocket"
)

type Player struct {
	id     int
	conn   *websocket.Conn
	server *Server

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
		focus:  make(map[*Chunk]int),
	}
}

func (p *Player) Think() {
	// ...
}

func (p *Player) Objet() Objet {
	return p.obj
}

func (p *Player) Conn() *websocket.Conn {
	return p.conn
}

func (p *Player) Send(msg *Message) {
	websocket.JSON.Send(p.conn, msg)
}

func (p *Player) Listen() {
	for {
		var msg Message
		err := websocket.JSON.Receive(p.conn, &msg)
		if err == io.EOF {
			log.Printf("player '%s' disconnected", p.name)
			p.server.Remove(p)
			return
		} else if err != nil {
			log.Printf("error receiving from websocket: %s", err)
		} else {
			p.recvMessage(&msg)
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
		newChunk, obj, newPos := builder.MoveObjet(p.obj.Id, Delta{args[0], args[1], args[2]})
		builder.Apply()

		if newChunk != nil {
			newBuilder := newChunk.BeginMutation()
			newBuilder.AddObjet(obj, newPos)
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
	fmt.Printf("Player '%s' connected.\n", p.name)
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
