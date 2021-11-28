#!/usr/bin/env bash

set -eouE pipefail

trap 'echo "Aborting due to errexit on line $LINENO. Exit code: $?" >&2' ERR

IFS="$(printf '\n\t')"

_run() {
  echo "$1" | jq -r '.[]' | while read -r path; do
    echo "Publishing: $path"
    (cd "$path" && yarn npm publish)
  done
}

_run "$@"
