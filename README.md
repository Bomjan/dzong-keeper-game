# The Last Dzong Keeper

A browser tower-defense game and a Spring Boot investigation mode built with Java and JavaScript.

## Console DSA demo (mid-review)

Run `bash scripts/run-console.sh` with JDK 27, or run the `ConsoleGame` main class
in your IDE. This standalone tower-defense demo uses a custom array, enemy hash
table, spawn min-heap, AVL leaderboard, circular queue, linked stack, and spatial hash grid.
It does not need the API or frontend.
See [demo commands, rules, and DSA explanations](docs/dsa-implementation-plan.md).

In the console, `undo` and `redo` reverse or reapply tower builds, upgrades,
and sales between waves. History clears when a wave starts or a simulation tick advances.

## Run the web application

Requires JDK 27. Run `./mvnw spring-boot:run` (Windows: `.\mvnw.cmd spring-boot:run`), then open [localhost:8080](http://localhost:8080/).

The game runs in memory and resets when the server restarts. GitHub Pages shows a static preview only.

The browser tower-defense game has Undo and Redo buttons in the gameplay HUD.
They reverse tower builds, upgrades, and sales during preparation and between
waves. Its targeting uses a 100-pixel spatial grid, rebuilt from current enemy
positions each frame. The Java console game remains a separate implementation.
Run `node web/js/main.test.cjs` to check the browser edit history and targeting.

Investigation mode keeps one-step `POST /api/game/move/{roomId}` movement.
`POST /api/game/travel/{roomId}` follows the least-cost unlocked room route,
charges the sum of corridor costs, and marks every room on that route visited.
`GET /api/game/route/{roomId}` previews the route, cost, and reachability without
spending time. Open `/investigation.html` to select a destination on the map,
see the route and estimated cost, then choose whether to travel.
An unreachable destination or insufficient remaining time returns HTTP 400
without moving the player. Route weights and locks come from `web/data/state.json`
and the current session state.

## Test

Run `./mvnw test` (Windows: `.\mvnw.cmd test`).
