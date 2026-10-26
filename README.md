# The Last Dzong Keeper

A browser investigation game built with Spring Boot and JavaScript.

## Console DSA demo (mid-review)

Run `bash scripts/run-console.sh` with JDK 27, or run the `ConsoleGame` main class
in your IDE. This standalone tower-defense demo uses a custom array, enemy hash
table, spawn min-heap, and AVL leaderboard. It does not need the API or frontend.
See [demo commands, rules, and DSA explanations](docs/dsa-implementation-plan.md).

## Run the web application

Requires JDK 27. Run `./mvnw spring-boot:run` (Windows: `.\mvnw.cmd spring-boot:run`), then open [localhost:8080](http://localhost:8080/).

The game runs in memory and resets when the server restarts. GitHub Pages shows a static preview only.

## Test

Run `./mvnw test` (Windows: `.\mvnw.cmd test`).
