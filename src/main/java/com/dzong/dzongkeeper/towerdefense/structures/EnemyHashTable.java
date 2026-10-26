package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.Enemy;

/** Separate chaining with manually linked nodes; rehash above 75% load.
 * Expected O(1) lookup, insert and removal; O(n) worst case. */
public final class EnemyHashTable {
    private static final class Node {
        final Enemy enemy; Node next;
        Node(Enemy enemy,Node next) { this.enemy=enemy; this.next=next; }
    }
    private Node[] buckets=new Node[4];
    private int size;
    public int size() { return size; }
    private int index(int id) { return Math.floorMod(id ^ (id >>> 16),buckets.length); }
    public Enemy get(int id) {
        for (Node n=buckets[index(id)]; n!=null; n=n.next) if (n.enemy.getId()==id) return n.enemy;
        return null;
    }
    public void put(Enemy enemy) {
        if (enemy==null) throw new IllegalArgumentException("Missing enemy");
        if (get(enemy.getId())!=null) throw new IllegalArgumentException("Duplicate enemy ID");
        if (size+1>buckets.length*3/4) resize();
        int i=index(enemy.getId()); buckets[i]=new Node(enemy,buckets[i]); size++;
    }
    public Enemy remove(int id) {
        int i=index(id); Node previous=null;
        for (Node n=buckets[i]; n!=null; n=n.next) {
            if (n.enemy.getId()==id) {
                if (previous==null) buckets[i]=n.next; else previous.next=n.next;
                size--; return n.enemy;
            }
            previous=n;
        }
        return null;
    }
    private void resize() {
        Node[] old=buckets; buckets=new Node[old.length*2];
        for (Node head:old) {
            while (head!=null) {
                Node next=head.next; int i=index(head.enemy.getId());
                head.next=buckets[i]; buckets[i]=head; head=next;
            }
        }
    }
}
