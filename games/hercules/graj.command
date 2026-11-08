#!/bin/bash
cd "$(dirname "$0")"
echo "Uruchamianie C-130 Hercules Paratrooper Game..."
python3 -m http.server 8080 &
SERVER_PID=$!
sleep 1
open "http://localhost:8080/index.html" || open "index.html"
echo "Gra otwarta w przeglądarce! Aby zakończyć serwer, wciśnij Ctrl+C."
wait $SERVER_PID
