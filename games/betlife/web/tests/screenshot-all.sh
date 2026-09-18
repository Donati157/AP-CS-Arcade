#!/bin/zsh
# usage: shoot.sh <outdir> [base-url]  — one fresh headless browser per screen (robust)
OUT=$1; BASE=${2:-http://localhost:8080/games/betlife/}
S=$(dirname $0)
ENTRIES=(
 "main=seed=7&age=27#main" "main_child=seed=7&age=6#main" "activities=seed=7&age=27#activities" "mindbody=seed=7&age=27&category=mindBody#activity"
 "relationships=seed=7&age=27#relationships" "person=seed=7&age=27&person=first#person" "occupation=seed=7&age=27#occupation" "job=seed=7&age=27#job"
 "jobs=seed=7&age=27#jobs" "school=seed=7&age=12#school" "assets=seed=7&age=27#assets" "shopping=seed=7&age=27#shopping" "shop_cars=seed=7&age=27&shop=usedCars#shop"
 "vehicle=seed=7&age=27&asset=first#asset" "decision=seed=7&age=6&modal=decision#main" "info=seed=7&age=6&modal=info#main" "personcard=seed=7&age=12&modal=person#main"
 "death=seed=7&age=27&modal=death#main" "postlife=seed=7&age=27&modal=postlife#main" "newlife=x=1#start" "pets=seed=7&age=27#pets" "menu=seed=7&age=27#menu"
 "splash=fixture=splash" "disclaimer=fixture=disclaimer" "language=fixture=language" "lovecard=seed=7&age=16&modal=love#main" "banner=seed=7&age=6&modal=banner#main"
 "socialmedia=seed=7&age=27&social=1#socialMedia" "enemies=seed=7&age=27&enemy=1#relationships"
)
for e in $ENTRIES; do node $S/screenshot.mjs $OUT "$BASE" "$e" 2>&1 | grep -v "^$" | tr '\n' ' '; done; echo
