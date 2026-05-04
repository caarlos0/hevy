#!/usr/bin/env sh
set -e

version="$(svu next --always)"
npm version "${version#v}" --no-git-tag-version
git add package.json package-lock.json
git commit -m "release: $version"
git tag "$version" -m "$version"
