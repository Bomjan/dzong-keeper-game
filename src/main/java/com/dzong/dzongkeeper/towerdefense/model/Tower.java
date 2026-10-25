/*
Plan only. This file does not provide a working feature.

Responsibility
Describe one tower that attacks enemies near its position.

Information to store later
Its ID, type, position, level, range, damage, and attack cooldown.
Range is the greatest attack distance. Cooldown is the wait between shots.
Store attack timing in simulation ticks, not browser time.

Implementation steps
1. Choose tower types and their starting values and costs.
2. Validate the position and assign a tower ID.
3. Decide how to record when the next attack is ready.
4. Define how upgrades change level, range, damage, and cooldown.
5. Let GameEngine handle purchases, upgrades, sales, and firing.

Works with
GameState holds towers. GameEngine checks costs and attack readiness.
TargetSelector chooses an Enemy. Projectile carries the shot's damage.

Example
An archer tower at (4, 3) has range 5 and damage 10.
With a cooldown of 3 ticks, a shot at tick 8 permits the next at tick 11.

Cases to test later
An enemy exactly at the range boundary, no target, insufficient gold,
maximum level, invalid position, repeated sale, and pause during cooldown.
*/
