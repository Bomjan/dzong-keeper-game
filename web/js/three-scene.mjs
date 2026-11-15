import * as THREE from 'three';

const SCALE = 20;
const TOWER_COLORS = { archer: 0x415d44, cannon: 0x7c3d31, mage: 0x514668, guard: 0x344e68 };

function texture(name, repeatX = 1, repeatY = 1) {
  const map = new THREE.TextureLoader().load(`assets/materials/${name}.jpg`);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeatX, repeatY);
  map.anisotropy = 4;
  return map;
}

const materials = {
  grass: new THREE.MeshStandardMaterial({ map: texture('grass', 36, 36), color: 0x9cad8b, roughness: 1 }),
  stone: new THREE.MeshStandardMaterial({ map: texture('stone', 2, 2), color: 0xb5afa0, roughness: 1 }),
  road: new THREE.MeshStandardMaterial({ map: texture('stone'), color: 0x9d9280, roughness: 1, side: THREE.DoubleSide }),
  plaster: new THREE.MeshStandardMaterial({ map: texture('plaster'), color: 0xf2e8d2, roughness: 1 }),
  wood: new THREE.MeshStandardMaterial({ map: texture('wood'), color: 0x71472e, roughness: 0.88 }),
  roof: new THREE.MeshStandardMaterial({ map: texture('roof', 2, 2), color: 0x57483c, roughness: 0.95, side: THREE.DoubleSide }),
  ochre: new THREE.MeshStandardMaterial({ color: 0x923f2e, roughness: 0.95 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xb8995a, metalness: 0.3, roughness: 0.65 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x221d19, roughness: 0.9 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x334e39, roughness: 1 }),
  leavesLight: new THREE.MeshStandardMaterial({ color: 0x426247, roughness: 1 }),
};

function disposeMesh(group) {
  group.traverse((part) => {
    part.geometry?.dispose();
    if (part.material && !Object.values(materials).includes(part.material)) {
      part.material.dispose();
    }
  });
}

function position(x, y, width, height, elevation = 0) {
  return new THREE.Vector3((x - width / 2) / SCALE, elevation, (y - height / 2) / SCALE);
}

function box(width, height, depth, material) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material
  );
}

function taperedBlock(width, height, depth, material) {
  const geometry = new THREE.BoxGeometry(width, height, depth);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    if (vertices.getY(i) > 0) {
      vertices.setX(i, vertices.getX(i) * 0.94);
      vertices.setZ(i, vertices.getZ(i) * 0.94);
    }
  }
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, material);
}

function roof(width, depth, eaveHeight, rise) {
  const vertices = [];
  const uvs = [];
  function triangle(a, b, c) {
    vertices.push(...a, ...b, ...c);
    uvs.push(0, 0, 1, 0, 0.5, 1);
  }
  function quad(a, b, c, d) {
    triangle(a, b, c);
    triangle(a, c, d);
  }
  const left = [-width * 0.27, eaveHeight + rise, 0];
  const right = [width * 0.27, eaveHeight + rise, 0];
  quad([-width / 2, eaveHeight, depth / 2], [width / 2, eaveHeight, depth / 2], right, left);
  quad([width / 2, eaveHeight, -depth / 2], [-width / 2, eaveHeight, -depth / 2], left, right);
  triangle([-width / 2, eaveHeight, -depth / 2], [-width / 2, eaveHeight, depth / 2], left);
  triangle([width / 2, eaveHeight, depth / 2], [width / 2, eaveHeight, -depth / 2], right);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const group = new THREE.Group();
  group.add(box(width, 0.16, depth, materials.wood));
  group.children[0].position.y = eaveHeight - 0.08;
  group.add(box(width + 0.06, 0.05, depth + 0.06, materials.gold));
  group.children[1].position.y = eaveHeight - 0.17;
  const slopes = new THREE.Mesh(geometry, materials.roof);
  slopes.castShadow = true;
  group.add(slopes);
  return group;
}

