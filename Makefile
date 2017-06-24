# Builds the server
.PHONY: server
server:
	go build go/src/eden/main/eden.go

# Builds the js client.
.PHONY: js-client
js-client:
	tsc --out web/eden.js ts/eden.ts

# Builds the server, runs it in the background, and starts the js-client auto-compiling.
.PHONY: js-client-auto
js-client-auto: server
	./eden --port=2112 &
	tsc --out web/eden.js -w ts/eden.ts
	killall eden

# Builds and runs the server.
.PHONY: run
run: js-client server
	./eden --port=2112

all: server js-client

