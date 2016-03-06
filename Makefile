# Builds the server
.PHONY: server
server:
	go build -o server go/src/eden/main/server/server.go

# Builds the go client.
.PHONY: go-client
go-client:
	go build -o client go/src/eden/main/client/client.go

# Builds the js client.
.PHONY: js-client
js-client:
	tsc --out web/eden.js ts/eden.ts

# Builds the server, runs it in the background, and starts the js-client auto-compiling.
.PHONY: js-client-auto
js-client-auto: server
	./server --port=2112 &
	tsc --out web/eden.js -w ts/eden.ts
	killall server

# Builds and runs the server.
.PHONY: run
run: server
	./eden --port=2112

all: server go-client js-client

