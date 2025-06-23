#!/bin/bash

# Inspired by: https://github.com/nuxt/nuxt/blob/main/scripts/release.sh

set -e

REPO_ROOT=$(pwd)

# Function to publish a package
sync_package() {
  local pkg=$1
  if [[ $pkg != "packages/meta" ]]; then
    cp "$REPO_ROOT/LICENSE" .
    cp "$REPO_ROOT/README.md" .
  fi
}

# Release packages
for PKG in packages/*; do
  if [[ $PKG == "packages/devtools" ]]; then
    continue
  fi

  pushd "$PKG" > /dev/null
  sync_package "$PKG"
  popd > /dev/null
done
