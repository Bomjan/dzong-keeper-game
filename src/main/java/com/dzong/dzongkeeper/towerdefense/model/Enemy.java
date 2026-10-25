/*
Plan only. This file does not provide a working feature.

Responsibility
Represent one enemy moving toward the Dzong.

Information to store later
A unique enemy ID, health, speed, path, progress, and gold reward.
Progress means how far the enemy has travelled along its GamePath.
Speed is distance per simulation tick. A tick is one game update.

Implementation steps
1. Choose units for health, distance, and speed. Reject invalid values.
2. Assign a unique ID when the enemy is created. Never reuse an active ID.
3. Keep its GamePath and progress together so its position can be found.
4. Let the engine change health and progress during a tick.
5. Distinguish a defeated enemy from one that escaped at the path end.
   The engine will settle its reward or life loss exactly once.

Works with
GamePath supplies the route. WaveManager creates enemies.
GameState lists them. EnemyHashTable finds them by ID.
TargetSelector, Projectile, and GameEngine use their position and health.

Example
Enemy 12 has 30 health, moves 2 distance units per tick, and rewards 5 gold.
After taking 30 damage, it is defeated and cannot escape or pay gold again.

Cases to test later
Duplicate IDs, invalid speed, zero health, damage beyond remaining health,
movement across several path points, and arrival exactly at the Dzong.
*/
