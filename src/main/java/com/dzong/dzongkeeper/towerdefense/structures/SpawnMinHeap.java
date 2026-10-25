/*
Plan only. This file does not provide a working feature.

Responsibility
Keep the earliest SpawnEvent ready to be read or removed first.
A min-heap is a tree stored in a list where each parent comes before
its children according to the chosen ordering.

Information to store or receive later
A list of SpawnEvent entries. Order each entry by due tick, then sequence.
Equal spawn times must not lose events.

Implementation steps
1. Define one comparison using due tick and then sequence number.
2. Insert at the end of the list.
3. Move the event upward by swapping with its parent while it comes earlier.
4. Read the root, the first entry, to inspect the earliest event.
5. Remove the root and put the last entry in its place.
6. Move that replacement downward by swapping with the earlier child
   until the parent-before-children rule is restored.
7. Handle empty and single-entry heaps without reading invalid positions.

Works with
WaveManager fills and consumes the heap. SpawnEvent supplies its ordering.
GameEngine asks WaveManager to spawn all events due at the current tick.

Example
Events due at ticks 8, 3, and 3 come out as 3, 3, then 8.
The two events at tick 3 are ordered by their sequence numbers.

Cases to test later
Empty removal, one event, ascending and descending insertion,
equal times, upward movement across several levels, and downward movement
where either the left or right child is earlier.
*/
