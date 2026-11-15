# Investigation routing

`WeightedRoomGraph` represents rooms as vertices and unlocked corridors as
undirected, positive-cost edges in linked adjacency lists. `GameService` rebuilds
the graph from the current session before each route preview or travel action,
so corridor lock changes immediately affect route choice.

`shortestRoute(source, destination)` runs Dijkstra's algorithm with a custom
binary min-heap. The heap stores each unsettled room at most once and supports
decreasing its tentative distance in O(log V). The search takes
O((V + E) log V) time and O(V + E) space. Constructing the graph from session
JSON is separate from this search cost.

The result contains the room IDs in travel order, total corridor cost, and a
reachability flag. An unreachable destination has an empty route and cost -1;
the current room has a one-room route and cost 0. Room IDs are validated before
searching.

`GET /api/game/route/{roomId}` previews the route without spending time or
moving. `POST /api/game/travel/{roomId}` applies it if reachable and affordable.
The existing `POST /api/game/move/{roomId}` continues to move one corridor at a
time. The investigation map at `/investigation.html` previews and highlights the
route before offering the travel action.
