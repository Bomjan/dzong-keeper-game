package com.dzong.dzongkeeper.towerdefense.model;

public final class Projectile {
    private GamePath.Point position;
    private final int targetId;
    private final int damage;
    private final double speed;
    private boolean spent;

    public Projectile(GamePath.Point position, int targetId, int damage, double speed) {
        if (position == null || targetId <= 0 || damage <= 0
                || speed <= 0 || !Double.isFinite(speed)) {
            throw new IllegalArgumentException("Invalid projectile");
        }
        this.position = position;
        this.targetId = targetId;
        this.damage = damage;
        this.speed = speed;
    }

    public int targetId() {
        return targetId;
    }

    /** Returns true once the shot can be removed. */
    public boolean advance(Enemy target) {
        if (spent) {
            return true;
        }
        if (target == null || target.getId() != targetId || !target.isTargetable()) {
            spent = true;
            return true;
        }

        GamePath.Point destination = target.position();
        double distance = GamePath.distance(position, destination);
        if (distance <= speed) {
            target.takeDamage(damage);
            spent = true;
            return true;
        }

        position = new GamePath.Point(
                position.x() + (destination.x() - position.x()) * speed / distance,
                position.y() + (destination.y() - position.y()) * speed / distance
        );
        return false;
    }
}
