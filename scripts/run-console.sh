#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p target/console-classes
mapfile -t sources < <(find src/main/java/com/dzong/dzongkeeper/towerdefense -name '*.java' -print)
javac -d target/console-classes "${sources[@]}"
exec java -cp target/console-classes com.dzong.dzongkeeper.towerdefense.ui.ConsoleGame "$@"
