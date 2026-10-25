/*
Plan only. This file does not provide a working feature.

Responsibility
Describe one enemy that should appear at a scheduled time.

Information to store or receive later
The due simulation tick, the GamePath to use, and a unique sequence number.
Any enemy settings needed by WaveManager must also be supplied or resolved.
A sequence number records the order in which events were planned.

Implementation steps
1. Use simulation ticks for due times. Avoid wall-clock or browser timers.
2. Give each event a sequence number when it is planned.
3. Compare due ticks first, then sequence numbers when times are equal.
4. Keep the event unchanged while it is in SpawnMinHeap.
5. Let WaveManager consume it once to create an enemy with a unique ID.

Works with
WaveManager creates and consumes events. SpawnMinHeap orders them.
GamePath defines the route. GameEngine supplies the current tick.

Example
Two enemies are due at tick 20. Sequences 7 and 8 keep both events,
and sequence 7 is handled first. Equal spawn times must not lose events.

Cases to test later
Equal due times, out-of-order insertion, an overdue event, invalid paths,
invalid due ticks, and prevention of repeated consumption.
*/
