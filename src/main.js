import * as THREE from "three";
import "./style.css";

const worldSize = 170;
const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();
const playerVelocity = new THREE.Vector3();

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050813);
scene.fog = new THREE.FogExp2(0x14121a, 0.012);

const camera = new THREE.PerspectiveCamera(
  62,
  window.innerWidth / window.innerHeight,
  0.1,
  450,
);
camera.position.set(0, 8, 14);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.06;
document.querySelector("#app").appendChild(renderer.domElement);

const ui = {
  healthFill: document.querySelector("#healthFill"),
  healthText: document.querySelector("#healthText"),
  captureFill: document.querySelector("#captureFill"),
  captureText: document.querySelector("#captureText"),
  piglinScore: document.querySelector("#piglinScore"),
  status: document.querySelector("#status"),
  capturePrompt: document.querySelector("#capturePrompt"),
};

const keys = new Map();
const game = {
  health: 100,
  capture: 0,
  piglinsDefeated: 0,
  won: false,
  lost: false,
  attackCooldown: 0,
  attackTimer: 0,
  cameraShake: 0,
  statusTimer: 0,
};

const materials = {
  sand: new THREE.MeshStandardMaterial({
    color: 0xc99754,
    roughness: 0.95,
    metalness: 0.02,
  }),
  sandDark: new THREE.MeshStandardMaterial({
    color: 0x9b6938,
    roughness: 1,
  }),
  rock: new THREE.MeshStandardMaterial({
    color: 0x8b7465,
    roughness: 0.98,
  }),
  spider: new THREE.MeshStandardMaterial({
    color: 0x141820,
    roughness: 0.82,
    metalness: 0.06,
  }),
  spiderHighlight: new THREE.MeshStandardMaterial({
    color: 0x233044,
    roughness: 0.75,
  }),
  rider: new THREE.MeshStandardMaterial({
    color: 0x2f7cff,
    roughness: 0.55,
  }),
  riderSkin: new THREE.MeshStandardMaterial({
    color: 0xc89162,
    roughness: 0.72,
  }),
  sword: new THREE.MeshStandardMaterial({
    color: 0x60f7ff,
    emissive: 0x1aa9b4,
    emissiveIntensity: 0.5,
    roughness: 0.18,
    metalness: 0.18,
  }),
  swordCore: new THREE.MeshStandardMaterial({
    color: 0xe9ffff,
    emissive: 0x87ffff,
    emissiveIntensity: 0.7,
    roughness: 0.22,
  }),
  gold: new THREE.MeshStandardMaterial({
    color: 0xe5b84f,
    roughness: 0.42,
    metalness: 0.25,
  }),
  piglin: new THREE.MeshStandardMaterial({
    color: 0xd17c77,
    roughness: 0.76,
  }),
  piglinCloth: new THREE.MeshStandardMaterial({
    color: 0x402b35,
    roughness: 0.84,
  }),
  gosha: new THREE.MeshStandardMaterial({
    color: 0x191224,
    roughness: 0.72,
    metalness: 0.08,
  }),
  goshaGlow: new THREE.MeshStandardMaterial({
    color: 0xa85bff,
    emissive: 0x6a22e4,
    emissiveIntensity: 0.9,
    roughness: 0.3,
  }),
};

let player;
let swordAnchor;
let mountGosha;
let captureRing;
let captureParticles;
const piglins = [];

setupLighting();
createSky();
createTerrain();
createOutposts();
player = createSpiderJockey();
scene.add(player);
mountGosha = createMountGosha();
scene.add(mountGosha);
captureRing = createCaptureRing();
scene.add(captureRing);
captureParticles = createCaptureParticles();
scene.add(captureParticles);
spawnPiglins();
resetGame();
window.__GOSHA_GAME_DEBUG__ = {
  state: () => ({
    player: {
      x: player.position.x,
      y: player.position.y,
      z: player.position.z,
    },
    mount: {
      x: mountGosha.position.x,
      y: mountGosha.position.y,
      z: mountGosha.position.z,
    },
    health: game.health,
    capture: game.capture,
    piglinsVisible: piglins.filter((piglin) => piglin.visible).length,
  }),
};

