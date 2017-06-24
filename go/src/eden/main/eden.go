package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"

	"eden/server"
)

func main() {
	port := flag.Int("port", 8080, "server port")
	flag.Parse()

	srv := server.NewServer()
	go srv.Listen()

	addr := fmt.Sprintf(":%d", *port)
	log.Printf("Starting server on %s", addr)
	http.Handle("/", http.FileServer(http.Dir("web")))
	log.Fatal(http.ListenAndServe(addr, nil))
}