function windowFrame(parent, x, y, z, rotation = 0) {
  const frame = new THREE.Group();
  const opening = box(0.63, 0.8, 0.06, materials.dark);
  frame.add(opening);
  for (const side of [-0.34, 0.34]) {
    const post = box(0.08, 0.95, 0.1, materials.wood);
    post.position.x = side;
    frame.add(post);
  }
  for (const height of [-0.48, 0, 0.48]) {
    const beam = box(0.76, 0.07, 0.1, height === -0.48 ? materials.gold : materials.wood);
    beam.position.y = height;
    frame.add(beam);
  }
  const mullion = box(0.05, 0.8, 0.1, materials.wood);
  frame.add(mullion);
  frame.position.set(x, y, z);
  frame.rotation.y = rotation;
  parent.add(frame);
}

function stoneRoad(path, width, height) {
  const vertices = [];
  const uvs = [];
  const samples = path.samples;
  for (let i = 0; i < samples.length - 1; i++) {
    const first = samples[i];
    const second = samples[i + 1];
    const length = Math.hypot(second.x - first.x, second.y - first.y) || 1;
    const offsetX = -(second.y - first.y) / length * 0.85 * SCALE;
    const offsetY = (second.x - first.x) / length * 0.85 * SCALE;
    const leftA = position(first.x + offsetX, first.y + offsetY, width, height, 0.02);
    const rightA = position(first.x - offsetX, first.y - offsetY, width, height, 0.02);
    const leftB = position(second.x + offsetX, second.y + offsetY, width, height, 0.02);
    const rightB = position(second.x - offsetX, second.y - offsetY, width, height, 0.02);
    vertices.push(...leftA.toArray(), ...rightA.toArray(), ...leftB.toArray(),
      ...rightA.toArray(), ...rightB.toArray(), ...leftB.toArray());
    const start = path.cumulative[i] / SCALE / 2;
    const end = path.cumulative[i + 1] / SCALE / 2;
    uvs.push(0, start, 1, start, 0, end, 1, start, 1, end, 0, end);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, materials.road);
  mesh.receiveShadow = true;
  return mesh;
}

function treeAt(x, z, size) {
  const tree = new THREE.Group();
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.07 * size, 0.19 * size, 4.1 * size, 9),
    materials.wood
  );
  trunk.position.y = 2.05 * size;
  trunk.castShadow = true;
  tree.add(trunk);
  for (let layer = 0; layer < 6; layer++) {
    const height = (0.95 + layer * 0.39) * size;
    const reach = (1.55 - layer * 0.17) * size;
    for (let branch = 0; branch < 5; branch++) {
      const angle = branch * Math.PI * 2 / 5 + layer * 0.27;
      const tip = new THREE.Vector3(Math.cos(angle) * reach, height - 0.27 * size,
        Math.sin(angle) * reach);
      const start = new THREE.Vector3(0, height + 0.17 * size, 0);
      const direction = tip.clone().sub(start);
      const needles = new THREE.Mesh(
        new THREE.ConeGeometry(0.31 * size, direction.length(), 5),
        (branch + layer) % 3 === 0 ? materials.leavesLight : materials.leaves
      );
      needles.position.copy(start).add(tip).multiplyScalar(0.5);
      needles.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      needles.castShadow = true;
      tree.add(needles);
    }
  }
  tree.position.set(x, 0, z);
  return tree;
}

