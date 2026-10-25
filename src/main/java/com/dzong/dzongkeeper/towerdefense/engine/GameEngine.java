/*
Plan only. This file does not provide a working feature.

Responsibility
Coordinate the Java simulation, building, upgrading, selling, damage,
rewards, and game completion. These files are a plan, not working features.
Changing browser code is outside this task.

Information to store or receive later
GameState, WaveManager, EnemyHashTable, TargetSelector, ScoreAvlTree,
and validated player commands. Also track unique IDs and final submission.
Simulation ticks control game time, including movement and cooldowns.

Implementation steps
1. Decide playable rules: starting resources, costs, damage, waves, and victory.
   Decide the scoring formula separately before adding completed results.
2. Validate build, upgrade, and sale commands before changing gold or towers.
   Reject unavailable positions, unknown towers, and unaffordable purchases.
3. Give each enemy a unique ID and keep the active list and table consistent.
4. Implement the tick order below with one clear owner for each update.
5. Settle each defeated or escaped enemy only once. Keep its reward or
   escape information available during removal so settlement is not lost.
6. Finish once, freeze updates, and submit only one completed result.

Tick order to implement later
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

An enemy reaching the Dzong in step 4 is escaped and cannot be targeted or hit.
A defeated enemy cannot take more hits or produce another reward.
A wave ends only when its pending events and active enemies are both gone.
Victory also requires the last planned wave to end. Zero lives means defeat.
Equal spawn times must not lose events. Equal scores must not lose results.
Use sequence numbers for spawn ties and result IDs for leaderboard ties.

Works with
ConsoleGame supplies commands and reads GameState.
WaveManager uses SpawnEvent and SpawnMinHeap to create Enemy objects.
Enemy follows GamePath. Tower uses TargetSelector and fires Projectile objects.
EnemyHashTable resolves projectile targets. ScoreAvlTree stores GameResult.

Example
At tick 40, two due enemies spawn. A tower's shot defeats one.
Cleanup removes that enemy from the list and table and then pays its reward.
The other enemy reaches the Dzong on a later tick and costs one life once.

Cases to test later
Paused or finished ticks, several due spawns, cooldown boundaries,
invalid purchases, upgrades and sales, two shots hitting the same target,
a target escaping before a hit, list/table agreement, one-time rewards,
last-life loss, a final wave with pending spawns, and repeated finish calls.
*/
