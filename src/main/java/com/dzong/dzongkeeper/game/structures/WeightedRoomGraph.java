package com.dzong.dzongkeeper.game.structures;

import java.util.ArrayList;
import java.util.List;

/** Undirected room graph with positive travel costs and Dijkstra route search. */
public final class WeightedRoomGraph {
    private static final class Edge {
        final int destination;
        final int cost;
        Edge next;

        Edge(int destination, int cost, Edge next) {
            this.destination = destination;
            this.cost = cost;
            this.next = next;
        }
    }

    /** One heap entry per unsettled room; decreasing a cost restores heap order. */
    private static final class MinHeap {
        private final int[] vertices;
        private final int[] positions;
        private final long[] distances;
        private int size;

        MinHeap(int capacity, long[] distances) {
            vertices = new int[capacity];
            positions = new int[capacity];
            this.distances = distances;
            for (int i = 0; i < capacity; i++) {
                positions[i] = -1;
            }
        }

        boolean isEmpty() {
            return size == 0;
        }

        void offerOrDecrease(int vertex) {
            int index = positions[vertex];
            if (index < 0) {
                index = size++;
                vertices[index] = vertex;
                positions[vertex] = index;
            }
            siftUp(index);
        }

        int poll() {
            int minimum = vertices[0];
            positions[minimum] = -1;
            size--;
            if (size > 0) {
                vertices[0] = vertices[size];
                positions[vertices[0]] = 0;
                siftDown(0);
            }
            return minimum;
        }

        private void siftUp(int index) {
            while (index > 0) {
                int parent = (index - 1) / 2;
                if (compare(vertices[parent], vertices[index]) <= 0) break;
                swap(parent, index);
                index = parent;
            }
        }

        private void siftDown(int index) {
            while (2 * index + 1 < size) {
                int child = 2 * index + 1;
                if (child + 1 < size && compare(vertices[child + 1], vertices[child]) < 0) child++;
                if (compare(vertices[index], vertices[child]) <= 0) break;
                swap(index, child);
                index = child;
            }
        }

        private int compare(int first, int second) {
            int order = Long.compare(distances[first], distances[second]);
            return order != 0 ? order : Integer.compare(first, second);
        }

        private void swap(int first, int second) {
            int vertex = vertices[first];
            vertices[first] = vertices[second];
            vertices[second] = vertex;
            positions[vertices[first]] = first;
            positions[vertices[second]] = second;
        }
    }

    public record Route(List<String> rooms, long cost, boolean reachable) {
        public Route {
            rooms = List.copyOf(rooms);
        }
    }

    private String[] rooms = new String[4];
    private Edge[] edges = new Edge[4];
    private int size;

    public void addRoom(String id) {
        if (id == null || id.isBlank() || indexOf(id) >= 0) {
            throw new IllegalArgumentException("Room ID must be unique and nonblank");
        }
        if (size == rooms.length) {
            String[] grownRooms = new String[rooms.length * 2];
            Edge[] grownEdges = new Edge[edges.length * 2];
            System.arraycopy(rooms, 0, grownRooms, 0, size);
            System.arraycopy(edges, 0, grownEdges, 0, size);
            rooms = grownRooms;
            edges = grownEdges;
        }
        rooms[size++] = id;
    }

    public void connect(String first, String second, int cost) {
        int from = indexOf(first);
        int to = indexOf(second);
        if (from < 0 || to < 0 || from == to || cost <= 0) {
            throw new IllegalArgumentException("Corridors need distinct known rooms and positive cost");
        }
        edges[from] = new Edge(to, cost, edges[from]);
        edges[to] = new Edge(from, cost, edges[to]);
    }

    /** Returns the route, total cost, and reachability; ties follow room insertion order. */
    public Route shortestRoute(String start, String goal) {
        int source = indexOf(start);
        int target = indexOf(goal);
        if (source < 0 || target < 0) {
            throw new IllegalArgumentException("Unknown room");
        }
        if (source == target) {
            return new Route(List.of(start), 0, true);
        }

        long[] distance = new long[size];
        int[] previous = new int[size];
        boolean[] settled = new boolean[size];
        for (int i = 0; i < size; i++) {
            distance[i] = Long.MAX_VALUE;
            previous[i] = -1;
        }
        distance[source] = 0;
        MinHeap frontier = new MinHeap(size, distance);
        frontier.offerOrDecrease(source);
        while (!frontier.isEmpty()) {
            int current = frontier.poll();
            if (current == target) break;
            settled[current] = true;
            for (Edge edge = edges[current]; edge != null; edge = edge.next) {
                long candidate = distance[current] + edge.cost;
                if (!settled[edge.destination] && candidate < distance[edge.destination]) {
                    distance[edge.destination] = candidate;
                    previous[edge.destination] = current;
                    frontier.offerOrDecrease(edge.destination);
                }
            }
        }
        if (previous[target] < 0) {
            return new Route(List.of(), -1, false);
        }
        List<String> path = new ArrayList<>();
        for (int at = target; at != source; at = previous[at]) {
            path.add(rooms[at]);
        }
        path.add(rooms[source]);
        java.util.Collections.reverse(path);
        return new Route(path, distance[target], true);
    }

    private int indexOf(String id) {
        for (int i = 0; i < size; i++) {
            if (rooms[i].equals(id)) {
                return i;
            }
        }
        return -1;
    }
}
