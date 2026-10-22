# The Last Dzong Keeper

A dzong investigation game with a static browser view and a Java Spring Boot backend. The backend owns the game state and rules; the browser renders the state and sends actions to the controller. The existing task API remains available as a separate example.

## Structure

- `web/`: HTML, CSS, and JavaScript view, also deployed to GitHub Pages as a static preview.
- `src/main/java/com/dzong/dzongkeeper/game/{model,service,controller}/`: game state, rules, and REST API.
- `src/main/java/com/dzong/dzongkeeper/task/{model,service,controller}/`: the original task feature in the same layout.
- `web/data/state.json`: initial game data and the GitHub Pages preview snapshot.

Maven copies `web/` into the Spring Boot static resources at build time. Run the Spring app to use the interactive game. GitHub Pages hosts only the static preview and cannot run the Java backend.

## Run

Install JDK 27 and set `JAVA_HOME`, then run:

```powershell
.\mvnw.cmd spring-boot:run
```

Open `http://localhost:8080/`. Game state is stored in memory and resets when the server restarts. You can also restart a game with `POST /api/game/reset`.

## Game API

| Method | Path | Result |
| --- | --- | --- |
| GET | `/api/game` | Current game state |
| POST | `/api/game/move/{roomId}` | Move to an adjacent room |
| POST | `/api/game/inspect` | Inspect the current room |
| POST | `/api/game/interview/{witnessId}` | Interview a witness in the current room |
| POST | `/api/game/edges/{edgeId}/toggle` | Lock or unlock a corridor |
| POST | `/api/game/accuse/{suspectId}` | Accuse a suspect |
| GET | `/api/game/register?q=mask` | Search the register |
| POST | `/api/game/reset` | Reset the game |

Invalid actions return `400` as Problem Details JSON. There is one shared in-memory game session; multiple visitors to one server share it.

The original task endpoints remain at `/api/tasks`, with health at `/api/health`. Tasks are also in memory.

## Test

```powershell
.\mvnw.cmd test
```
