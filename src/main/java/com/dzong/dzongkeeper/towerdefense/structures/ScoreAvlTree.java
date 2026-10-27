package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.GameResult;

// Balanced leaderboard ordered by score
public final class ScoreAvlTree {
    private static final class Node {
        final GameResult result;
        Node left;
        Node right;
        int height = 1;

        Node(GameResult result) {
            this.result = result;
        }
    }

    private Node root;
    private int size;
    private long nextId = 1;

    public long nextResultId() {
        while (containsId(root, nextId)) {
            nextId++;
        }
        return nextId++;
    }

    public int size() {
        return size;
    }

    public int height() {
        return height(root);
    }

    public void add(GameResult result) {
        if (result == null || containsId(root, result.id())) {
            throw new IllegalArgumentException("Missing result or duplicate result ID");
        }
        root = insert(root, result);
        size++;
    }

    private boolean containsId(Node node, long id) {
        return node != null && (node.result.id() == id
                || containsId(node.left, id)
                || containsId(node.right, id));
    }

    public GameResult find(int score, long id) {
        Node node = root;
        while (node != null) {
            int order = Integer.compare(score, node.result.score());
            if (order == 0) {
                order = Long.compare(id, node.result.id());
            }
            if (order == 0) {
                return node.result;
            }
            node = order < 0 ? node.left : node.right;
        }
        return null;
    }

    public Array<GameResult> top(int limit) {
        if (limit < 0) {
            throw new IllegalArgumentException("Limit cannot be negative");
        }
        Array<GameResult> results = new Array<>();
        collectHighestFirst(root, limit, results);
        return results;
    }

    private void collectHighestFirst(Node node, int limit, Array<GameResult> results) {
        if (node == null || results.size() >= limit) {
            return;
        }
        collectHighestFirst(node.right, limit, results);
        if (results.size() < limit) {
            results.add(node.result);
        }
        if (results.size() < limit) {
            collectHighestFirst(node.left, limit, results);
        }
    }

    private Node insert(Node node, GameResult result) {
        if (node == null) {
            return new Node(result);
        }

        if (result.compareTo(node.result) < 0) {
            node.left = insert(node.left, result);
        } else {
            node.right = insert(node.right, result);
        }
        updateHeight(node);

        if (height(node.left) - height(node.right) > 1) {
            if (result.compareTo(node.left.result) > 0) {
                node.left = rotateLeft(node.left);
            }
            return rotateRight(node);
        }
        if (height(node.right) - height(node.left) > 1) {
            if (result.compareTo(node.right.result) < 0) {
                node.right = rotateRight(node.right);
            }
            return rotateLeft(node);
        }
        return node;
    }

    private static int height(Node node) {
        return node == null ? 0 : node.height;
    }

    private static void updateHeight(Node node) {
        node.height = 1 + Math.max(height(node.left), height(node.right));
    }

    private Node rotateRight(Node node) {
        Node newRoot = node.left;
        node.left = newRoot.right;
        newRoot.right = node;
        updateHeight(node);
        updateHeight(newRoot);
        return newRoot;
    }

    private Node rotateLeft(Node node) {
        Node newRoot = node.right;
        node.right = newRoot.left;
        newRoot.left = node;
        updateHeight(node);
        updateHeight(newRoot);
        return newRoot;
    }

    // just for unit tests, not used in the game itself
    public boolean isBalanced() {
        return checkedHeight(root) >= 0;
    }

    private int checkedHeight(Node node) {
        if (node == null) {
            return 0;
        }

        int leftHeight = checkedHeight(node.left);
        int rightHeight = checkedHeight(node.right);
        if (leftHeight < 0 || rightHeight < 0
                || Math.abs(leftHeight - rightHeight) > 1
                || node.height != 1 + Math.max(leftHeight, rightHeight)) {
            return -1;
        }
        return node.height;
    }
}
