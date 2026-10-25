/*
Plan only. This file does not provide a working feature.

Responsibility
Record the outcome of one completed game for the leaderboard.

Information to store later
A unique result ID, score, waves completed, and remaining lives.
The scoring formula still needs to be decided before scores are calculated.

Implementation steps
1. Agree on the scoring formula and explain it in the game rules.
2. Assign a unique result ID for each completed game.
3. Copy final waves and lives from GameState after completion.
4. Calculate the score once and keep the completed result unchanged.
5. Order results by score, then result ID, so ties remain separate.

Works with
GameEngine creates one result at completion. GameState supplies final values.
ScoreAvlTree stores results. ConsoleGame displays their scores and IDs.

Example
Games with IDs 41 and 42 both finish with score 300.
Both stay on the leaderboard because their IDs differ.
The value 300 is an example, not a scoring formula.

Cases to test later
Equal scores with different IDs, repeated submission of the same result,
zero completed waves, zero remaining lives, and a score outside chosen limits.
*/
