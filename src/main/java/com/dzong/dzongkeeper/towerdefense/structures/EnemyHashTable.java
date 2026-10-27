package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;

// Enemy lookup by ID, using separate chains for hash collisions.
public final class EnemyHashTable {
    private static final class Node {
        final Enemy enemy;
        Node next;

        Node(Enemy enemy, Node next) {
            this.enemy = enemy;
            this.next = next;
        }
    }

    private Node[] buckets = new Node[4];
    private int size;

    public int size() {
        return size;
    }

    private int index(int id) {
        return Math.floorMod(id ^ (id >>> 16), buckets.length);
    }

    public Enemy get(int id) {
        for (Node node = buckets[index(id)]; node != null; node = node.next) {
            if (node.enemy.getId() == id) {
                return node.enemy;
            }
        }
        return null;
    }

    public void put(Enemy enemy) {
        if (enemy == null) {
            throw new IllegalArgumentException("Missing enemy");
        }
        if (get(enemy.getId()) != null) {
            throw new IllegalArgumentException("Duplicate enemy ID");
        }
        if (size + 1 > buckets.length * 3 / 4) {
            resize();
        }

        int bucket = index(enemy.getId());
        buckets[bucket] = new Node(enemy, buckets[bucket]);
        size++;
    }

    public Enemy remove(int id) {
        int bucket = index(id);
        Node previous = null;
        for (Node node = buckets[bucket]; node != null; node = node.next) {
            if (node.enemy.getId() == id) {
                if (previous == null) {
                    buckets[bucket] = node.next;
                } else {
                    previous.next = node.next;
                }
                size--;
                return node.enemy;
            }
            previous = node;
        }
        return null;
    }

    private void resize() {
        Node[] oldBuckets = buckets;
        buckets = new Node[oldBuckets.length * 2];
        for (Node head : oldBuckets) {
            while (head != null) {
                Node next = head.next;
                int bucket = index(head.enemy.getId());
                head.next = buckets[bucket];
                buckets[bucket] = head;
                head = next;
            }
        }
    }
}
