package com.dzong.dzongkeeper.towerdefense.model;

/** An ordered polyline; progress is measured in distance units. */
public final class GamePath {
    public record Point(double x, double y) {
        public Point {
            if (!Double.isFinite(x) || !Double.isFinite(y)) throw new IllegalArgumentException("Coordinates must be finite");
        }
    }
    private final Point[] points;
    private final double length;
    public GamePath(double length) { this(new Point(0, 0), endpoint(length)); }
    private static Point endpoint(double length) {
        if (length <= 0 || !Double.isFinite(length)) throw new IllegalArgumentException("Length must be positive and finite");
        return new Point(length, 0);
    }
    public GamePath(Point... points) {
        if (points == null || points.length < 2) throw new IllegalArgumentException("A path needs two points");
        this.points = points.clone();
        double total = 0;
        for (int i = 0; i < points.length; i++) {
            if (points[i] == null) throw new IllegalArgumentException("Missing path point");
            if (i > 0) {
                double segment = distance(points[i-1], points[i]);
                if (segment == 0 || !Double.isFinite(segment)) throw new IllegalArgumentException("Segments must have positive finite length");
                total += segment;
            }
        }
        if (!Double.isFinite(total)) throw new IllegalArgumentException("Path too long");
        length = total;
    }
    public double getLength() { return length; }
    public boolean hasReachedEnd(double progress) { return progress >= length; }
    public Point positionAt(double progress) {
        if (!Double.isFinite(progress) || progress < 0) throw new IllegalArgumentException("Progress must be nonnegative and finite");
        for (int i = 1; i < points.length; i++) {
            double segment = distance(points[i-1], points[i]);
            if (progress <= segment) {
                double t = progress / segment;
                return new Point(points[i-1].x() + t * (points[i].x()-points[i-1].x()),
                        points[i-1].y() + t * (points[i].y()-points[i-1].y()));
            }
            progress -= segment;
        }
        return points[points.length-1];
    }
    public static double distance(Point a, Point b) { return Math.hypot(a.x()-b.x(), a.y()-b.y()); }
}
