.PHONY: eden
eden:
	go build -o eden go/src/eden/main/main.go

.PHONY: client
client:
	tsc --out web/eden.js ts/eden.ts

.PHONY: client-auto
client-auto:
	tsc --out web/eden.js -w ts/eden.ts

.PHONY: run
run: all
	./eden --port=2112

all: client eden
