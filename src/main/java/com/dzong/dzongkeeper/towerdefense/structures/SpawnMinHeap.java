package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.SpawnEvent;

/** Binary min-heap on a resizable array. */
public final class SpawnMinHeap {
    private final Array<SpawnEvent> entries = new Array<>();

    public int size() {
        return entries.size();
    }

    public SpawnEvent peek() {
        return size() == 0 ? null : entries.get(0);
    }

    public void add(SpawnEvent event) {
        if (event == null) {
            throw new IllegalArgumentException("Missing event");
        }

        entries.add(event);
        int index = size() - 1;
        while (index > 0) {
            int parent = (index - 1) / 2;
            if (entries.get(parent).compareTo(entries.get(index)) <= 0) {
                break;
            }
            swap(index, parent);
            index = parent;
        }
    }

    public SpawnEvent poll() {
        if (size() == 0) {
            return null;
        }

        SpawnEvent result = entries.get(0);
        SpawnEvent last = entries.get(size() - 1);
        entries.delete();
        if (size() == 0) {
            return result;
        }

        entries.set(0, last);
        int index = 0;
        while (2 * index + 1 < size()) {
            int child = 2 * index + 1;
            if (child + 1 < size()
                    && entries.get(child + 1).compareTo(entries.get(child)) < 0) {
                child++;
            }
            if (entries.get(index).compareTo(entries.get(child)) <= 0) {
                break;
            }
            swap(index, child);
            index = child;
        }
        return result;
    }

    private void swap(int first, int second) {
        SpawnEvent event = entries.get(first);
        entries.set(first, entries.get(second));
        entries.set(second, event);
    }
}
