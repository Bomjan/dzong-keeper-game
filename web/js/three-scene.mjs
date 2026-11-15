import * as THREE from 'three';

const SCALE = 20;
const TOWER_COLORS = { archer: 0x3ddc9a, cannon: 0xe26958, mage: 0xb78aff, guard: 0x70a9ed };

function position(x, y, width, height, elevation = 0) {
  return new THREE.Vector3((x - width / 2) / SCALE, elevation, (y - height / 2) / SCALE);
}

function box(width, height, depth, color) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 })
  );
}

export class DzongScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x101b19);
    this.scene.fog = new THREE.Fog(0x101b19, 45, 85);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 150);
    this.camera.position.set(0, 32, 34);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.className = 'three-battlefield';
    canvas.before(this.renderer.domElement);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.markers = [];
    this.towerMeshes = new Map();
    this.enemyMeshes = new Map();
    this.projectileMeshes = new Map();
    this.warriorMeshes = new Map();
    this.staticGroup = new THREE.Group();
    this.scene.add(this.staticGroup);
    this.scene.add(new THREE.HemisphereLight(0xc9e8ee, 0x4b301d, 2.2));
    const sun = new THREE.DirectionalLight(0xffd9a3, 3);
    sun.position.set(-14, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    this.scene.add(sun);
  }

  resize(width, height, paths, spots) {
    this.width = width;
    this.height = height;
    const halfHeight = height / SCALE * 0.82;
    const halfWidth = width / SCALE * 0.72;
    this.camera.left = -halfWidth;
    this.camera.right = halfWidth;
    this.camera.top = halfHeight;
    this.camera.bottom = -halfHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.staticGroup.clear();
    this.markers = [];

    const ground = box(width / SCALE * 1.7, 0.35, height / SCALE * 1.7, 0x254339);
    ground.position.y = -0.26;
    ground.receiveShadow = true;
    this.staticGroup.add(ground);
    const groundGrid = new THREE.GridHelper(
      Math.max(width, height) / SCALE * 1.4, 28, 0x567060, 0x3b594c
    );
    groundGrid.position.y = -0.07;
    this.staticGroup.add(groundGrid);

    // Low-poly trees frame the battlefield without hiding the build pads.
    const treePositions = [
      [-28, -14], [-23, -10], [-18, -15], [-13, -11], [13, -12], [19, -15], [24, -9], [29, -14],
      [-29, 13], [-24, 9], [-19, 15], [-13, 11], [13, 12], [18, 15], [24, 9], [29, 13],
    ];
    for (const [x, z] of treePositions) {
      const tree = new THREE.Group();
      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.17, 0.25, 1.2, 6),
        new THREE.MeshStandardMaterial({ color: 0x775039 })
      );
      trunk.position.y = 0.6;
      tree.add(trunk);
      const foliage = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 2.9, 7),
        new THREE.MeshStandardMaterial({ color: 0x2d6851, roughness: 0.95 })
      );
      foliage.position.y = 2.25;
      foliage.castShadow = true;
      tree.add(foliage);
      tree.position.set(x, 0, z);
      this.staticGroup.add(tree);
    }

    for (const path of paths) {
      const points = path.samples.map((sample) => position(sample.x, sample.y, width, height, 0.03));
      const curve = new THREE.CatmullRomCurve3(points);
      const road = new THREE.Mesh(
        new THREE.TubeGeometry(curve, Math.max(20, points.length), 0.48, 6, false),
        new THREE.MeshStandardMaterial({ color: 0x96704b, roughness: 1 })
      );
      road.receiveShadow = true;
      this.staticGroup.add(road);
    }

    const fortress = new THREE.Group();
    const courtyard = box(7.6, 0.5, 7.6, 0x907451);
    courtyard.position.y = 0.24;
    courtyard.receiveShadow = true;
    fortress.add(courtyard);
    for (const x of [-3.2, 3.2]) {
      for (const z of [-3.2, 3.2]) {
        const watchtower = box(1.1, 1.8, 1.1, 0xc9b89a);
        watchtower.position.set(x, 1.35, z);
        fortress.add(watchtower);
        const top = new THREE.Mesh(
          new THREE.ConeGeometry(0.95, 0.9, 4),
          new THREE.MeshStandardMaterial({ color: 0x783f2b })
        );
        top.rotation.y = Math.PI / 4;
        top.position.set(x, 2.7, z);
        fortress.add(top);
      }
    }
    const base = box(4.7, 1.6, 4.7, 0xddd3b7);
    base.position.y = 0.8;
    fortress.add(base);
    const upper = box(3.5, 1.4, 3.5, 0xede2c5);
    upper.position.y = 2.2;
    fortress.add(upper);
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(3.6, 1.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x7d3427, roughness: 0.7 })
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 3.55;
    fortress.add(roof);
    const finial = new THREE.Mesh(
      new THREE.SphereGeometry(0.25, 8, 6),
      new THREE.MeshStandardMaterial({ color: 0xf1cb72, metalness: 0.5 })
    );
    finial.position.y = 4.4;
    fortress.add(finial);
    fortress.traverse((part) => { if (part.isMesh) part.castShadow = true; });
    this.staticGroup.add(fortress);

    for (const spot of spots) {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.85, 0.85, 0.15, 20),
        new THREE.MeshStandardMaterial({ color: 0xe9bf6b, emissive: 0x65430f, roughness: 0.5 })
      );
      marker.position.copy(position(spot.x, spot.y, width, height, 0.08));
      marker.userData.spotId = spot.id;
      this.staticGroup.add(marker);
      this.markers.push(marker);
    }
  }

  pickSpot(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set((clientX - rect.left) / rect.width * 2 - 1,
      -(clientY - rect.top) / rect.height * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects(this.markers)[0]?.object.userData.spotId ?? null;
  }

  syncMeshes(items, meshes, create, elevation) {
    const active = new Set(items);
    for (const [item, mesh] of meshes) {
      if (!active.has(item)) {
        this.scene.remove(mesh);
        meshes.delete(item);
      }
    }
    for (const item of items) {
      let mesh = meshes.get(item);
      if (!mesh) {
        mesh = create(item);
        meshes.set(item, mesh);
        this.scene.add(mesh);
      }
      mesh.position.copy(position(item.x, item.y, this.width, this.height, elevation));
    }
  }

  render(spots, towers, enemies, projectiles, warriors, selectedSpot, selectedTower) {
    for (const marker of this.markers) {
      const spot = spots.find((item) => item.id === marker.userData.spotId);
      const selected = spot === selectedSpot;
      marker.material.color.setHex(selected ? 0xfff2a1 : spot?.tower ? 0x6a5940 : 0xe9bf6b);
      marker.material.emissive.setHex(selected ? 0x9d6e1f : spot?.tower ? 0x1b140a : 0x65430f);
    }
    this.syncMeshes(towers, this.towerMeshes, (tower) => {
      const group = new THREE.Group();
      const body = box(1.35, 2, 1.35, TOWER_COLORS[tower.type]);
      body.position.y = 1;
      body.castShadow = true;
      group.add(body);
      const roof = new THREE.Mesh(
        new THREE.ConeGeometry(1.25, 1.25, 4),
        new THREE.MeshStandardMaterial({ color: 0x40251c })
      );
      roof.position.y = 2.65;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = true;
      group.add(roof);
      return group;
    }, 0.12);
    for (const tower of towers) {
      const mesh = this.towerMeshes.get(tower);
      mesh.scale.setScalar(1.3 + (tower.level - 1) * 0.14);
      mesh.children[0].material.emissive.setHex(tower === selectedTower ? 0x62501b : 0x000000);
    }
    this.syncMeshes(enemies, this.enemyMeshes, () => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.57, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0xb34843, roughness: 0.45 })
      );
      mesh.castShadow = true;
      return mesh;
    }, 0.65);
    for (const enemy of enemies) {
      this.enemyMeshes.get(enemy).scale.y = Math.max(0.5, enemy.hp / enemy.maxHp);
    }
    this.syncMeshes(projectiles, this.projectileMeshes, (shot) => new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 8, 6),
      new THREE.MeshBasicMaterial({ color: TOWER_COLORS[shot.type] })
    ), 1.45);
    this.syncMeshes(warriors, this.warriorMeshes, () => new THREE.Mesh(
      new THREE.ConeGeometry(0.5, 1.3, 6),
      new THREE.MeshStandardMaterial({ color: 0x5c84cd })
    ), 0.7);
    this.renderer.render(this.scene, this.camera);
  }
}
