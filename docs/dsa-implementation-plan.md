# DSA tower-defense implementation plan

These files are a plan, not working features. DSA means data structures and
algorithms: ways to store information and process it. Every new Java file
contains only a block comment. There are no package declarations, classes,
fields, constructors, or methods yet. The folder path reserves the future
`com.dzong.dzongkeeper.towerdefense` package and its subpackages.

## Repository inspection and scope

No `AGENTS.md` repository instructions were found in the repository or its
ancestor directories. The README describes the investigation game and its
Spring Boot run and test commands. The Maven build targets Java 27 and serves
the existing `web/` directory as static resources.

The existing Java investigation backend is under `game/controller`,
`game/model`, and `game/service`. It includes `GameController`, `GameSession`,
`Accusation`, and `GameService`. Its session state is investigation data,
not an equivalent Java tower-defense model. The application entry point,
health controller, resources, and existing API tests remain as they are.

There are no equivalent Java files for the 14 planned files. There is a
conceptual overlap with the browser game: `web/js/main.js` already manages
towers, enemies, projectiles, resources, and waves. `web/js/api.js` also
contains investigation API calls. These browser files are preserved.
Changing browser code or connecting the new simulation to it is outside this
task. Do not treat this plan as an integration or replacement of either game.

## Proposed folder tree

```text
src/main/java/com/dzong/dzongkeeper/towerdefense/
├── model/
│   ├── Enemy.java
│   ├── Tower.java
│   ├── Projectile.java
│   ├── GamePath.java
│   ├── SpawnEvent.java
│   ├── GameResult.java
│   └── GameState.java
├── structures/
│   ├── EnemyHashTable.java
│   ├── SpawnMinHeap.java
│   └── ScoreAvlTree.java
├── engine/
│   ├── GameEngine.java
│   ├── WaveManager.java
│   └── TargetSelector.java
└── ui/
    └── ConsoleGame.java

docs/
└── dsa-implementation-plan.md
```

`model` describes the game information: enemies, towers, shots, routes,
scheduled arrivals, completed results, and the current simulation state.
A path is an ordered list of points. It does not need graph algorithms.

`structures` holds the three DSA exercises. The hash table finds enemies by
ID. The min-heap keeps the earliest spawn event first. The AVL tree keeps
results ordered and balanced. Balanced means that neither side of the tree
becomes much taller than the other.

`engine` applies rules and coordinates each simulation update. It schedules
waves, chooses targets, handles player actions, and completes games.

`ui` provides a text interface in the terminal. It sends commands to the
engine and displays state before any browser integration.

## Flow of information

1. `ConsoleGame` receives player commands and passes valid input to
   `GameEngine`. The engine checks game rules before changing `GameState`.
2. `WaveManager` creates `SpawnEvent` entries from wave rules and `GamePath`
   routes. `SpawnMinHeap` orders them by due tick and then sequence number.
3. On each tick, due events create `Enemy` objects. The engine adds each enemy
   to the active list and `EnemyHashTable` together. Enemy IDs must be unique.
4. Enemies move along their paths. `TargetSelector` scans the active list for
   the nearest eligible enemy within each ready `Tower`'s range. The first
   version uses this simple scan.
5. Towers fire `Projectile` objects. Each shot carries a target enemy ID.
   The hash table resolves that ID before movement or damage is applied.
6. The engine removes defeated and escaped enemies from the list and table.
   It preserves their outcome long enough to pay gold once for each defeat
   or subtract lives once for each escape. Console output reads the new state.
7. When the game finishes, the engine creates one `GameResult` and inserts
   it into `ScoreAvlTree`. The console can display the highest scores.

The active enemy list supports movement and target scans. The hash table
supports finding one enemy by ID. Both must describe the same active enemies.
The leaderboard uses completed results rather than changing game state.

## Tick order and rules to preserve

Simulation ticks control game time. A tick is one simulation update.
Spawns, movement, and attack cooldowns use ticks rather than browser timers.

