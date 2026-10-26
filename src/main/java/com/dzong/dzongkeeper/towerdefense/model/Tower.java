package com.dzong.dzongkeeper.towerdefense.model;

public final class Tower {
    public static final int COST=40, UPGRADE_COST=30, MAX_LEVEL=3;
    private final int id;
    private final GamePath.Point position;
    private int level=1;
    private long nextFireTick;
    public Tower(int id,double x,double y) {
        if (id<=0) throw new IllegalArgumentException("Invalid tower ID");
        this.id=id; position=new GamePath.Point(x,y);
    }
    public int getId() { return id; }
    public int getLevel() { return level; }
    public GamePath.Point position() { return position; }
    public double range() { return 7+level; }
    public int damage() { return 8+level*4; }
    public int refund() { return (COST+(level-1)*UPGRADE_COST)/2; }
    public boolean ready(long tick) { return tick>=nextFireTick; }
    public void fired(long tick) { nextFireTick=tick+2; }
    public void upgrade() {
        if (level==MAX_LEVEL) throw new IllegalArgumentException("Tower already at maximum level");
        level++;
    }
}
