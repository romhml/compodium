#!/bin/bash

# Inspired by: https://github.com/nuxt/nuxt/blob/main/scripts/release.sh

set -e

pnpm -r prepack

REPO_ROOT=$(pwd)

# Function to publish a package
publish_package() {
  local pkg=$1
  local tag="latest"

  echo "⚡ Publishing $pkg with tag $tag"

  if [[ $pkg != "packages/meta" ]]; then
    cp "$REPO_ROOT/LICENSE" .
    cp "$REPO_ROOT/README.md" .
  fi

  pnpm publish --access public --no-git-checks --tag "$tag"

  if [[ $pkg != "packages/meta" ]]; then
    rm LICENSE
    rm README.md
  fi
}

# Release packages
for PKG in packages/*; do
  if [[ $PKG == "packages/devtools" ]]; then
    continue
  fi

  pushd "$PKG" > /dev/null
  publish_package "$PKG"
  popd > /dev/null
done
