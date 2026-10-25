/*
Plan only. This file does not provide a working feature.

Responsibility
Plan waves, schedule their spawn events, and create enemies when due.

Information to store or receive later
Wave definitions, paths, enemy settings, SpawnMinHeap, a sequence counter,
and access to a unique enemy ID source. Receive the current simulation tick.

Implementation steps
1. Decide the number of enemies and their settings for each wave.
2. Convert delays into due simulation ticks relative to the wave start.
3. Create a SpawnEvent for every enemy, with its path and a sequence number.
4. Insert all events into SpawnMinHeap, including those with equal times.
5. During a tick, remove events while the earliest due tick is at most now.
6. Create each Enemy with a unique ID and register it through GameEngine
   in both GameState's active list and EnemyHashTable.
7. Report whether pending events remain so GameEngine can detect wave end.

Works with
GameEngine supplies tick and wave changes. SpawnMinHeap orders SpawnEvent.
GamePath supplies routes. Enemy is created from the planned settings.
GameState and EnemyHashTable receive every spawned enemy together.

Example
A wave starting at tick 50 has delays 0, 2, and 2.
At tick 52, both events due at 52 must spawn, in sequence order.

Cases to test later
An empty wave, equal due times, overdue events, all due events in one tick,
invalid routes, unique IDs across waves, and preventing a wave being scheduled twice.
*/
