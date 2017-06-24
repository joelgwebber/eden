# Builds the server
.PHONY: server
server:
	go build -o server go/src/eden/server/server.go

# Builds the client.
.PHONY: client
client:
	tsc --out web/eden.js ts/Eden.ts

# Builds and runs the server.
.PHONY: run
run: client server
	./server --port=2112

all: server client