window.addEventListener("resize", onResize);
window.addEventListener("keydown", (event) => {
  keys.set(event.code, true);
  if (event.code === "Space") {
    event.preventDefault();
    swingSword();
  }
  if (event.code === "KeyR" && (game.lost || game.won)) {
    resetGame();
  }
});
window.addEventListener("keyup", (event) => keys.set(event.code, false));
window.addEventListener("pointerdown", swingSword);

animate();

function setupLighting() {
  const hemi = new THREE.HemisphereLight(0x8aa8ff, 0xd8a058, 1.55);
  scene.add(hemi);

  const sunA = new THREE.DirectionalLight(0xffd28c, 2.2);
  sunA.position.set(-38, 42, -22);
  sunA.castShadow = true;
  sunA.shadow.mapSize.set(2048, 2048);
  sunA.shadow.camera.left = -80;
  sunA.shadow.camera.right = 80;
  sunA.shadow.camera.top = 80;
  sunA.shadow.camera.bottom = -80;
  scene.add(sunA);

  const sunB = new THREE.PointLight(0xfff0bd, 2.8, 210);
  sunB.position.set(42, 28, -90);
  scene.add(sunB);
}

function createSky() {
  const starPositions = [];
  const starColors = [];
  const color = new THREE.Color();
  for (let i = 0; i < 1700; i += 1) {
    const radius = THREE.MathUtils.randFloat(120, 240);
    const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const y = THREE.MathUtils.randFloat(16, 160);
    starPositions.push(Math.cos(theta) * radius, y, Math.sin(theta) * radius);
    color.setHSL(THREE.MathUtils.randFloat(0.52, 0.68), 0.75, THREE.MathUtils.randFloat(0.74, 1));
    starColors.push(color.r, color.g, color.b);
  }

  const stars = new THREE.BufferGeometry();
  stars.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  stars.setAttribute("color", new THREE.Float32BufferAttribute(starColors, 3));
  const starField = new THREE.Points(
    stars,
    new THREE.PointsMaterial({
      size: 0.78,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.92,
    }),
  );
  scene.add(starField);

  const sunMaterialA = new THREE.MeshBasicMaterial({ color: 0xffdd8d });
  const sunMaterialB = new THREE.MeshBasicMaterial({ color: 0xfff6c8 });
  const sunOne = new THREE.Mesh(new THREE.SphereGeometry(5.8, 32, 16), sunMaterialA);
  sunOne.position.set(-55, 20, -125);
  scene.add(sunOne);

  const sunTwo = new THREE.Mesh(new THREE.SphereGeometry(3.8, 32, 16), sunMaterialB);
  sunTwo.position.set(-42, 26, -132);
  scene.add(sunTwo);

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(12, 48, 24),
    new THREE.MeshStandardMaterial({
      color: 0x7c9ccb,
      emissive: 0x1b2450,
      emissiveIntensity: 0.35,
      roughness: 0.7,
    }),
  );
  planet.position.set(72, 74, -142);
  scene.add(planet);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(15, 20, 64),
    new THREE.MeshBasicMaterial({
      color: 0xb7d1ff,
      transparent: true,
      opacity: 0.46,
      side: THREE.DoubleSide,
    }),
  );
  ring.position.copy(planet.position);
  ring.rotation.set(1.1, 0.22, 0.32);
  scene.add(ring);
}

