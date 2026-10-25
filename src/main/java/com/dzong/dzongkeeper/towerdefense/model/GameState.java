/*
Plan only. This file does not provide a working feature.

Responsibility
Hold the current state of one Java tower-defense simulation.

Information to store later
The current tick, gold, lives, wave, pause status, and lists of active
Enemy, Tower, and Projectile objects. Also record whether the game finished.
A tick is one simulation update. Simulation ticks control game time.

Implementation steps
1. Decide starting gold, lives, and the first wave number.
2. Start with empty active lists and a clear playing status.
3. Let GameEngine control changes so commands and ticks follow the same rules.
4. Keep the enemy list and EnemyHashTable in agreement after each tick.
5. Keep a finished state stable and expose readable information to ConsoleGame.

Works with
GameEngine owns updates. WaveManager supplies enemies for the active list.
TargetSelector scans that list. ConsoleGame reads status.
GameResult receives final values, rather than sharing changing state.

Example
At tick 25, the player has 80 gold and 3 lives in wave 2.
Pausing leaves tick 25, movement, and cooldown timing unchanged.

Cases to test later
Starting state, pause and resume, empty lists, no negative spending,
life loss at zero, reset between games, and no updates after completion.
*/
