package com.dzong.dzongkeeper.towerdefense.model;

public final class Projectile {
    private GamePath.Point position;
    private final int targetId,damage;
    private final double speed;
    private boolean spent;
    public Projectile(GamePath.Point position,int targetId,int damage,double speed) {
        if (position==null || targetId<=0 || damage<=0 || speed<=0 || !Double.isFinite(speed))
            throw new IllegalArgumentException("Invalid projectile");
        this.position=position; this.targetId=targetId; this.damage=damage; this.speed=speed;
    }
    public int targetId() { return targetId; }
    /** Returns true once the shot can be removed. */
    public boolean advance(Enemy target) {
        if (spent) return true;
        if (target==null || target.getId()!=targetId || !target.isTargetable()) return spent=true;
        GamePath.Point end=target.position(); double distance=GamePath.distance(position,end);
        if (distance<=speed) { target.takeDamage(damage); return spent=true; }
        position=new GamePath.Point(position.x()+(end.x()-position.x())*speed/distance,
                position.y()+(end.y()-position.y())*speed/distance);
        return false;
    }
}
