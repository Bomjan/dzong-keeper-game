/*
Plan only. This file does not provide a working feature.

Responsibility
Find active enemies by their unique IDs without scanning the entire list.
A hash table maps an ID to a bucket, which is a storage slot.

Information to store or receive later
Buckets containing enemy IDs and Enemy references, the entry count,
and the bucket count. Receive IDs for insertion, lookup, and removal.

Implementation steps
1. Turn each ID into a valid bucket index using a hash calculation.
2. Handle collisions: different IDs can lead to the same bucket.
   A simple approach is a list of entries in each bucket.
3. Insert a new ID and enemy. Reject duplicate active IDs.
4. Look up the bucket and compare full IDs to find the right enemy.
5. Remove only the matching entry. Leave colliding entries reachable.
6. Track how full the table is and choose a resizing threshold.
7. Resize by creating more buckets and recalculating every entry's index.

Works with
WaveManager creates Enemy objects. GameEngine registers and removes them.
Projectile targets are resolved through this table.
GameState keeps the active list used for movement and target scanning.

Example
Enemy IDs 12 and 22 land in one bucket. Both remain available.
Removing 12 must still allow a lookup of 22.

Cases to test later
Collisions, duplicate insertion, missing lookup, missing removal,
removing each position in a bucket list, resizing, and list/table agreement.
*/
