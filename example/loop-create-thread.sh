#!/bin/bash
set -e
set -o pipefail

while [ true ]; do
  ./create-thread.sh
  echo "" # make new line
  sleep 1
done
