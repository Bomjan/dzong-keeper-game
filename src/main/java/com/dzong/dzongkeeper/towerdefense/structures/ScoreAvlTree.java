/*
Plan only. This file does not provide a working feature.

Responsibility
Keep completed GameResult entries ordered by score and result ID.
A binary search tree (BST) puts smaller keys left and larger keys right.
An AVL tree keeps that tree balanced so one side does not grow too tall.

Information to store or receive later
A root and nodes holding a result, left and right children, and a height.
Height measures the longest route down to a leaf.
The key is the pair of score and unique result ID, in that order.

Implementation steps
1. Compare scores first and result IDs second. Equal scores must not lose results.
2. Insert using ordinary BST insertion. Reject the same result ID being
   submitted twice; GameEngine must also prevent repeated final submission.
3. Recalculate heights after insertion, working back toward the root.
4. Calculate each balance factor as left height minus right height.
5. Fix a left-left case with a right rotation.
6. Fix a right-right case with a left rotation.
7. Fix a left-right case by rotating the left child left, then the parent right.
8. Fix a right-left case by rotating the right child right, then the parent left.
   A rotation rearranges nearby links while preserving the key order.
9. Update heights after rotations and keep checking ancestors.
10. Find a result by comparing its full key and following left or right links.
11. Traverse right, then current result, then left to show highest scores first.
12. Leave deletion as a future extension.

Works with
GameEngine submits one GameResult per completed game.
ConsoleGame requests lookup and the highest-scoring results.

Example
Scores 10, 20, and 30 cause a right-right imbalance and a left rotation.
Two results scoring 20 still occupy separate nodes when their IDs differ.

Cases to test later
All four rotation cases, height updates, empty lookup, missing keys,
equal scores, repeated submission, and descending leaderboard order.
*/
