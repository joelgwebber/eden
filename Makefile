# Builds the server
.PHONY: server
server:
	go install eden/main/serve

# Builds the js client.
.PHONY: js-client
js-client:
	gulp

.PHONY: dev
dev: server
	gulp webpack-dev &
	go/bin/serve --port=2112

# Builds and runs the server.
.PHONY: run
run: js-client server
	go/bin/serve --port=2112

all: server js-client