function createTerrain() {
  const geometry = new THREE.PlaneGeometry(worldSize * 2.2, worldSize * 2.2, 150, 150);
  const position = geometry.attributes.position;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setZ(i, duneHeight(x, z));
  }

  geometry.computeVertexNormals();
  const ground = new THREE.Mesh(geometry, materials.sand);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  for (let i = 0; i < 42; i += 1) {
    const rock = new THREE.Mesh(
      new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(0.55, 2.3), 0),
      materials.rock,
    );
    const x = THREE.MathUtils.randFloatSpread(worldSize * 1.6);
    const z = THREE.MathUtils.randFloatSpread(worldSize * 1.6);
    if (Math.abs(x) < 12 && Math.abs(z) < 14) {
      i -= 1;
      continue;
    }
    rock.position.set(x, groundY(x, z) + 0.4, z);
    rock.scale.set(
      THREE.MathUtils.randFloat(0.7, 1.8),
      THREE.MathUtils.randFloat(0.35, 1.1),
      THREE.MathUtils.randFloat(0.7, 1.8),
    );
    rock.rotation.set(
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
    );
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }
}

function createOutposts() {
  const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0xb9b0a3,
    roughness: 0.86,
    metalness: 0.08,
  });
  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x27313d,
    roughness: 0.65,
    metalness: 0.35,
  });

  const points = [
    [-32, -28],
    [37, -48],
    [-61, 24],
    [58, 32],
  ];

  points.forEach(([x, z], index) => {
    const baseY = groundY(x, z);
    const group = new THREE.Group();
    group.position.set(x, baseY, z);
    group.rotation.y = index * 0.8;

    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 7.5, 10), towerMaterial);
    mast.position.y = 3.75;
    mast.castShadow = true;
    group.add(mast);

    const dish = new THREE.Mesh(new THREE.CylinderGeometry(1.55, 0.42, 0.38, 24), darkMetal);
    dish.position.set(0.95, 6.1, 0);
    dish.rotation.z = Math.PI / 2.65;
    dish.castShadow = true;
    group.add(dish);

    const legs = [
      [-0.8, 0, -0.8],
      [0.8, 0, -0.8],
      [-0.8, 0, 0.8],
      [0.8, 0, 0.8],
    ];
    legs.forEach((start) => {
      const leg = cylinderBetween(
        new THREE.Vector3(0, 2.2, 0),
        new THREE.Vector3(start[0], 0.2, start[2]),
        0.07,
        darkMetal,
      );
      group.add(leg);
    });

    scene.add(group);
  });
}

function createSpiderJockey() {
  const group = new THREE.Group();
  group.name = "Spider Jockey Player";

  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 16), materials.spider);
  abdomen.scale.set(1.2, 0.62, 1.45);
  abdomen.position.set(0, 1.15, 0.22);
  abdomen.castShadow = true;
  group.add(abdomen);

  const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 16), materials.spiderHighlight);
  thorax.scale.set(1.25, 0.72, 1.05);
  thorax.position.set(0, 1.25, -0.85);
  thorax.castShadow = true;
  group.add(thorax);

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x55fff7,
    emissive: 0x17bdb6,
    emissiveIntensity: 1,
  });
  [-0.26, 0.26].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 8), eyeMaterial);
    eye.position.set(x, 1.44, -1.48);
    group.add(eye);
  });

  const legZ = [-1.2, -0.55, 0.08, 0.74];
  legZ.forEach((z, index) => {
    group.add(createSpiderLeg(-1, z, index));
    group.add(createSpiderLeg(1, z, index + 4));
  });

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.16, 0.8), materials.gold);
  saddle.position.set(0, 1.68, -0.16);
  saddle.castShadow = true;
  group.add(saddle);

  const rider = new THREE.Group();
  rider.position.set(0, 1.88, -0.18);
  group.add(rider);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.32), materials.rider);
  torso.position.y = 0.38;
  torso.castShadow = true;
  rider.add(torso);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), materials.riderSkin);
  head.position.y = 1.0;
  head.castShadow = true;
  rider.add(head);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), materials.gold);
  helmet.position.y = 1.26;
  helmet.castShadow = true;
  rider.add(helmet);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.68, 0.18), materials.riderSkin);
  leftArm.position.set(-0.44, 0.36, 0.02);
  leftArm.rotation.z = -0.22;
  leftArm.castShadow = true;
  rider.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.42, 0.65, -0.03);
  rightArm.rotation.z = -0.42;
  rider.add(rightArm);

  const armMesh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), materials.riderSkin);
  armMesh.position.y = -0.3;
  armMesh.castShadow = true;
  rightArm.add(armMesh);

  swordAnchor = new THREE.Group();
  swordAnchor.position.set(0.1, -0.58, -0.02);
  swordAnchor.rotation.set(0.35, 0.05, -1.15);
  rightArm.add(swordAnchor);
  swordAnchor.add(createDiamondSword());

  group.userData.walkCycle = 0;
  group.userData.legs = group.children.filter((child) => child.userData.isLeg);
  return group;
}

