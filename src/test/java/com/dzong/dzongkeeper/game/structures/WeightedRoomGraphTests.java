package com.dzong.dzongkeeper.game.structures;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.*;

class WeightedRoomGraphTests {
    @Test
    void dijkstraChoosesCheaperMultiEdgeRouteAndHandlesDisconnectedRooms() {
        WeightedRoomGraph graph = new WeightedRoomGraph();
        graph.addRoom("start");
        graph.addRoom("goal");
        graph.addRoom("middle");
        graph.addRoom("isolated");
        graph.connect("start", "goal", 10);
        graph.connect("start", "middle", 2);
        graph.connect("middle", "goal", 3);

        WeightedRoomGraph.Route route = graph.shortestRoute("start", "goal");
        assertEquals(List.of("start", "middle", "goal"), route.rooms());
        assertEquals(5, route.cost());
        assertTrue(route.reachable());
        WeightedRoomGraph.Route unreachable = graph.shortestRoute("start", "isolated");
        assertFalse(unreachable.reachable());
        assertEquals(List.of(), unreachable.rooms());
        assertEquals(-1, unreachable.cost());
        assertThrows(UnsupportedOperationException.class, () -> route.rooms().add("extra"));
    }

    @Test
    void rejectsInvalidRoomAndCorridorData() {
        WeightedRoomGraph graph = new WeightedRoomGraph();
        graph.addRoom("a");
        graph.addRoom("b");
        assertThrows(IllegalArgumentException.class, () -> graph.addRoom("a"));
        assertThrows(IllegalArgumentException.class, () -> graph.connect("a", "missing", 1));
        assertThrows(IllegalArgumentException.class, () -> graph.connect("a", "b", 0));
        assertThrows(IllegalArgumentException.class, () -> graph.shortestRoute("a", "missing"));
        WeightedRoomGraph.Route sameRoom = graph.shortestRoute("a", "a");
        assertTrue(sameRoom.reachable());
        assertEquals(List.of("a"), sameRoom.rooms());
        assertEquals(0, sameRoom.cost());
    }

    @Test
    void heapDijkstraMatchesIndependentAllPairsCosts() {
        int count = 40;
        long infinity = Long.MAX_VALUE / 4;
        long[][] costs = new long[count][count];
        WeightedRoomGraph graph = new WeightedRoomGraph();
        for (int i = 0; i < count; i++) {
            graph.addRoom("room-" + i);
            for (int j = 0; j < count; j++) costs[i][j] = i == j ? 0 : infinity;
        }
        Random random = new Random(27);
        for (int i = 0; i < count; i++) {
            for (int j = i + 1; j < count; j++) {
                if (random.nextInt(7) == 0) {
                    int cost = 1 + random.nextInt(20);
                    graph.connect("room-" + i, "room-" + j, cost);
                    costs[i][j] = costs[j][i] = cost;
                }
            }
        }
        for (int via = 0; via < count; via++) {
            for (int from = 0; from < count; from++) {
                for (int to = 0; to < count; to++) {
                    costs[from][to] = Math.min(costs[from][to], costs[from][via] + costs[via][to]);
                }
            }
        }
        for (int goal = 0; goal < count; goal++) {
            WeightedRoomGraph.Route route = graph.shortestRoute("room-0", "room-" + goal);
            assertEquals(costs[0][goal] < infinity, route.reachable());
            if (route.reachable()) {
                assertEquals(costs[0][goal], route.cost());
                assertEquals("room-0", route.rooms().get(0));
                assertEquals("room-" + goal, route.rooms().get(route.rooms().size() - 1));
            }
        }
    }
}