function dzong() {
  const building = new THREE.Group();
  const courtyard = box(8.6, 0.25, 8.6, materials.stone);
  courtyard.position.y = 0.12;
  courtyard.receiveShadow = true;
  building.add(courtyard);

  for (const side of [-1, 1]) {
    const frontWall = box(8.1, 1.95, 0.58, materials.plaster);
    frontWall.position.set(0, 1.15, side * 3.9);
    building.add(frontWall);
    const sideWall = box(0.58, 1.95, 8.1, materials.plaster);
    sideWall.position.set(side * 3.9, 1.15, 0);
    building.add(sideWall);
    const bandX = box(8.15, 0.38, 0.62, materials.ochre);
    bandX.position.set(0, 2.12, side * 3.9);
    building.add(bandX);
    const bandZ = box(0.62, 0.38, 8.15, materials.ochre);
    bandZ.position.set(side * 3.9, 2.12, 0);
    building.add(bandZ);
  }
  const gate = box(1.2, 1.75, 0.08, materials.wood);
  gate.position.set(0, 0.93, 4.23);
  building.add(gate);
  const lintel = box(1.55, 0.25, 0.2, materials.gold);
  lintel.position.set(0, 1.9, 4.28);
  building.add(lintel);

  for (const side of [-1, 1]) {
    const frontGallery = box(7.6, 1.02, 0.46, materials.plaster);
    frontGallery.position.set(0, 2.9, side * 3.9);
    building.add(frontGallery);
    const sideGallery = box(0.46, 1.02, 7.6, materials.plaster);
    sideGallery.position.set(side * 3.9, 2.9, 0);
    building.add(sideGallery);
    for (const offset of [-2.7, -1.35, 0, 1.35, 2.7]) {
      windowFrame(building, offset, 2.95, side * 4.16, side === 1 ? 0 : Math.PI);
      windowFrame(building, side * 4.16, 2.95, offset,
        side === 1 ? Math.PI / 2 : -Math.PI / 2);
    }
    const frontEaves = roof(8.7, 1.8, 3.65, 0.48);
    frontEaves.position.z = side * 3.6;
    building.add(frontEaves);
    const sideEaves = roof(8.7, 1.8, 3.65, 0.48);
    sideEaves.rotation.y = Math.PI / 2;
    sideEaves.position.x = side * 3.6;
    building.add(sideEaves);
  }

  for (const x of [-3.55, 3.55]) {
    for (const z of [-3.55, 3.55]) {
      const corner = taperedBlock(1.35, 3.05, 1.35, materials.plaster);
      corner.position.set(x, 1.55, z);
      building.add(corner);
      const band = box(1.42, 0.35, 1.42, materials.ochre);
      band.position.set(x, 2.63, z);
      building.add(band);
      const cornerRoof = roof(2.1, 2.1, 3.25, 0.55);
      cornerRoof.position.set(x, 0, z);
      building.add(cornerRoof);
    }
  }

  const utse = taperedBlock(3.8, 4.8, 3.8, materials.plaster);
  utse.position.y = 2.4;
  building.add(utse);
  const redBand = box(3.9, 0.55, 3.9, materials.ochre);
  redBand.position.y = 3.42;
  building.add(redBand);
  const gallery = box(4.2, 1.2, 4.2, materials.wood);
  gallery.position.y = 4.48;
  building.add(gallery);
  for (const x of [-1.35, -0.45, 0.45, 1.35]) {
    windowFrame(building, x, 4.46, 2.14);
    windowFrame(building, x, 4.46, -2.14, Math.PI);
  }
  for (const z of [-1.35, -0.45, 0.45, 1.35]) {
    windowFrame(building, 2.14, 4.46, z, Math.PI / 2);
    windowFrame(building, -2.14, 4.46, z, -Math.PI / 2);
  }
  for (const x of [-1.8, -0.9, 0, 0.9, 1.8]) {
    for (const side of [-1, 1]) {
      const bracket = box(0.12, 0.3, 0.55, materials.wood);
      bracket.position.set(x, 5.02, side * 2.32);
      building.add(bracket);
    }
  }
  building.add(roof(5.45, 5.45, 5.25, 0.9));
  const upper = box(2.25, 1.18, 2.25, materials.plaster);
  upper.position.y = 6.28;
  building.add(upper);
  const upperBand = box(2.32, 0.24, 2.32, materials.ochre);
  upperBand.position.y = 6.68;
  building.add(upperBand);
  building.add(roof(3.3, 3.3, 7.0, 0.55));
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), materials.gold);
  finial.position.y = 7.6;
  building.add(finial);
  building.traverse((part) => { if (part.isMesh) part.castShadow = true; });
  return building;
}

