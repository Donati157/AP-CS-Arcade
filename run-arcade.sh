#!/bin/sh
# Compiles the Arcade and every game into out/ and starts the Arcade. Requires Java 17.
cd "$(dirname "$0")" || exit 1
rm -rf out
mkdir -p out
javac -d out $(find arcade/src games/betlife/src -name '*.java') || exit 1
java -cp out arcade.Main
