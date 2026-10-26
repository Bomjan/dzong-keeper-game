package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.*;
import com.dzong.dzongkeeper.towerdefense.structures.SpawnMinHeap;

public final class WaveManager {
    public static final int TOTAL_WAVES=3;
    private final SpawnMinHeap pending=new SpawnMinHeap();
    private long sequence;
    private int lastWave, nextEnemyId=1;
    public int pending() { return pending.size(); }
    public void schedule(int wave,long tick,GamePath path) {
        if (wave!=lastWave+1 || wave>TOTAL_WAVES || tick<0 || path==null || pending()>0)
            throw new IllegalArgumentException("Wave cannot be scheduled");
        for (int i=0;i<4+wave*2;i++)
            pending.add(new SpawnEvent(tick+1+(i/2)*3,sequence++,path,16+wave*8,0.7+wave*0.1,12));
        lastWave=wave;
    }
    public Enemy spawnDue(long tick) {
        if (pending.peek()==null || pending.peek().dueTick()>tick) return null;
        SpawnEvent event=pending.poll();
        return new Enemy(nextEnemyId++,event.health(),event.speed(),event.reward(),event.path());
    }
}
