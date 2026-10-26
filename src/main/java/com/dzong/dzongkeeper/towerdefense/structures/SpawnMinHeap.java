package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.SpawnEvent;

/** Binary min-heap on our resizable array: O(log n) insert/remove, O(1) peek. */
public final class SpawnMinHeap {
    private final Array<SpawnEvent> entries=new Array<>();
    public int size() { return entries.size(); }
    public SpawnEvent peek() { return size()==0 ? null : entries.get(0); }
    public void add(SpawnEvent event) {
        if (event == null) throw new IllegalArgumentException("Missing event");
        entries.add(event);
        int i=size()-1;
        while (i>0) {
            int parent=(i-1)/2;
            if (entries.get(parent).compareTo(entries.get(i))<=0) break;
            swap(i,parent); i=parent;
        }
    }
    public SpawnEvent poll() {
        if (size()==0) return null;
        SpawnEvent result=entries.get(0), last=entries.get(size()-1);
        entries.delete();
        if (size()>0) {
            entries.set(0,last);
            int i=0;
            while (2*i+1<size()) {
                int child=2*i+1;
                if (child+1<size() && entries.get(child+1).compareTo(entries.get(child))<0) child++;
                if (entries.get(i).compareTo(entries.get(child))<=0) break;
                swap(i,child); i=child;
            }
        }
        return result;
    }
    private void swap(int a,int b) { SpawnEvent tmp=entries.get(a); entries.set(a,entries.get(b)); entries.set(b,tmp); }
}
