# Builds the server
.PHONY: server
server:
	go build go/src/eden/main/eden.go

# Builds the js client.
.PHONY: js-client
js-client:
	gulp

.PHONY: dev
dev: server
	gulp webpack-dev &
	./eden --port=2112

# Builds and runs the server.
.PHONY: run
run: js-client server
	./eden --port=2112

all: server js-client