export class DzongScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x9eaaa3);
    this.scene.fog = new THREE.Fog(0x9eaaa3, 65, 115);
    this.camera = new THREE.PerspectiveCamera(52, 1, 0.1, 180);
    this.camera.position.set(0, 17, 35);
    this.camera.lookAt(0, 1.5, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.45;
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
    this.scene.add(new THREE.HemisphereLight(0xdce7e4, 0x6b6556, 1.45));
    const sun = new THREE.DirectionalLight(0xffedcf, 3.1);
    sun.position.set(-17, 29, 13);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -35;
    sun.shadow.camera.right = 35;
    sun.shadow.camera.top = 35;
    sun.shadow.camera.bottom = -35;
    this.scene.add(sun);
  }

  resize(width, height, paths, spots) {
    this.width = width;
    this.height = height;
    this.camera.aspect = width / height;
    this.camera.fov = width < 700 ? 64 : 52;
    this.camera.position.set(0, width < 700 ? 25 : 17, width < 700 ? 46 : 35);
    this.camera.lookAt(0, 1.5, 0);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    disposeMesh(this.staticGroup);
    this.staticGroup.clear();
    this.markers = [];

    const ground = box(200, 0.35, 200, materials.grass);
    ground.position.y = -0.26;
    ground.receiveShadow = true;
    this.staticGroup.add(ground);
    for (const path of paths) this.staticGroup.add(stoneRoad(path, width, height));

    const fieldWidth = width / SCALE;
    const fieldDepth = height / SCALE;
    const grove = [];
    for (let index = 0; index < 36; index++) {
      const x = ((index * 37) % 101) / 101 - 0.5;
      const z = ((index * 61) % 97) / 97 - 0.5;
      if (Math.abs(x) < 0.16 || Math.abs(z) < 0.12) continue;
      grove.push([x, z, 0.48 + (index % 5) * 0.09]);
    }
    for (const [x, z, size] of grove) {
      this.staticGroup.add(treeAt(x * fieldWidth, z * fieldDepth, size));
    }
    const centralDzong = dzong();
    centralDzong.scale.setScalar(1.45);
    this.staticGroup.add(centralDzong);

    for (const spot of spots) {
      const marker = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 0.9, 0.12, 20),
        new THREE.MeshStandardMaterial({ map: materials.stone.map, color: 0xc5b89b, roughness: 1 })
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
        disposeMesh(mesh);
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
      marker.material.color.setHex(selected ? 0xe7d4a8 : spot?.tower ? 0x6d6659 : 0xb5aa91);
      marker.material.emissive.setHex(selected ? 0x483719 : spot?.tower ? 0x000000 : 0x18130b);
    }
    this.syncMeshes(towers, this.towerMeshes, (tower) => {
      const group = new THREE.Group();
      const foundation = box(1.85, 0.25, 1.85, materials.stone);
      foundation.position.y = 0.12;
      group.add(foundation);
      const body = box(1.35, 2.05, 1.35, materials.plaster);
      body.position.y = 1.18;
      body.castShadow = true;
      group.add(body);
      const band = box(1.4, 0.3, 1.4, materials.ochre);
      band.position.y = 1.9;
      group.add(band);
      windowFrame(group, 0, 1.5, 0.7);
      group.add(roof(2.25, 2.25, 2.38, 0.55));
      const banner = box(0.48, 0.78, 0.08,
        new THREE.MeshStandardMaterial({ color: TOWER_COLORS[tower.type], roughness: 1 }));
      banner.position.set(0.77, 1.35, 0.72);
      group.add(banner);
      return group;
    }, 0.12);
    for (const tower of towers) {
      const mesh = this.towerMeshes.get(tower);
      mesh.scale.setScalar(1 + (tower.level - 1) * 0.09);
      mesh.children[5].material.emissive.setHex(tower === selectedTower ? 0x44351e : 0x000000);
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
