#!/bin/bash
set -e
cp test-infra/npm-shrinkwrap.canonical.json npm-shrinkwrap.json
npm install
rm npm-shrinkwrap.json
