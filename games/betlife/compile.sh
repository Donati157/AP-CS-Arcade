#!/bin/sh
# Compiles BetLife into out/ (ignored by Git). Run from any directory.
cd "$(dirname "$0")" || exit 1
mkdir -p out
javac -d out $(find src -name '*.java') && echo "BetLife compiled to $(pwd)/out"
