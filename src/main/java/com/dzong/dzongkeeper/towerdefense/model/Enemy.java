package com.dzong.dzongkeeper.towerdefense.model;

public final class Enemy {
    private final int id, goldReward;
    private final double speed;
    private final GamePath path;
    private int health;
    private double progress;
    public Enemy(int id, int health, double speed, int goldReward, GamePath path) {
        if (id <= 0 || health <= 0 || speed <= 0 || !Double.isFinite(speed) || goldReward < 0 || path == null)
            throw new IllegalArgumentException("Invalid enemy settings");
        this.id=id; this.health=health; this.speed=speed; this.goldReward=goldReward; this.path=path;
    }
    public int getId() { return id; }
    public int getHealth() { return health; }
    public double getSpeed() { return speed; }
    public double getProgress() { return progress; }
    public int getGoldReward() { return goldReward; }
    public GamePath.Point position() { return path.positionAt(progress); }
    public boolean isAlive() { return health > 0; }
    public boolean hasEscaped() { return isAlive() && path.hasReachedEnd(progress); }
    public boolean isTargetable() { return isAlive() && !hasEscaped(); }
    public void move() { if (isTargetable()) progress=Math.min(path.getLength(), progress+speed); }
    public void takeDamage(int damage) {
        if (damage < 0) throw new IllegalArgumentException("Damage cannot be negative");
        if (isTargetable()) health=Math.max(0, health-damage);
    }
}
