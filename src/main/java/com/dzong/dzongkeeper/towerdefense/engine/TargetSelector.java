/*
Plan only. This file does not provide a working feature.

Responsibility
Choose the nearest living enemy within one tower's range.
The first version will use a simple scan: inspect each active enemy once.
No spatial tree or other search structure is needed for this version.

Information to receive later
A Tower's position and range, and GameState's active Enemy list.
Enemy positions come from their GamePath and progress.

Implementation steps
1. Start with no chosen target.
2. Ignore enemies that are dead or have escaped.
3. Measure the distance from the tower to each remaining enemy.
4. Ignore enemies beyond the range. Include the exact range boundary.
5. Keep the closest enemy found so far.
6. For equal distances, choose the smaller enemy ID for a repeatable result.
7. Return no target if no eligible enemy is in range.

Works with
GameEngine calls the selector for a ready Tower.
Enemy, GamePath, and GameState supply target information.
The chosen enemy ID is used when GameEngine creates a Projectile.

Example
A tower with range 5 sees enemies at distances 3, 4, and 7.
It chooses the living enemy at distance 3.

Cases to test later
An empty list, all enemies outside range, an enemy exactly on the boundary,
equal distances, zero distance, dead enemies, and escaped enemies still awaiting cleanup.
*/