function createSpiderLeg(side, z, index) {
  const group = new THREE.Group();
  group.userData.isLeg = true;
  group.userData.index = index;
  group.position.set(side * 0.62, 1.05, z);

  const knee = new THREE.Vector3(side * 0.68, -0.34, z < -0.8 ? -0.28 : 0.02);
  const foot = new THREE.Vector3(side * 1.2, -0.92, z < -0.6 ? -0.42 : 0.16);
  group.add(cylinderBetween(new THREE.Vector3(0, 0, 0), knee, 0.075, materials.spider));
  group.add(cylinderBetween(knee, foot, 0.065, materials.spider));

  const claw = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 6), materials.spiderHighlight);
  claw.position.copy(foot);
  claw.castShadow = true;
  group.add(claw);

  return group;
}

function createDiamondSword() {
  const sword = new THREE.Group();
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.62, 0.1), materials.gold);
  grip.position.y = 0.18;
  grip.castShadow = true;
  sword.add(grip);

  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.1, 0.16), materials.swordCore);
  guard.position.y = 0.5;
  guard.castShadow = true;
  sword.add(guard);

  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 1.24, 0.12), materials.sword);
  blade.position.y = 1.14;
  blade.castShadow = true;
  sword.add(blade);

  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.34, 4), materials.swordCore);
  tip.position.y = 1.91;
  tip.rotation.y = Math.PI / 4;
  tip.castShadow = true;
  sword.add(tip);

  return sword;
}

function createMountGosha() {
  const group = new THREE.Group();
  group.name = "Evil Mount Gosha";
  group.position.set(8, 0, -74);

  const body = new THREE.Mesh(new THREE.SphereGeometry(2.3, 32, 18), materials.gosha);
  body.scale.set(1.55, 0.9, 2.15);
  body.position.y = 2.05;
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(1.45, 28, 16), materials.gosha);
  chest.scale.set(1.05, 1.1, 1.15);
  chest.position.set(0, 2.28, -2.45);
  chest.castShadow = true;
  group.add(chest);

  const head = new THREE.Mesh(new THREE.BoxGeometry(1.55, 1.24, 1.5), materials.gosha);
  head.position.set(0, 3.04, -3.55);
  head.castShadow = true;
  group.add(head);

  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff4bdf,
    emissive: 0xff1fbf,
    emissiveIntensity: 1.6,
  });
  [-0.38, 0.38].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), eyeMat);
    eye.position.set(x, 3.2, -4.33);
    group.add(eye);
  });

  [-0.78, 0.78].forEach((x) => {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.16, 1.35, 12), materials.goshaGlow);
    horn.position.set(x, 3.56, -3.98);
    horn.rotation.x = -0.7;
    horn.rotation.z = x > 0 ? -0.46 : 0.46;
    horn.castShadow = true;
    group.add(horn);
  });

  [-1.25, 1.25].forEach((x) => {
    [-1.3, 1.15].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 1.8, 12), materials.gosha);
      leg.position.set(x, 0.94, z);
      leg.castShadow = true;
      group.add(leg);
    });
  });

  for (let i = 0; i < 5; i += 1) {
    const crystal = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.9, 5), materials.goshaGlow);
    crystal.position.set(THREE.MathUtils.randFloat(-0.9, 0.9), 3.0 + i * 0.14, -0.8 + i * 0.58);
    crystal.rotation.x = THREE.MathUtils.randFloat(-0.36, 0.36);
    crystal.rotation.z = THREE.MathUtils.randFloat(-0.42, 0.42);
    crystal.castShadow = true;
    group.add(crystal);
  }

  group.userData.base = group.position.clone();
  return group;
}

