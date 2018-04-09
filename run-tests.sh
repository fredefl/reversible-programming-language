#!/bin/bash
for filename in ./tests/*.rpl; do
	printf "Running %s: " "$filename"
	node index.js -t "$filename" $@
done
