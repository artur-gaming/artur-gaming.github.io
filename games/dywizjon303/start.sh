#!/bin/bash
# Skrypt uruchamiający grę w domyślnej przeglądarce
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
echo "Uruchamianie gry Dywizjon 303: Bitwa o Anglię 3D..."
open "$DIR/index.html"