1. Stop immediately if the game is paused or finished.
2. Advance the simulation tick.
3. Spawn every enemy whose event is due.
4. Move enemies along their paths.
5. Let ready towers choose targets and fire.
6. Move projectiles and apply hits to targets that are still alive.
7. Remove dead or escaped enemies from both the active list and the hash table.
8. Award gold once per defeated enemy and subtract lives once per escaped enemy.
9. Check whether the wave or game has ended.
10. Add one result to the leaderboard when the game finishes.

An enemy that reaches the Dzong during movement is escaped. It cannot then
be targeted or hit. A defeated enemy cannot pay a second reward. A wave ends
only when no scheduled spawns or active enemies remain. Victory requires
the final wave to end. Zero lives means defeat. Further ticks must leave a
finished game unchanged, including its single leaderboard submission.

Equal spawn times must not lose events. Compare due ticks first and unique
sequence numbers second. Equal scores must not lose results. Compare scores
first and unique result IDs second. Keep completed result keys unchanged.
The scoring formula still needs to be decided; sample scores in comments
do not define it. AVL deletion is a future extension.

## Implementation order

Follow this order: **basic playable rules → enemy hash table → spawn heap →
AVL leaderboard → console polish and testing**.

1. **Basic playable rules.** First agree on starting gold and lives, tower
   prices, upgrades, sale refunds, movement units, cooldowns, waves, and
   victory. Implement the models and a small manual console loop. Use simple
   standard lists and scans initially. Establish one playable path, one tower
   type, and one wave before expanding the rules.
2. **Enemy hash table.** Implement collisions, insertion, lookup, removal,
   and resizing. Replace temporary enemy ID scans with the table. Check that
   it stays consistent with the active list after every update.
3. **Spawn heap.** Implement insertion, upward movement, earliest removal,
   and downward movement. Replace temporary spawn scheduling with the heap.
   Process every due event, including ties and overdue events.
4. **AVL leaderboard.** Decide the scoring formula. Implement ordinary BST
   insertion, height updates, balance factors, all four rotation cases,
   full-key lookup, and highest-score traversal. Add one result per game.
5. **Console polish and testing.** Improve help, input errors, status output,
   and leaderboard display. Run complete games and verify the edge cases.
   Add focused tests during implementation as each rule or structure becomes
   real, then run the full checks at this final stage.

## Future implementation checklist

- [ ] Agree on playable rules, units, costs, limits, and the scoring formula.
- [ ] Implement model validation and simple ordered paths.
- [ ] Give enemies unique IDs across waves and results unique IDs across games.
- [ ] Build a minimal console loop with commands to advance explicit ticks.
- [ ] Implement the specified tick order and freeze paused or finished games.
- [ ] Validate building, upgrading, and selling before changing resources.
- [ ] Scan for the nearest living target and settle distance ties by enemy ID.
- [ ] Handle missing projectile targets and prevent repeated hits.
- [ ] Award defeat gold and subtract escape lives exactly once.
- [ ] Implement hash collisions, insertion, lookup, removal, and resizing.
- [ ] Verify the enemy list and hash table agree after spawns and removals.
- [ ] Implement heap ordering and both upward and downward movement.
- [ ] Verify equal spawn times preserve all events and all due events spawn.
- [ ] Implement AVL insertion, heights, balance factors, and four rotations.
- [ ] Verify equal scores preserve separate results and lookup uses the full key.
- [ ] Display highest scores first; leave tree deletion for a later extension.
- [ ] Submit exactly one result for victory or defeat.
- [ ] Test boundaries, empty structures, invalid commands, pause, and completion.
- [ ] Polish console help and run end-to-end Java simulation checks.

Begin with the basic rules and the comments in `model/GamePath.java`,
`model/Enemy.java`, and `model/GameState.java`. Then use `engine/GameEngine.java`
as the guide for the first playable tick. No implementation, dependencies,
build changes, or placeholder tests are part of this planning change.
