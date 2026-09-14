#!/bin/sh
# Compiles (if needed) and launches BetLife standalone.
cd "$(dirname "$0")" || exit 1
./compile.sh && java -cp out betlife.Main