function createCaptureRing() {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(5.35, 0.075, 10, 96),
    new THREE.MeshStandardMaterial({
      color: 0x6df6ff,
      emissive: 0x2cdde8,
      emissiveIntensity: 1.4,
      transparent: true,
      opacity: 0.75,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.copy(mountGosha.position);
  ring.position.y = groundY(mountGosha.position.x, mountGosha.position.z) + 0.16;
  return ring;
}

function createCaptureParticles() {
  const positions = [];
  for (let i = 0; i < 84; i += 1) {
    const angle = (i / 84) * Math.PI * 2;
    const radius = THREE.MathUtils.randFloat(4.8, 5.8);
    positions.push(Math.cos(angle) * radius, THREE.MathUtils.randFloat(0.1, 2.8), Math.sin(angle) * radius);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  const particles = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      color: 0x79f7ff,
      size: 0.12,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    }),
  );
  particles.position.copy(mountGosha.position);
  particles.position.y = groundY(mountGosha.position.x, mountGosha.position.z);
  return particles;
}

function createPiglin(index, x, z) {
  const group = new THREE.Group();
  group.name = `Piglin Blocker ${index + 1}`;
  group.position.set(x, groundY(x, z), z);

  const body = new THREE.Mesh(new THREE.BoxGeometry(0.78, 1.08, 0.48), materials.piglinCloth);
  body.position.y = 1.04;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.66, 0.64), materials.piglin);
  head.position.y = 1.85;
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.22, 0.18), materials.piglin);
  snout.position.set(0, 1.78, -0.42);
  snout.castShadow = true;
  group.add(snout);

  [-0.26, 0.26].forEach((xPos) => {
    const ear = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.28, 0.08), materials.piglin);
    ear.position.set(xPos, 2.1, -0.14);
    ear.rotation.z = xPos > 0 ? -0.28 : 0.28;
    ear.castShadow = true;
    group.add(ear);
  });

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.16, 0.54), materials.gold);
  belt.position.y = 0.72;
  belt.castShadow = true;
  group.add(belt);

  const weapon = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.35, 0.12), materials.gold);
  weapon.position.set(0.58, 1.12, -0.1);
  weapon.rotation.z = -0.24;
  weapon.castShadow = true;
  group.add(weapon);

  [-0.22, 0.22].forEach((xPos) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.72, 0.22), materials.piglin);
    leg.position.set(xPos, 0.34, 0);
    leg.castShadow = true;
    group.add(leg);
  });

  group.userData = {
    spawn: new THREE.Vector3(x, 0, z),
    velocity: new THREE.Vector3(),
    health: 2,
    stun: 0,
    respawn: 0,
    attackCooldown: THREE.MathUtils.randFloat(0.1, 1.2),
    speed: THREE.MathUtils.randFloat(3.0, 4.4),
  };
  return group;
}

