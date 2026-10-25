/*
Plan only. This file does not provide a working feature.

Responsibility
Accept player commands and display the Java simulation in a terminal
before any browser integration. A terminal is a text input and output window.

Information to receive later
Player command text, GameEngine, readable GameState, and leaderboard results.
Possible commands include build, upgrade, sell, tick, pause, resume, and status.

Implementation steps
1. Start a separate Java simulation with agreed starting rules.
2. Print command help and the current gold, lives, wave, and tick.
3. Read a command and check its words, IDs, and numbers.
4. Pass valid game actions to GameEngine rather than editing state directly.
5. Use an explicit tick command first so the player can inspect each update.
6. Display errors and outcomes clearly, then accept the next command.
7. Show final GameResult and ScoreAvlTree results when the game ends.
8. Handle quit and input ending cleanly. Do not connect to the browser yet.

Works with
GameEngine handles actions. GameState supplies status and active objects.
Tower and Enemy details help explain play. GameResult and ScoreAvlTree
supply completed scores. Existing investigation controllers stay separate.

Example
The player enters a build command for an archer at (4, 3).
The engine validates the purchase, and status shows the remaining gold.
A tick command then advances the simulation by one step.

Cases to test later
Unknown commands, missing arguments, invalid numbers, unknown tower IDs,
insufficient gold, pause and resume, commands after completion, quit,
and input ending without a quit command.
*/
