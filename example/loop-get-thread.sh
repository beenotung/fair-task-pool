#!/bin/bash
set -e
set -o pipefail

while [ true ]; do
  ./get-thread.sh
  echo "" # make new line
  sleep 1
done