function spawnPiglins() {
  const spawns = [
    [-13, -29],
    [19, -37],
    [-27, -55],
    [37, -65],
    [5, -48],
    [-44, -18],
    [42, -22],
    [-10, -75],
  ];

  spawns.forEach(([x, z], index) => {
    const piglin = createPiglin(index, x, z);
    piglins.push(piglin);
    scene.add(piglin);
  });
}

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);
  const elapsed = clock.elapsedTime;

  if (!game.lost && !game.won) {
    updatePlayer(delta);
    updatePiglins(delta);
    updateCapture(delta);
  } else {
    updateIdlePlayer(delta);
  }

  updateMount(elapsed);
  updateCamera(delta, elapsed);
  updateHud(delta);
  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  const move = tempVec.set(0, 0, 0);
  if (keys.get("KeyW") || keys.get("ArrowUp")) move.z -= 1;
  if (keys.get("KeyS") || keys.get("ArrowDown")) move.z += 1;
  if (keys.get("KeyA") || keys.get("ArrowLeft")) move.x -= 1;
  if (keys.get("KeyD") || keys.get("ArrowRight")) move.x += 1;

  const hasMovement = move.lengthSq() > 0;
  if (hasMovement) {
    move.normalize();
    const speed = keys.get("ShiftLeft") || keys.get("ShiftRight") ? 14 : 9.2;
    playerVelocity.lerp(move.multiplyScalar(speed), 0.16);
    player.rotation.y = Math.atan2(playerVelocity.x, playerVelocity.z);
    player.userData.walkCycle += delta * playerVelocity.length() * 1.4;
  } else {
    playerVelocity.lerp(tempVec.set(0, 0, 0), 0.16);
  }

  player.position.addScaledVector(playerVelocity, delta);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -worldSize + 10, worldSize - 10);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -worldSize + 10, worldSize - 10);
  player.position.y = groundY(player.position.x, player.position.z);

  const bob = Math.sin(player.userData.walkCycle * 2) * Math.min(playerVelocity.length() / 9, 1) * 0.07;
  player.children[0].position.y = 1.15 + bob;
  player.children[1].position.y = 1.25 + bob * 0.7;

  player.userData.legs.forEach((leg) => {
    const phase = player.userData.walkCycle + leg.userData.index * 0.85;
    const side = leg.position.x > 0 ? 1 : -1;
    leg.rotation.z = side * (0.06 + Math.sin(phase) * 0.13);
    leg.rotation.x = Math.cos(phase) * 0.08;
  });

  game.attackCooldown = Math.max(0, game.attackCooldown - delta);
  if (game.attackTimer > 0) {
    game.attackTimer = Math.max(0, game.attackTimer - delta);
    const t = 1 - game.attackTimer / 0.36;
    const swing = Math.sin(t * Math.PI);
    swordAnchor.rotation.z = -1.15 - swing * 1.75;
    swordAnchor.rotation.x = 0.3 + swing * 0.68;
  } else {
    swordAnchor.rotation.z = THREE.MathUtils.lerp(swordAnchor.rotation.z, -1.15, 0.14);
    swordAnchor.rotation.x = THREE.MathUtils.lerp(swordAnchor.rotation.x, 0.35, 0.14);
  }
}

function updateIdlePlayer(delta) {
  player.userData.walkCycle += delta * 1.2;
  player.userData.legs.forEach((leg) => {
    const side = leg.position.x > 0 ? 1 : -1;
    leg.rotation.z = side * (0.06 + Math.sin(player.userData.walkCycle + leg.userData.index) * 0.035);
  });
}

function updatePiglins(delta) {
  piglins.forEach((piglin, index) => {
    const data = piglin.userData;

    if (data.respawn > 0) {
      data.respawn -= delta;
      if (data.respawn <= 0) {
        const spawn = data.spawn;
        piglin.position.set(spawn.x, groundY(spawn.x, spawn.z), spawn.z);
        piglin.visible = true;
        data.health = 2;
      }
      return;
    }

    data.attackCooldown = Math.max(0, data.attackCooldown - delta);

    const toPlayer = player.position.clone().sub(piglin.position);
    const distance = toPlayer.length();

    if (data.stun > 0) {
      data.stun -= delta;
      piglin.position.addScaledVector(data.velocity, delta);
      data.velocity.multiplyScalar(0.91);
    } else if (distance < 78) {
      toPlayer.y = 0;
      toPlayer.normalize();
      const speed = data.speed * (distance < 18 ? 1.15 : 1);
      piglin.position.addScaledVector(toPlayer, speed * delta);
      piglin.rotation.y = Math.atan2(toPlayer.x, toPlayer.z);

      if (distance < 2.1 && data.attackCooldown <= 0) {
        damagePlayer(8 + Math.floor(index % 3), "A piglin blocked the charge.");
        data.attackCooldown = 1.05;
        data.velocity.copy(toPlayer).multiplyScalar(-3);
        data.stun = 0.14;
      }
    } else {
      const home = data.spawn.clone().sub(piglin.position);
      if (home.lengthSq() > 8) {
        home.y = 0;
        home.normalize();
        piglin.position.addScaledVector(home, data.speed * 0.4 * delta);
        piglin.rotation.y = Math.atan2(home.x, home.z);
      }
    }

    piglin.position.x = THREE.MathUtils.clamp(piglin.position.x, -worldSize + 8, worldSize - 8);
    piglin.position.z = THREE.MathUtils.clamp(piglin.position.z, -worldSize + 8, worldSize - 8);
    piglin.position.y = groundY(piglin.position.x, piglin.position.z);

    const stride = clock.elapsedTime * 6 + index;
    piglin.children.forEach((child, childIndex) => {
      if (childIndex >= piglin.children.length - 2) {
        child.rotation.x = Math.sin(stride + childIndex * Math.PI) * 0.18;
      }
    });
  });
}

