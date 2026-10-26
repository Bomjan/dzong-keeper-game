package com.dzong.dzongkeeper.towerdefense.engine;

import com.dzong.dzongkeeper.towerdefense.model.*;
import com.dzong.dzongkeeper.towerdefense.structures.Array;

/** Linear nearest-target search O(e), with smaller enemy ID breaking ties. */
public final class TargetSelector {
    public Enemy select(Tower tower,Array<Enemy> enemies) {
        Enemy best=null; double nearest=tower.range();
        for (int i=0;i<enemies.size();i++) {
            Enemy enemy=enemies.get(i);
            if (!enemy.isTargetable()) continue;
            double distance=GamePath.distance(tower.position(),enemy.position());
            if (distance<nearest || (Double.compare(distance,nearest)==0 && (best==null || enemy.getId()<best.getId()))) {
                best=enemy; nearest=distance;
            }
        }
        return best;
    }
}
