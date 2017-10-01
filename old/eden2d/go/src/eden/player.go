package eden

import (
	"fmt"
	"io"
	"log"

	"golang.org/x/net/websocket"

	"eden/proto"
	"eden/world"
)

const (
	msgBufSize = 100
)

type Player struct {
	id       uint32
	conn     *websocket.Conn
	server   *Server
	messages chan *proto.Message
	quitSend chan bool
	quitRecv chan bool

	name      string
	obj       *world.Object
	tileGen   uint32
	objectGen uint32
}

func NewPlayer(conn *websocket.Conn, server *Server, id uint32) *Player {
	return &Player{
		id:       id,
		conn:     conn,
		server:   server,
		messages: make(chan *proto.Message, msgBufSize),
		quitSend: make(chan bool),
		quitRecv: make(chan bool),
	}
}

func (p *Player) Send(msg *proto.Message) {
	select {
	case p.messages <- msg:
	default:
		p.server.Error(fmt.Errorf("player %d is disconnected.", p.id))
		p.Disconnect()
	}
}

func (p *Player) Disconnect() {
	p.quitRecv <- true
}

func (p *Player) Listen() {
	go p.listenSend()
	p.listenRecv()

	// Once the receiver loop ends, remove the player and stop the send loop.
	p.remove()
	p.quitSend <- true
}

func (p *Player) listenRecv() {
	for {
		select {
		case <-p.quitRecv:
			return

		default:
			var msg proto.Message
			err := websocket.JSON.Receive(p.conn, &msg)
			if err == io.EOF {
				return
			} else if err != nil {
				p.server.Error(err)
			} else {
				p.recvMessage(&msg)
			}
		}
	}
}

func (p *Player) listenSend() {
	for {
		select {
		case msg := <-p.messages:
			websocket.JSON.Send(p.conn, msg)

		case <-p.quitSend:
			return
		}
	}
}

// Removes the player from its server, and its object from its region.
func (p *Player) remove() {
	p.server.RemovePlayer(p)
	p.obj.Region.RemovePlayer(p.id)
}

func (p *Player) recvMessage(msg *proto.Message) {
	switch msg.Type {
	case proto.MessageTypeConnect:
		p.handleConnect(msg.Connect)
	case proto.MessageTypePlayerAction:
		p.handleAction(msg.PlayerAction)
	default:
		log.Printf("Unknown message: %v", msg)
	}
}

func (p *Player) handleAction(action *proto.MessagePlayerAction) {
	region := p.obj.Region

	// Take the region lock.
	region.Mutex.Lock()
	defer region.Mutex.Unlock()

	switch action.Type {
	case proto.PlayerActionMove:
		switch proto.MoveDir(action.Args[0].(float64)) {
		case proto.MoveNorth:
			region.MoveObject(p.obj, p.obj.X, p.obj.Y-1)
		case proto.MoveSouth:
			region.MoveObject(p.obj, p.obj.X, p.obj.Y+1)
		case proto.MoveWest:
			region.MoveObject(p.obj, p.obj.X-1, p.obj.Y)
		case proto.MoveEast:
			region.MoveObject(p.obj, p.obj.X+1, p.obj.Y)
		}

	case proto.PlayerActionPlace:
		region.AddObject(&world.Object{
			Type: world.ObjectType(action.Args[0].(float64)),
			Pos:  world.ObjectPosition(action.Args[1].(float64)),
		}, p.obj.X, p.obj.Y)
	}

	region.SendPlayerUpdates()
}

func (p *Player) handleConnect(connect *proto.MessageConnect) {
	region, exists := p.server.world.RegionById(connect.Region)
	if !exists {
		// TODO: Send client error.
		return
	}

	// Take the region lock.
	region.Mutex.Lock()
	defer region.Mutex.Unlock()

	p.name = connect.Name
	p.obj = region.AddPlayer(p.id, p)

	// Now send the connected message, which will cause the client to become interactive.
	p.Send(&proto.Message{
		Type: proto.MessageTypeConnected,
		Connected: &proto.MessageConnected{
			Width:   region.Width(),
			Height:  region.Height(),
			Cells:   region.RawCells(),
			Objects: region.AllObjectRecs(),
		},
	})
}

func (p *Player) UpdatesNeeded() (tileGen, objectGen uint32) {
	return p.tileGen, p.objectGen
}

func (p *Player) SetGeneration(tileGen, objectGen uint32) {
	p.tileGen = tileGen
	p.objectGen = objectGen
}

func (p *Player) SendUpdate(tileRecs []proto.TileRecord, objectRecs []proto.ObjectRecord) {
	p.Send(&proto.Message{
		Type: proto.MessageTypeRegionUpdate,
		RegionUpdate: &proto.MessageRegionUpdate{
			TileRecs:   tileRecs,
			ObjectRecs: objectRecs,
		},
	})
}
