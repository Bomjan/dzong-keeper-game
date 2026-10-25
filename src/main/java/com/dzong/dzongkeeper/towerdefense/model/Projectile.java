/*
Plan only. This file does not provide a working feature.

Responsibility
Describe a shot travelling from a tower toward an enemy.

Information to store later
Its position, target enemy ID, speed, and damage.
Speed uses distance per tick. The target ID refers to one unique enemy.

Implementation steps
1. Copy the tower's firing position and shot damage when fired.
2. Remember the target ID rather than assuming the enemy still exists.
3. Look up that target before moving or applying damage each tick.
4. Move toward its current position without passing through it.
5. Apply at most one hit, then remove the projectile.
6. Discard the shot if its target died or escaped. Do not change targets.

Works with
Tower supplies the shot values. GameState holds active projectiles.
EnemyHashTable resolves the target ID. GameEngine moves shots and applies hits.
Enemy supplies the current target position through GamePath and progress.

Example
A shot aimed at enemy 12 travels 4 units per tick and deals 10 damage.
If enemy 12 has already died, the shot disappears without awarding gold.

Cases to test later
Missing target, escaped target, several shots reaching one enemy,
a target closer than one movement step, zero distance, and invalid speed.
*/