function updateCapture(delta) {
  const flatPlayer = player.position.clone();
  flatPlayer.y = 0;
  const flatGosha = mountGosha.position.clone();
  flatGosha.y = 0;
  const distance = flatPlayer.distanceTo(flatGosha);
  const nearGosha = distance < 5.8;
  const blockers = piglins.filter(
    (piglin) => piglin.visible && piglin.position.distanceTo(player.position) < 4.6,
  ).length;

  ui.capturePrompt.classList.toggle("visible", nearGosha && !game.won);

  if (nearGosha && keys.get("KeyE") && blockers === 0) {
    game.capture = Math.min(100, game.capture + delta * 21);
    setStatus("Mount Gosha is weakening.");
  } else if (nearGosha && keys.get("KeyE") && blockers > 0) {
    game.capture = Math.max(0, game.capture - delta * 5);
    setStatus("Piglins are breaking the capture circle.");
  } else if (!nearGosha) {
    game.capture = Math.max(0, game.capture - delta * 2.5);
  }

  if (game.capture >= 100 && !game.won) {
    game.won = true;
    setStatus("Mount Gosha captured. The spider jockeys own the dune route.", 20);
    mountGosha.children.forEach((child) => {
      if (child.material?.emissive) {
        child.material.emissive.setHex(0x14f7ff);
      }
    });
  }
}

function updateMount(elapsed) {
  const base = mountGosha.userData.base;
  mountGosha.position.x = base.x + Math.sin(elapsed * 0.42) * 2.4;
  mountGosha.position.z = base.z + Math.cos(elapsed * 0.35) * 1.5;
  mountGosha.position.y = groundY(mountGosha.position.x, mountGosha.position.z);
  mountGosha.rotation.y = Math.sin(elapsed * 0.5) * 0.22;
  mountGosha.position.y += Math.sin(elapsed * 1.6) * 0.07;

  captureRing.position.set(
    mountGosha.position.x,
    groundY(mountGosha.position.x, mountGosha.position.z) + 0.16,
    mountGosha.position.z,
  );
  captureRing.rotation.z += 0.45 * clock.getDelta();
  captureRing.material.opacity = 0.52 + Math.sin(elapsed * 3) * 0.16;

  captureParticles.position.copy(captureRing.position);
  captureParticles.position.y += 0.1;
  captureParticles.rotation.y -= 0.25 * clock.getDelta();
}

function updateCamera(delta, elapsed) {
  const cameraOffset = new THREE.Vector3(0, 5.8, -10.8).applyAxisAngle(
    new THREE.Vector3(0, 1, 0),
    player.rotation.y,
  );
  const desired = player.position.clone().add(cameraOffset);
  desired.y = Math.max(desired.y, groundY(desired.x, desired.z) + 3.2);

  if (game.cameraShake > 0) {
    game.cameraShake = Math.max(0, game.cameraShake - delta);
    const shake = game.cameraShake * 0.4;
    desired.x += Math.sin(elapsed * 62) * shake;
    desired.y += Math.cos(elapsed * 71) * shake;
  }

  camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
  const lookAt = player.position.clone().add(new THREE.Vector3(0, 1.8, 0));
  camera.lookAt(lookAt);
}

