/*
Plan only. This file does not provide a working feature.

Responsibility
Describe the ordered points an enemy follows toward the Dzong.
Use a simple list of positions. No graph algorithms are needed.

Information to store or receive later
The route's points, in travel order, from the entrance to the Dzong.
Distances between adjacent points may be stored if useful.

Implementation steps
1. Choose a simple way to represent a point with two coordinates.
2. Require a usable route and decide how to handle repeated points.
3. Measure each straight segment between adjacent points.
4. Translate an enemy's travelled distance into a position on a segment.
5. Stop movement at the last point, even when a tick moves a long distance.

Works with
Enemy follows the path. SpawnEvent selects it. WaveManager assigns it.
GameEngine uses it for movement. TargetSelector uses the resulting positions.

Example
The route (0, 0), (6, 0), (6, 4) ends at the Dzong.
An enemy with progress 8 is at (6, 2).

Cases to test later
No points, one point, repeated points, a turn, progress at a segment end,
negative progress, and movement beyond the last point.
*/
