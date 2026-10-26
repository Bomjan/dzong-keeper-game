package com.dzong.dzongkeeper.towerdefense.structures;

import com.dzong.dzongkeeper.towerdefense.model.GameResult;

/** AVL insertion and full-key lookup O(log n); top k traversal O(log n + k).
 * Duplicate-ID validation scans O(n), since the tree is ordered by score then ID. */
public final class ScoreAvlTree {
    private static final class Node {
        final GameResult result; Node left,right; int height=1;
        Node(GameResult result) { this.result=result; }
    }
    private Node root;
    private int size;
    private long nextId=1;
    public long nextResultId() { while (containsId(root,nextId)) nextId++; return nextId++; }
    public int size() { return size; }
    public int height() { return height(root); }
    public void add(GameResult result) {
        if (result==null || containsId(root,result.id())) throw new IllegalArgumentException("Missing result or duplicate result ID");
        root=insert(root,result); size++;
    }
    private boolean containsId(Node n,long id) { return n!=null && (n.result.id()==id || containsId(n.left,id) || containsId(n.right,id)); }
    public GameResult find(int score,long id) {
        Node n=root;
        while (n!=null) {
            int c=Integer.compare(score,n.result.score());
            if (c==0) c=Long.compare(id,n.result.id());
            if (c==0) return n.result;
            n=c<0 ? n.left : n.right;
        }
        return null;
    }
    public Array<GameResult> top(int limit) {
        if (limit<0) throw new IllegalArgumentException("Limit cannot be negative");
        Array<GameResult> results=new Array<>(); collect(root,limit,results); return results;
    }
    private void collect(Node n,int limit,Array<GameResult> out) {
        if (n==null || out.size()>=limit) return;
        collect(n.right,limit,out);
        if (out.size()<limit) out.add(n.result);
        if (out.size()<limit) collect(n.left,limit,out);
    }
    private Node insert(Node n,GameResult result) {
        if (n==null) return new Node(result);
        if (result.compareTo(n.result)<0) n.left=insert(n.left,result); else n.right=insert(n.right,result);
        update(n);
        if (height(n.left)-height(n.right)>1) {
            if (result.compareTo(n.left.result)>0) n.left=rotateLeft(n.left);
            return rotateRight(n);
        }
        if (height(n.right)-height(n.left)>1) {
            if (result.compareTo(n.right.result)<0) n.right=rotateRight(n.right);
            return rotateLeft(n);
        }
        return n;
    }
    private static int height(Node n) { return n==null ? 0 : n.height; }
    private static void update(Node n) { n.height=1+Math.max(height(n.left),height(n.right)); }
    private Node rotateRight(Node n) { Node p=n.left; n.left=p.right; p.right=n; update(n); update(p); return p; }
    private Node rotateLeft(Node n) { Node p=n.right; n.right=p.left; p.left=n; update(n); update(p); return p; }
    /** Recursively checks stored heights and AVL balance for review/testing. */
    public boolean isBalanced() { return checkedHeight(root)>=0; }
    private int checkedHeight(Node n) {
        if (n==null) return 0;
        int l=checkedHeight(n.left),r=checkedHeight(n.right);
        if (l<0 || r<0 || Math.abs(l-r)>1 || n.height!=1+Math.max(l,r)) return -1;
        return n.height;
    }
}