function updateHud(delta) {
  game.statusTimer = Math.max(0, game.statusTimer - delta);
  if (game.statusTimer <= 0 && !game.won && !game.lost) {
    const distance = player.position.distanceTo(mountGosha.position);
    if (distance < 9) {
      ui.status.textContent = "Mount Gosha is inside the capture circle.";
    } else if (distance < 28) {
      ui.status.textContent = "The evil mount is close.";
    } else {
      ui.status.textContent = "Find the evil mount beyond the dunes.";
    }
  }

  ui.healthFill.style.width = `${game.health}%`;
  ui.healthText.textContent = `${Math.round(game.health)}`;
  ui.captureFill.style.width = `${game.capture}%`;
  ui.captureText.textContent = `${Math.round(game.capture)}%`;
  ui.piglinScore.textContent = `${game.piglinsDefeated}`;
}

function swingSword() {
  if (game.lost || game.won || game.attackCooldown > 0) return;

  game.attackCooldown = 0.54;
  game.attackTimer = 0.36;
  let hit = false;

  piglins.forEach((piglin) => {
    const data = piglin.userData;
    if (!piglin.visible || data.respawn > 0) return;

    const distance = piglin.position.distanceTo(player.position);
    if (distance > 3.7) return;

    const hitDir = piglin.position.clone().sub(player.position);
    hitDir.y = 0;
    hitDir.normalize();
    data.health -= 1;
    data.stun = 0.75;
    data.velocity.copy(hitDir).multiplyScalar(8.5);
    hit = true;

    if (data.health <= 0) {
      piglin.visible = false;
      data.respawn = 6.4;
      game.piglinsDefeated += 1;
      setStatus("Piglin knocked out of the dune path.");
    }
  });

  if (hit) {
    game.cameraShake = Math.max(game.cameraShake, 0.08);
  }
}

function damagePlayer(amount, message) {
  if (game.lost || game.won) return;
  game.health = Math.max(0, game.health - amount);
  game.cameraShake = Math.max(game.cameraShake, 0.22);
  setStatus(message);

  if (game.health <= 0) {
    game.lost = true;
    setStatus("Spider jockeys down. Remount to try again.", 30);
  }
}

function setStatus(message, duration = 2.3) {
  ui.status.textContent = message;
  game.statusTimer = duration;
}

function resetGame() {
  game.health = 100;
  game.capture = 0;
  game.piglinsDefeated = 0;
  game.won = false;
  game.lost = false;
  game.attackCooldown = 0;
  game.attackTimer = 0;
  game.cameraShake = 0;
  player.position.set(0, groundY(0, 8), 8);
  player.rotation.y = Math.PI;
  playerVelocity.set(0, 0, 0);
  mountGosha.userData.base.set(8, 0, -74);

  piglins.forEach((piglin) => {
    const spawn = piglin.userData.spawn;
    piglin.position.set(spawn.x, groundY(spawn.x, spawn.z), spawn.z);
    piglin.visible = true;
    piglin.userData.health = 2;
    piglin.userData.stun = 0;
    piglin.userData.respawn = 0;
    piglin.userData.velocity.set(0, 0, 0);
  });

  setStatus("Find the evil mount beyond the dunes.", 3);
  updateHud(0);
}

function cylinderBetween(start, end, radius, material) {
  const direction = end.clone().sub(start);
  const length = direction.length();
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = true;
  return mesh;
}

function duneHeight(x, z) {
  const longWave = Math.sin(x * 0.035 + z * 0.018) * 1.4;
  const crossWave = Math.cos(z * 0.044 - x * 0.02) * 0.9;
  const ripples = Math.sin((x + z) * 0.16) * 0.14;
  const ridge = Math.max(0, 1 - Math.abs(z + 68) / 42) * Math.sin(x * 0.08) * 1.4;
  return longWave + crossWave + ripples + ridge - 1.2;
}

function groundY(x, z) {
  return duneHeight(x, z);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
