# DSA implementation and mid-review demo

The Java tower-defense implementation is runnable under
`src/main/java/com/dzong/dzongkeeper/towerdefense/`. It has no Spring dependencies.
The investigation API and browser game are separate from this console demo.

## Run the console

From the repository root, with the project's JDK 27 installed:

```sh
bash scripts/run-console.sh
```

The script compiles only the tower-defense package into `target/console-classes`
using `javac`, then launches `ConsoleGame`. Maven, a server, and network access
are unnecessary. In an IDE, run `ConsoleGame.main(String[] args)`.

On Windows PowerShell, compile and run directly:

```powershell
New-Item -ItemType Directory -Force target/console-classes | Out-Null
$sources = Get-ChildItem src/main/java/com/dzong/dzongkeeper/towerdefense -Recurse -Filter *.java | ForEach-Object FullName
javac -d target/console-classes $sources
java -cp target/console-classes com.dzong.dzongkeeper.towerdefense.ui.ConsoleGame
```

## Review demonstration

Enter one command per line:

```text
build 5 3
build 10 5
build 15 9
wave
tick
inspect
pause
tick 10
status
resume
tick 60
wave
tick 60
wave
tick 60
scores
new
scores
quit
```

This shows construction, simultaneous spawns, movement, targeting, pause,
three completed waves, victory, and a leaderboard retained across new games.
For the short version, omit the first `tick`, `inspect`, and pause/resume steps.
Three towers at the suggested positions win with 3 lives, 22 kills, and score 580.
Start a new game and enter `wave`, `tick 100` without towers to demonstrate defeat.
Use `help` for all commands. End-of-input also exits cleanly.

## Data structures built from scratch

| Implementation | Role | Time complexity |
| --- | --- | --- |
| `Array<T>` | Active enemies, towers, projectiles, heap storage, leaderboard output | Index O(1), append amortized O(1), indexed insert/delete O(n) |
| `EnemyHashTable` | Enemy ID lookup for projectile targets | Expected O(1), worst O(n); rehash O(n) |
| `SpawnMinHeap` | Earliest scheduled spawn first | Add/remove O(log n), peek O(1) |
| `ScoreAvlTree` | Balanced score leaderboard with full-key lookup | Tree insert/lookup O(log n), top k O(log n + k) |

The hash table handles collisions with manually linked nodes, grows above 75%
load, and rehashes entries. The heap sifts up after insertion and sifts down
after root removal. Its key is `(dueTick, sequence)` so equal times retain
all events. The AVL tree implements LL, RR, LR, and RL rotations and updates
heights after rotations. Its key is `(score, resultId)` so equal scores survive.
Duplicate result-ID validation is a separate O(n) traversal, making the overall
public AVL `add` operation O(n). AVL deletion is outside this demo.

No `ArrayList`, `HashMap`, `PriorityQueue`, `TreeMap`, library sorting, or collection
implementation is used in production tower-defense code. Primitive/object Java
arrays, `System.arraycopy`, mathematical helpers, text I/O, and `Scanner` are
standard Java facilities used by the implementation. Reference collections occur
only in tests to compare results independently.

## Algorithms and game rules

- The path is a polyline: (0,0) to (12,0) to the Dzong at (12,12).
  Position interpolation scans segments in O(p), where p is the number of points.
  No graph search is needed for this fixed route.
- Target selection scans active enemies for the nearest eligible target in
  O(e) per ready tower. Distance ties choose the smaller enemy ID.
- Start with 120 gold and 5 lives. A tower costs 40; upgrades cost 30, up to
  level 3. Sale refunds half the total investment. Towers must be off the path,
  within coordinates [0,20], and at least one unit apart.
- At level L, range is 7+L and damage is 8+4L. Towers fire every two ticks.
  Projectiles travel four units per tick and hit at most once.
- Wave w has 4+2w enemies with health 16+8w, speed 0.7+0.1w, and reward 12.
  Pairs spawn at delays 1, 4, 7, etc. Each wave starts with `wave`.
- Tick order: spawn all due enemies, move enemies, fire towers, move/hit shots,
  remove defeated/escaped enemies from both structures, settle rewards/lives,
  then check completion. An escaped enemy cannot subsequently be hit.
- Paused games, finished games, and intervals between waves freeze simulation
  time. Building and upgrading during a pause are allowed.
- An escape costs one life. Zero lives is defeat. Clearing all three waves with
  at least one life is victory. Completed games are frozen and submitted once.
- Score is `kills*10 + completedWaves*100 + remainingLives*20` for both outcomes.
  Results are immutable. New games reset resources and preserve the shared AVL
  leaderboard. Scores are in memory and disappear when the console exits.

The engine uses reverse-index cleanup so array deletion cannot skip entries.
Indexed array removals may shift O(e) elements each, making a tick O(e²) in the
worst case, in addition to targeting and projectile work. This is adequate for
these small waves and is an explicit tradeoff of the custom ordered array.

## Verification

```sh
bash mvnw test
```

Tests cover array growth/shrink, hash collisions/removal/rehashing, randomized
heap operations against a reference priority queue, all four AVL rotations,
1,000 ordered AVL inserts with ties, path interpolation, target boundaries,
one-time projectile damage, invalid spending, pause, simultaneous/overdue
spawns, list/table consistency, victory/defeat, one-time submission, console
input recovery, EOF, and replay with retained scores.
