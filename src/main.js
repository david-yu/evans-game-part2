import * as THREE from "three";
import "./style.css";

const worldSize = 170;
const clock = new THREE.Clock();
const tempVec = new THREE.Vector3();
const tempVec2 = new THREE.Vector3();
const tempVec3 = new THREE.Vector3();
const playerVelocity = new THREE.Vector3();
const shipVelocity = new THREE.Vector3();
const yAxis = new THREE.Vector3(0, 1, 0);
const rocketHome = new THREE.Vector3(-24, 0, -9);
const destinationPlanetPosition = new THREE.Vector3(0, 62, -250);
const originalPlanetPosition = new THREE.Vector3(0, 54, 230);
const cameraTurnHoldSeconds = 2.2;

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

const textureLoader = new THREE.TextureLoader();
const pokeballTexture = textureLoader.load(`${import.meta.env.BASE_URL}pokeball.avif`);
pokeballTexture.colorSpace = THREE.SRGBColorSpace;

const ui = {
  healthFill: document.querySelector("#healthFill"),
  healthText: document.querySelector("#healthText"),
  captureFill: document.querySelector("#captureFill"),
  captureText: document.querySelector("#captureText"),
  piglinScore: document.querySelector("#piglinScore"),
  pokeballScore: document.querySelector("#pokeballScore"),
  status: document.querySelector("#status"),
  capturePrompt: document.querySelector("#capturePrompt"),
  rocketPrompt: document.querySelector("#rocketPrompt"),
  goshaIndicator: document.querySelector("#goshaIndicator"),
  goshaArrow: document.querySelector("#goshaArrow"),
  targetLabel: document.querySelector("#targetLabel"),
  goshaDistance: document.querySelector("#goshaDistance"),
  missionEyebrow: document.querySelector("#missionEyebrow"),
  missionTitle: document.querySelector("#missionTitle"),
  restartButton: document.querySelector("#restartButton"),
  combatFeedback: document.querySelector("#combatFeedback"),
  blockFlash: document.querySelector("#blockFlash"),
};

const keys = new Map();
const game = {
  health: 100,
  capture: 0,
  piglinsDefeated: 0,
  pokeballsCollected: 0,
  chickensEaten: 0,
  won: false,
  lost: false,
  escaped: false,
  phase: "desert",
  attackCooldown: 0,
  attackTimer: 0,
  cameraShake: 0,
  statusTimer: 0,
  launchTimer: 0,
  danceTimer: 0,
  rocketFlame: 0,
  targetYaw: 0,
  cameraYaw: 0,
  cameraTurnHold: 0,
  maxLegLift: 0,
  blockFlashTimer: 0,
  lastBlockTime: 0,
  hazardCooldown: 0,
  flightTarget: "planet",
  launchOrigin: "desert",
  chickenPassenger: false,
  returnedChicken: false,
  lavaSpewCount: 0,
  dragonActive: false,
  dragonFireTimer: 0,
  chickensScorched: 0,
  capturePokemonSpawned: false,
  capturePokemonCaptured: false,
  companionCapturePower: 0,
  spaceShotCooldown: 0,
  asteroidSpawnTimer: 0,
  asteroidsDestroyed: 0,
  lastAsteroidHitTime: 0,
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
  growlitheFur: new THREE.MeshStandardMaterial({
    color: 0xd27938,
    roughness: 0.92,
  }),
  growlitheFurDark: new THREE.MeshStandardMaterial({
    color: 0xa14927,
    roughness: 0.94,
  }),
  growlitheCream: new THREE.MeshStandardMaterial({
    color: 0xf3dfb6,
    roughness: 0.96,
  }),
  growlitheCreamShade: new THREE.MeshStandardMaterial({
    color: 0xdac290,
    roughness: 0.98,
  }),
  growlitheStripe: new THREE.MeshStandardMaterial({
    color: 0x1c2934,
    roughness: 0.74,
  }),
  growlitheNose: new THREE.MeshStandardMaterial({
    color: 0x1d242c,
    roughness: 0.45,
    metalness: 0.08,
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
  swordTrail: new THREE.MeshBasicMaterial({
    color: 0x94ffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  impact: new THREE.MeshBasicMaterial({
    color: 0xb6ffff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }),
  rocketWhite: new THREE.MeshStandardMaterial({
    color: 0xf4f0df,
    roughness: 0.36,
    metalness: 0.16,
  }),
  rocketRed: new THREE.MeshStandardMaterial({
    color: 0xbd2d3a,
    roughness: 0.5,
    metalness: 0.1,
  }),
  rocketGlass: new THREE.MeshStandardMaterial({
    color: 0x7de7ff,
    emissive: 0x1f8fb0,
    emissiveIntensity: 0.45,
    roughness: 0.18,
    metalness: 0.2,
  }),
  rocketFlame: new THREE.MeshBasicMaterial({
    color: 0xffc547,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
  rocketFlameCore: new THREE.MeshBasicMaterial({
    color: 0xfff4a8,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
  rocketFlameBlue: new THREE.MeshBasicMaterial({
    color: 0x7ce7ff,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
  shield: new THREE.MeshStandardMaterial({
    color: 0x245f8f,
    emissive: 0x082b44,
    emissiveIntensity: 0.2,
    roughness: 0.42,
    metalness: 0.5,
  }),
  shieldSpike: new THREE.MeshStandardMaterial({
    color: 0xf0fcff,
    emissive: 0x64d7f2,
    emissiveIntensity: 0.45,
    roughness: 0.24,
    metalness: 0.62,
  }),
  planetGround: new THREE.MeshStandardMaterial({
    color: 0x3aa879,
    roughness: 0.88,
    metalness: 0.02,
  }),
  planetGroundDark: new THREE.MeshStandardMaterial({
    color: 0x28655f,
    roughness: 0.9,
  }),
  planetGlow: new THREE.MeshStandardMaterial({
    color: 0x65d8b9,
    emissive: 0x1d766a,
    emissiveIntensity: 0.55,
    roughness: 0.42,
  }),
  chickenBody: new THREE.MeshStandardMaterial({
    color: 0xf3f0dd,
    roughness: 0.78,
  }),
  chickenWing: new THREE.MeshStandardMaterial({
    color: 0xd9d0ae,
    roughness: 0.84,
  }),
  chickenComb: new THREE.MeshStandardMaterial({
    color: 0xd63838,
    roughness: 0.7,
  }),
  chickenBeak: new THREE.MeshStandardMaterial({
    color: 0xf0b13b,
    roughness: 0.64,
  }),
  lava: new THREE.MeshStandardMaterial({
    color: 0xff5b18,
    emissive: 0xff2a00,
    emissiveIntensity: 1.45,
    roughness: 0.38,
  }),
  lavaCore: new THREE.MeshBasicMaterial({
    color: 0xfff06b,
    transparent: true,
    opacity: 0.72,
  }),
  volcanoRock: new THREE.MeshStandardMaterial({
    color: 0x2b2930,
    roughness: 0.96,
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
  dragonRed: new THREE.MeshStandardMaterial({
    color: 0xb62222,
    emissive: 0x4f0808,
    emissiveIntensity: 0.34,
    roughness: 0.52,
    metalness: 0.08,
  }),
  dragonBelly: new THREE.MeshStandardMaterial({
    color: 0xffa25b,
    emissive: 0x5f1c07,
    emissiveIntensity: 0.42,
    roughness: 0.58,
  }),
  dragonWing: new THREE.MeshStandardMaterial({
    color: 0x8c1018,
    emissive: 0x3a0305,
    emissiveIntensity: 0.45,
    roughness: 0.45,
    side: THREE.DoubleSide,
  }),
  dragonEye: new THREE.MeshBasicMaterial({
    color: 0xfff27a,
  }),
  fireball: new THREE.MeshBasicMaterial({
    color: 0xff661d,
    transparent: true,
    opacity: 0.92,
    depthWrite: false,
  }),
  fireballCore: new THREE.MeshBasicMaterial({
    color: 0xfff1a3,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  }),
  firebird: new THREE.MeshStandardMaterial({
    color: 0xf4c64f,
    emissive: 0xd94c11,
    emissiveIntensity: 0.55,
    roughness: 0.42,
  }),
  firebirdShade: new THREE.MeshStandardMaterial({
    color: 0xd99425,
    emissive: 0x713000,
    emissiveIntensity: 0.32,
    roughness: 0.56,
  }),
  firebirdWing: new THREE.MeshBasicMaterial({
    color: 0xffc45a,
    transparent: true,
    opacity: 0.84,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  firebirdFlame: new THREE.MeshBasicMaterial({
    color: 0xff3d18,
    transparent: true,
    opacity: 0.88,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  firebirdFlameHot: new THREE.MeshBasicMaterial({
    color: 0xffef87,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
    depthWrite: false,
  }),
  firebirdTalon: new THREE.MeshStandardMaterial({
    color: 0x6e4631,
    roughness: 0.62,
    metalness: 0.12,
  }),
  capturePokemon: new THREE.MeshStandardMaterial({
    color: 0x8de7ff,
    emissive: 0x1d8ac9,
    emissiveIntensity: 0.55,
    roughness: 0.36,
  }),
  capturePokemonBelly: new THREE.MeshStandardMaterial({
    color: 0xfff3b7,
    emissive: 0x7b4b18,
    emissiveIntensity: 0.28,
    roughness: 0.58,
  }),
  captureSpark: new THREE.MeshBasicMaterial({
    color: 0x97ffb3,
    transparent: true,
    opacity: 0.88,
    depthWrite: false,
  }),
  asteroidSurface: new THREE.MeshStandardMaterial({
    color: 0xaaa196,
    roughness: 1,
    metalness: 0.02,
    flatShading: true,
    vertexColors: true,
  }),
  asteroidCrater: new THREE.MeshStandardMaterial({
    color: 0x343a43,
    roughness: 1,
    metalness: 0.01,
    side: THREE.DoubleSide,
  }),
  asteroidRim: new THREE.MeshStandardMaterial({
    color: 0xb1a18d,
    roughness: 0.96,
    metalness: 0.02,
    flatShading: true,
  }),
  asteroidShadow: new THREE.MeshStandardMaterial({
    color: 0x566170,
    roughness: 1,
    metalness: 0.02,
    flatShading: true,
  }),
  spaceShot: new THREE.MeshBasicMaterial({
    color: 0x49d7ff,
    transparent: true,
    opacity: 0.86,
    depthWrite: false,
  }),
  spaceShotCore: new THREE.MeshBasicMaterial({
    color: 0xf2ffff,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
  }),
};

let player;
let swordAnchor;
let swordTrail;
let mountGosha;
let captureRing;
let captureParticles;
let rocket;
let rocketFlame;
let destinationPlanet;
let originalPlanet;
let planetSurface;
let desertChicken;
let rocketChickenPassenger;
let redDragon;
let capturePokemon;
const piglins = [];
const chickens = [];
const lavaRivers = [];
const volcanoes = [];
const rocks = [];
const desertObjects = [];
const planetObjects = [];
const impactBursts = [];
const smokePuffs = [];
const damageNumbers = [];
const lavaBombs = [];
const dragonFireballs = [];
const firebirds = [];
const pokeballs = [];
const asteroids = [];
const spaceShots = [];
let playerVerticalVelocity = 0;

setupLighting();
createSky();
createTerrain();
createOutposts();
rocket = createRocket();
scene.add(rocket);
destinationPlanet = createDestinationPlanet();
scene.add(destinationPlanet);
originalPlanet = createOriginalPlanet();
scene.add(originalPlanet);
planetSurface = createPlanetSurface();
scene.add(planetSurface);
desertChicken = createChicken(101);
desertChicken.name = "Returned Desert Chicken";
desertChicken.visible = false;
scene.add(desertChicken);
player = createGrowlitheJockey();
scene.add(player);
capturePokemon = createCapturePokemon();
capturePokemon.visible = false;
scene.add(capturePokemon);
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
    playerYaw: player.rotation.y,
    targetYaw: game.targetYaw,
    cameraYaw: game.cameraYaw,
    cameraTurnHold: game.cameraTurnHold,
    playerFacingCameraAngle: normalizeAngle(player.rotation.y - game.cameraYaw),
    maxLegLift: game.maxLegLift,
    playerVisible: player.visible,
    mount: {
      x: mountGosha.position.x,
      y: mountGosha.position.y,
      z: mountGosha.position.z,
    },
    rocket: {
      x: rocket.position.x,
      y: rocket.position.y,
      z: rocket.position.z,
      visible: rocket.visible,
    },
    rocketFlameVisible: Boolean(rocketFlame?.visible),
    rocketFlamePower: rocketFlame?.userData.power || 0,
    smokePuffs: smokePuffs.length,
    lavaBombs: lavaBombs.length,
    lavaSpewCount: game.lavaSpewCount,
    lavaFlowBands: lavaRivers.reduce((sum, river) => sum + river.userData.flowBands.length, 0),
    flightTarget: game.flightTarget,
    launchOrigin: game.launchOrigin,
    chickenPassenger: game.chickenPassenger,
    returnedChicken: game.returnedChicken,
    desertChickenVisible: Boolean(desertChicken?.visible),
    blockFlashActive: game.blockFlashTimer > 0,
    lastBlockTime: game.lastBlockTime,
    damageNumbers: damageNumbers.length,
    phase: game.phase,
    escaped: game.escaped,
    health: game.health,
    capture: game.capture,
    won: game.won,
    danceTimer: game.danceTimer,
    piglinsDefeated: game.piglinsDefeated,
    pokeballsCollected: game.pokeballsCollected,
    piglinsVisible: piglins.filter((piglin) => piglin.visible).length,
    chickensEaten: game.chickensEaten,
    chickensVisible: chickens.filter((chicken) => chicken.visible && !chicken.userData.eaten).length,
    lavaRivers: lavaRivers.length,
    volcanoes: volcanoes.length,
    dragonActive: game.dragonActive,
    dragonVisible: Boolean(redDragon?.visible),
    dragonFireballs: dragonFireballs.length,
    firebirdsVisible: firebirds.length,
    pokeballsVisible: pokeballs.length,
    asteroidsVisible: asteroids.length,
    spaceShotsVisible: spaceShots.length,
    asteroidsDestroyed: game.asteroidsDestroyed,
    spaceShotCooldown: game.spaceShotCooldown,
    asteroidSpawnTimer: game.asteroidSpawnTimer,
    lastAsteroidHitTime: game.lastAsteroidHitTime,
    chickensScorched: game.chickensScorched,
    chickensTransformed: game.chickensScorched,
    capturePokemonSpawned: game.capturePokemonSpawned,
    capturePokemonCaptured: game.capturePokemonCaptured,
    capturePokemonVisible: Boolean(capturePokemon?.visible),
    companionCapturePower: game.companionCapturePower,
    hasShoulderShield: Boolean(player.getObjectByName("Spiked Shoulder Shield")),
    firstPiglin: {
      visible: piglins[0].visible,
      isDown: Boolean(piglins[0].userData.isDown),
      respawn: piglins[0].userData.respawn,
    },
  }),
  placePiglinInSwordRange: () => {
    const piglin = piglins[0];
    const forward = getPlayerForward(new THREE.Vector3());
    const position = player.position.clone().addScaledVector(forward, 2.85);
    position.y = groundY(position.x, position.z);
    piglin.position.copy(position);
    piglin.rotation.set(0, yawForDirection(player.position.clone().sub(piglin.position)), 0);
    piglin.visible = true;
    piglin.userData.health = 1;
    piglin.userData.isDown = false;
    piglin.userData.downTimer = 0;
    piglin.userData.respawn = 0;
    piglin.userData.stun = 0;
    piglin.userData.velocity.set(0, 0, 0);
    piglin.userData.forceBlocking = false;
    piglin.userData.blockCooldown = 2;
    game.attackCooldown = 0;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placeBlockingPiglinInSwordRange: () => {
    const piglin = piglins[0];
    const forward = getPlayerForward(new THREE.Vector3());
    const position = player.position.clone().addScaledVector(forward, 2.75);
    position.y = groundY(position.x, position.z);
    piglin.position.copy(position);
    piglin.rotation.set(0, yawForDirection(player.position.clone().sub(piglin.position)), 0);
    piglin.visible = true;
    piglin.userData.health = 1;
    piglin.userData.isDown = false;
    piglin.userData.downTimer = 0;
    piglin.userData.respawn = 0;
    piglin.userData.stun = 0;
    piglin.userData.velocity.set(0, 0, 0);
    piglin.userData.forceBlocking = true;
    piglin.userData.blockCooldown = 0;
    game.attackCooldown = 0;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerAtRocket: () => {
    player.position.set(rocketHome.x + 1.8, getCurrentGroundY(rocketHome.x + 1.8, rocketHome.z), rocketHome.z);
    player.rotation.y = yawForDirection(rocket.position.clone().sub(player.position));
    game.targetYaw = player.rotation.y;
    syncGameplayCameraToPlayer();
    playerVerticalVelocity = 0;
    player.userData.grounded = true;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerOnRock: () => {
    const rock = rocks[0];
    player.position.set(rock.position.x, rock.userData.platformTop + 0.02, rock.position.z);
    playerVerticalVelocity = -1;
    player.userData.grounded = false;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerOverGosha: () => {
    player.position.set(mountGosha.position.x, mountGosha.position.y + 6.2, mountGosha.position.z);
    playerVerticalVelocity = -2;
    player.userData.grounded = false;
    game.capture = 0;
    game.won = false;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placeRocketNearPlanet: () => {
    game.phase = "space";
    game.flightTarget = "planet";
    player.visible = false;
    setWorldMode("space");
    rocket.position.copy(destinationPlanet.position).add(new THREE.Vector3(0, 0, 24));
    shipVelocity.set(0, 0, -18);
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placeRocketNearHome: () => {
    game.phase = "space";
    game.flightTarget = "desert";
    game.chickenPassenger = true;
    player.visible = false;
    setWorldMode("space");
    rocket.position.copy(originalPlanet.position).add(new THREE.Vector3(0, 0, -24));
    shipVelocity.set(0, 0, 18);
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  spawnAsteroidInBlasterPath: () => {
    prepareDebugSpaceFlight();
    clearSpaceCombat();
    game.asteroidSpawnTimer = 99;
    spawnAsteroid({
      radius: 1.45,
      distance: 17,
      lateral: 0,
      vertical: 0,
      speed: 5.5,
    });
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  spawnAsteroidOnCollisionPath: () => {
    prepareDebugSpaceFlight();
    clearSpaceCombat();
    game.asteroidSpawnTimer = 99;
    spawnAsteroid({
      radius: 1.7,
      distance: 9,
      lateral: 0,
      vertical: 0,
      speed: 12,
    });
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerNearChicken: () => {
    if (game.phase !== "planet") {
      landOnNewPlanet();
    }

    const chicken = chickens.find((candidate) => !candidate.userData.eaten) || chickens[0];
    chicken.visible = true;
    chicken.userData.eaten = false;
    const position = chicken.position.clone().add(new THREE.Vector3(0, 0, 1.15));
    player.position.set(position.x, getCurrentGroundY(position.x, position.z), position.z);
    player.rotation.y = yawForDirection(chicken.position.clone().sub(player.position));
    game.targetYaw = player.rotation.y;
    syncGameplayCameraToPlayer();
    player.userData.grounded = true;
    playerVerticalVelocity = 0;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  eatNearestChicken: () => {
    eatNearestChicken();
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerOnLava: () => {
    if (game.phase !== "planet") {
      landOnNewPlanet();
    }

    const river = lavaRivers[0];
    const point = river.userData.start.clone().lerp(river.userData.end, 0.5);
    player.position.set(point.x, planetHeight(point.x, point.z), point.z);
    player.userData.grounded = true;
    game.hazardCooldown = 0;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
  placePlayerAtPlanetRocket: () => {
    if (game.phase !== "planet") {
      landOnNewPlanet();
    }
    const chicken = chickens.find((candidate) => !candidate.userData.eaten) || chickens[0];
    chicken.visible = true;
    chicken.userData.eaten = false;
    chicken.position.set(rocket.position.x + 2.5, planetHeight(rocket.position.x + 2.5, rocket.position.z + 0.8), rocket.position.z + 0.8);
    player.position.set(rocket.position.x + 1.8, getCurrentGroundY(rocket.position.x + 1.8, rocket.position.z), rocket.position.z);
    player.rotation.y = yawForDirection(rocket.position.clone().sub(player.position));
    game.targetYaw = player.rotation.y;
    syncGameplayCameraToPlayer();
    player.userData.grounded = true;
    playerVerticalVelocity = 0;
    return window.__GOSHA_GAME_DEBUG__.state();
  },
};

window.addEventListener("resize", onResize);
window.addEventListener("keydown", (event) => {
  keys.set(event.code, true);
  if ((event.code === "ArrowLeft" || event.code === "KeyA") && !event.repeat) {
    queuePlayerTurn(1);
  }
  if ((event.code === "ArrowRight" || event.code === "KeyD") && !event.repeat) {
    queuePlayerTurn(-1);
  }
  if (event.code === "Space") {
    event.preventDefault();
    if (game.phase === "space") {
      fireSpaceBlaster();
    } else {
      requestJumpOrBoard();
    }
  }
  if (event.code === "KeyF") {
    swingSword();
  }
  if (event.code === "KeyE") {
    if (captureNearestPokeball()) return;
    if (tryCapturePokemon()) return;
    if (game.phase === "planet") {
      eatNearestChicken();
    }
  }
  if (event.code === "KeyR") {
    resetGame();
  }
});
window.addEventListener("keyup", (event) => keys.set(event.code, false));
window.addEventListener("pointerdown", (event) => {
  if (event.target.closest("button")) return;
  if (game.phase === "planet") {
    eatNearestChicken();
    return;
  }
  swingSword();
});
ui.restartButton.addEventListener("click", () => {
  resetGame();
  ui.restartButton.blur();
});

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
  desertObjects.push(ground);

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
    rock.userData.platformRadius = Math.max(1.1, rock.scale.x * 1.65);
    rock.userData.platformTop = rock.position.y + rock.scale.y * 1.45;
    rocks.push(rock);
    scene.add(rock);
    desertObjects.push(rock);
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
    desertObjects.push(group);
  });
}

function createRocket() {
  const group = new THREE.Group();
  group.name = "Growlithe Rider Escape Rocket";
  rocketHome.y = groundY(rocketHome.x, rocketHome.z);
  group.position.copy(rocketHome);

  const pad = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.35, 40), materials.rock);
  pad.name = "Rocket Landing Pad";
  pad.position.y = 0.18;
  pad.receiveShadow = true;
  group.add(pad);

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.92, 5.2, 28), materials.rocketWhite);
  body.position.y = 3.0;
  body.castShadow = true;
  group.add(body);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.55, 28), materials.rocketRed);
  nose.position.y = 6.35;
  nose.castShadow = true;
  group.add(nose);

  const windowMesh = new THREE.Mesh(new THREE.SphereGeometry(0.34, 24, 12), materials.rocketGlass);
  windowMesh.position.set(0, 4.35, -0.72);
  windowMesh.scale.set(1, 1, 0.28);
  windowMesh.castShadow = true;
  group.add(windowMesh);

  for (let i = 0; i < 3; i += 1) {
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.2, 1.08), materials.rocketRed);
    const angle = (i / 3) * Math.PI * 2;
    fin.position.set(Math.sin(angle) * 0.86, 1.18, Math.cos(angle) * 0.86);
    fin.rotation.y = angle;
    fin.rotation.z = Math.sin(angle) * 0.18;
    fin.castShadow = true;
    group.add(fin);
  }

  rocketFlame = new THREE.Group();
  rocketFlame.name = "Rocket Engine Flames";
  rocketFlame.position.y = 0.18;
  rocketFlame.visible = false;

  const outerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.86, 2.7, 26), materials.rocketFlame);
  outerFlame.name = "Outer Flame";
  outerFlame.rotation.x = Math.PI;
  outerFlame.position.y = -0.78;
  rocketFlame.add(outerFlame);

  const innerFlame = new THREE.Mesh(new THREE.ConeGeometry(0.48, 2.15, 22), materials.rocketFlameCore);
  innerFlame.name = "Inner Flame";
  innerFlame.rotation.x = Math.PI;
  innerFlame.position.y = -0.56;
  rocketFlame.add(innerFlame);

  const blueFlame = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.15, 18), materials.rocketFlameBlue);
  blueFlame.name = "Blue Flame";
  blueFlame.rotation.x = Math.PI;
  blueFlame.position.y = -0.1;
  rocketFlame.add(blueFlame);

  rocketFlame.userData.power = 0;
  group.add(rocketFlame);

  rocketChickenPassenger = createChicken(102);
  rocketChickenPassenger.name = "Rocket Chicken Passenger";
  rocketChickenPassenger.scale.setScalar(0.72);
  rocketChickenPassenger.position.set(1.06, 2.1, 0.2);
  rocketChickenPassenger.rotation.y = -0.6;
  rocketChickenPassenger.visible = false;
  group.add(rocketChickenPassenger);

  group.userData.home = rocketHome.clone();
  group.userData.boardRadius = 5.6;
  group.userData.pad = pad;
  return group;
}

function createDestinationPlanet() {
  const group = new THREE.Group();
  group.name = "Escape Planet";
  group.position.copy(destinationPlanetPosition);
  group.visible = false;

  const planet = new THREE.Mesh(new THREE.SphereGeometry(18, 48, 24), materials.planetGlow);
  planet.castShadow = false;
  group.add(planet);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(22, 29, 72),
    new THREE.MeshBasicMaterial({
      color: 0xb3ffee,
      transparent: true,
      opacity: 0.48,
      side: THREE.DoubleSide,
    }),
  );
  ring.rotation.set(1.1, 0.2, 0.45);
  group.add(ring);

  return group;
}

function createOriginalPlanet() {
  const group = new THREE.Group();
  group.name = "Original Desert Planet";
  group.position.copy(originalPlanetPosition);
  group.visible = false;

  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(18, 48, 24),
    new THREE.MeshStandardMaterial({
      color: 0xc58a48,
      emissive: 0x4a2715,
      emissiveIntensity: 0.55,
      roughness: 0.62,
    }),
  );
  group.add(planet);

  const band = new THREE.Mesh(
    new THREE.TorusGeometry(18.8, 0.16, 8, 72),
    new THREE.MeshBasicMaterial({
      color: 0xf0c27b,
      transparent: true,
      opacity: 0.62,
    }),
  );
  band.rotation.x = Math.PI / 2.4;
  group.add(band);

  return group;
}

function createPlanetSurface() {
  const group = new THREE.Group();
  group.name = "Different Planet Surface";
  group.visible = false;

  const geometry = new THREE.PlaneGeometry(worldSize * 1.45, worldSize * 1.45, 90, 90);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getY(i);
    position.setZ(i, planetHeight(x, z));
  }
  geometry.computeVertexNormals();

  const ground = new THREE.Mesh(geometry, materials.planetGround);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  group.add(ground);

  for (let i = 0; i < 18; i += 1) {
    const crystal = new THREE.Mesh(
      new THREE.ConeGeometry(THREE.MathUtils.randFloat(0.28, 0.7), THREE.MathUtils.randFloat(1.4, 3.4), 5),
      materials.planetGroundDark,
    );
    const x = THREE.MathUtils.randFloatSpread(worldSize * 0.9);
    const z = THREE.MathUtils.randFloatSpread(worldSize * 0.9);
    crystal.position.set(x, planetHeight(x, z) + crystal.geometry.parameters.height / 2, z);
    crystal.rotation.z = THREE.MathUtils.randFloat(-0.18, 0.18);
    crystal.castShadow = true;
    group.add(crystal);
  }

  spawnPlanetChickens(group);
  createPlanetHazards(group);
  redDragon = createRedDragon();
  redDragon.visible = false;
  group.add(redDragon);

  planetObjects.push(group);
  return group;
}

function createPlanetHazards(group) {
  const riverPaths = [
    [
      [-42, -28],
      [-24, -18],
      [-10, -22],
      [7, -10],
      [28, -14],
      [42, -4],
    ],
    [
      [-34, 34],
      [-18, 24],
      [4, 28],
      [22, 16],
      [38, 20],
    ],
  ];

  riverPaths.forEach((path, riverIndex) => {
    for (let i = 0; i < path.length - 1; i += 1) {
      const start = new THREE.Vector3(path[i][0], planetHeight(path[i][0], path[i][1]) + 0.055, path[i][1]);
      const end = new THREE.Vector3(path[i + 1][0], planetHeight(path[i + 1][0], path[i + 1][1]) + 0.055, path[i + 1][1]);
      const segment = createLavaSegment(start, end, riverIndex);
      lavaRivers.push(segment);
      group.add(segment);
    }
  });

  [
    [-32, -34],
    [31, 34],
    [2, -42],
  ].forEach(([x, z], index) => {
    const volcano = createVolcano(index, x, z);
    volcanoes.push(volcano);
    group.add(volcano);
  });
}

function createLavaSegment(start, end, riverIndex) {
  const direction = end.clone().sub(start);
  const length = Math.max(1, Math.hypot(direction.x, direction.z));
  const width = riverIndex === 0 ? 4.6 : 3.7;
  const group = new THREE.Group();
  group.name = `Lava River Segment ${riverIndex + 1}`;

  const river = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, length), materials.lava);
  river.position.copy(start).lerp(end, 0.5);
  river.rotation.y = Math.atan2(direction.x, direction.z);
  river.receiveShadow = false;
  group.add(river);

  const core = new THREE.Mesh(new THREE.BoxGeometry(width * 0.52, 0.1, length * 0.94), materials.lavaCore);
  core.position.copy(river.position);
  core.position.y += 0.04;
  core.rotation.y = river.rotation.y;
  group.add(core);

  const flowBands = [];
  for (let i = 0; i < 4; i += 1) {
    const bandMaterial = materials.lavaCore.clone();
    bandMaterial.opacity = 0.34;
    const band = new THREE.Mesh(new THREE.BoxGeometry(width * 0.24, 0.13, Math.max(1.4, length * 0.16)), bandMaterial);
    band.rotation.y = river.rotation.y;
    band.position.copy(start).lerp(end, (i + 0.5) / 4);
    band.position.y += 0.09;
    band.userData.offset = i / 4;
    group.add(band);
    flowBands.push(band);
  }

  group.userData = {
    start,
    end,
    width,
    length,
    rotationY: river.rotation.y,
    pulse: THREE.MathUtils.randFloat(0, Math.PI * 2),
    flowBands,
  };
  return group;
}

function createVolcano(index, x, z) {
  const group = new THREE.Group();
  group.name = `Volcano ${index + 1}`;
  const y = planetHeight(x, z);
  group.position.set(x, y, z);

  const cone = new THREE.Mesh(new THREE.ConeGeometry(4.4, 8.8, 9, 1, true), materials.volcanoRock);
  cone.position.y = 4.4;
  cone.castShadow = true;
  cone.receiveShadow = true;
  group.add(cone);

  const crater = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.25, 0.36, 24),
    materials.lava,
  );
  crater.position.y = 8.7;
  crater.castShadow = false;
  group.add(crater);

  const glow = new THREE.PointLight(0xff4b17, 1.6, 22);
  glow.position.y = 8.7;
  group.add(glow);

  group.userData = {
    hazardRadius: 6.5,
    pulse: THREE.MathUtils.randFloat(0, Math.PI * 2),
    spewTimer: THREE.MathUtils.randFloat(0.12, 0.55),
    crater,
    glow,
  };

  return group;
}

function spawnPlanetChickens(group) {
  const positions = [
    [-8, 8],
    [5, 14],
    [13, -5],
    [-16, -10],
    [22, 18],
    [-24, 20],
    [28, -22],
    [-34, 2],
  ];

  positions.forEach(([x, z], index) => {
    const chicken = createChicken(index);
    chicken.position.set(x, planetHeight(x, z), z);
    chicken.userData.spawn = chicken.position.clone();
    chicken.rotation.y = THREE.MathUtils.randFloat(0, Math.PI * 2);
    chickens.push(chicken);
    group.add(chicken);
  });
}

function createChicken(index) {
  const group = new THREE.Group();
  group.name = `Planet Chicken ${index + 1}`;

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), materials.chickenBody);
  body.scale.set(1, 0.86, 1.18);
  body.position.y = 0.5;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 8), materials.chickenBody);
  head.position.set(0, 0.88, -0.3);
  head.castShadow = true;
  group.add(head);

  const comb = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.2, 7), materials.chickenComb);
  comb.position.set(0, 1.06, -0.3);
  comb.rotation.x = -0.2;
  comb.castShadow = true;
  group.add(comb);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.055, 0.18, 8), materials.chickenBeak);
  beak.position.set(0, 0.87, -0.5);
  beak.rotation.x = -Math.PI / 2;
  beak.castShadow = true;
  group.add(beak);

  [-0.24, 0.24].forEach((x) => {
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), materials.chickenWing);
    wing.scale.set(0.42, 1, 1.3);
    wing.position.set(x, 0.48, 0.02);
    wing.rotation.z = x > 0 ? -0.42 : 0.42;
    wing.castShadow = true;
    group.add(wing);
  });

  [-0.11, 0.11].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 6), materials.chickenBeak);
    leg.position.set(x, 0.16, -0.02);
    leg.castShadow = true;
    group.add(leg);

    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.025, 0.08), materials.chickenBeak);
    foot.position.set(x, 0.02, -0.08);
    foot.castShadow = true;
    group.add(foot);
  });

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.28, 5), materials.chickenWing);
  tail.position.set(0, 0.58, 0.43);
  tail.rotation.x = Math.PI / 2.35;
  tail.castShadow = true;
  group.add(tail);

  group.userData = {
    spawn: new THREE.Vector3(),
    wanderAngle: THREE.MathUtils.randFloat(0, Math.PI * 2),
    speed: THREE.MathUtils.randFloat(0.65, 1.1),
    peckTimer: THREE.MathUtils.randFloat(0.2, 1.4),
    eaten: false,
  };

  return group;
}

function createRedDragon() {
  const group = new THREE.Group();
  group.name = "Red Chicken-Hunting Dragon";
  group.scale.setScalar(1.04);

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.1, 28, 16), materials.dragonRed);
  body.name = "Dragon Body";
  body.scale.set(1.15, 0.72, 2.05);
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.64, 18, 12), materials.dragonBelly);
  belly.scale.set(0.72, 0.34, 1.58);
  belly.position.set(0, -0.28, -0.34);
  belly.castShadow = true;
  group.add(belly);

  const neck = cylinderBetween(
    new THREE.Vector3(0, 0.28, -1.42),
    new THREE.Vector3(0, 0.62, -2.2),
    0.28,
    materials.dragonRed,
  );
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 22, 14), materials.dragonRed);
  head.name = "Dragon Head";
  head.scale.set(0.95, 0.78, 1.08);
  head.position.set(0, 0.72, -2.78);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.34, 0.72), materials.dragonBelly);
  snout.position.set(0, 0.6, -3.2);
  snout.castShadow = true;
  group.add(snout);

  [-0.25, 0.25].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), materials.dragonEye);
    eye.position.set(x, 0.84, -3.18);
    eye.scale.z = 0.36;
    group.add(eye);

    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.48, 8), materials.shieldSpike);
    horn.position.set(x * 1.25, 1.12, -2.76);
    horn.rotation.set(-0.5, x > 0 ? -0.28 : 0.28, x > 0 ? -0.22 : 0.22);
    horn.castShadow = true;
    group.add(horn);
  });

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.34, 3.2, 14), materials.dragonRed);
  tail.position.set(0, 0.02, 2.88);
  tail.rotation.x = Math.PI / 2;
  tail.castShadow = true;
  group.add(tail);

  [-0.56, 0.56].forEach((x) => {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.56, 8), materials.shieldSpike);
    claw.position.set(x, -0.72, -1.06);
    claw.rotation.x = -Math.PI;
    claw.castShadow = true;
    group.add(claw);
  });

  const leftWing = createDragonWing(-1, 4.8, materials.dragonWing);
  const rightWing = createDragonWing(1, 4.8, materials.dragonWing);
  group.add(leftWing, rightWing);

  const mouth = new THREE.Object3D();
  mouth.name = "Dragon Fire Mouth";
  mouth.position.set(0, 0.55, -3.62);
  group.add(mouth);

  const throatGlow = new THREE.PointLight(0xff5c1d, 1.35, 15);
  throatGlow.position.copy(mouth.position);
  group.add(throatGlow);

  group.userData = {
    base: new THREE.Vector3(-16, planetHeight(-16, -16) + 8.4, -16),
    mouth,
    leftWing,
    rightWing,
    throatGlow,
    orbitAngle: 0,
  };

  return group;
}

function createDragonWing(side, span, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        side * 0.42, 0.08, -0.85,
        side * span, -0.36, -2.05,
        side * (span * 0.74), -0.62, 1.58,
        side * 0.62, -0.16, 0.86,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 1, 2, 0, 2, 3]);
  geometry.computeVertexNormals();

  const wing = new THREE.Mesh(geometry, material);
  wing.name = side < 0 ? "Left Dragon Wing" : "Right Dragon Wing";
  wing.castShadow = true;
  wing.userData.side = side;
  return wing;
}

function createFirebird(index) {
  const group = new THREE.Group();
  group.name = `Moltres-Like Firebird ${index + 1}`;
  group.scale.setScalar(1.3);
  const flameParts = [];

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.62, 30, 18), materials.firebird);
  body.name = "Golden Moltres Body";
  body.scale.set(0.82, 1.08, 1.56);
  body.position.set(0, 0.02, 0.04);
  body.castShadow = true;
  group.add(body);

  const chest = new THREE.Mesh(new THREE.SphereGeometry(0.43, 20, 12), materials.firebirdShade);
  chest.name = "Warm Chest Plume";
  chest.scale.set(0.72, 0.72, 1.18);
  chest.position.set(0, -0.2, -0.48);
  chest.castShadow = true;
  group.add(chest);

  const neck = cylinderBetween(
    new THREE.Vector3(0, 0.36, -0.56),
    new THREE.Vector3(0, 0.9, -0.98),
    0.19,
    materials.firebird,
  );
  neck.name = "Long Golden Neck";
  group.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.34, 22, 14), materials.firebird);
  head.name = "Sharp Moltres Head";
  head.scale.set(0.82, 0.86, 1.18);
  head.position.set(0, 1.02, -1.22);
  head.castShadow = true;
  group.add(head);

  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.055, 0.12), materials.firebirdShade);
  brow.name = "Angled Eye Brow";
  brow.position.set(0, 1.12, -1.52);
  brow.rotation.x = -0.08;
  brow.castShadow = true;
  group.add(brow);

  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.82, 10), materials.firebirdTalon);
  beak.name = "Long Hooked Beak";
  beak.position.set(0, 0.96, -1.72);
  beak.rotation.x = -Math.PI / 2;
  beak.scale.set(0.7, 1, 1.42);
  beak.castShadow = true;
  group.add(beak);

  const lowerBeak = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.44, 9), materials.firebirdShade);
  lowerBeak.name = "Lower Beak";
  lowerBeak.position.set(0, 0.86, -1.62);
  lowerBeak.rotation.x = -Math.PI / 2;
  lowerBeak.scale.set(0.68, 1, 0.92);
  group.add(lowerBeak);

  [-0.135, 0.135].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), materials.dragonEye);
    eye.name = "Bright Moltres Eye";
    eye.position.set(x, 1.08, -1.52);
    eye.scale.set(1, 0.82, 0.34);
    group.add(eye);
  });

  [
    [0, 1.52, -1.18, 0.19, 1.02, -0.36, 0],
    [-0.14, 1.38, -1.12, 0.13, 0.78, -0.46, -0.34],
    [0.14, 1.38, -1.12, 0.13, 0.78, -0.46, 0.34],
    [0, 1.26, -0.98, 0.12, 0.62, -0.76, 0],
  ].forEach(([x, y, z, radius, height, pitch, roll]) => {
    const crest = createFlameFeather(radius, height, materials.firebirdFlameHot);
    crest.name = "Layered Head Flame";
    crest.position.set(x, y, z);
    crest.rotation.set(pitch, 0, roll);
    group.add(crest);
    flameParts.push(crest);
  });

  const leftWing = createFirebirdWing(-1);
  const rightWing = createFirebirdWing(1);
  group.add(leftWing, rightWing);
  flameParts.push(...leftWing.userData.flameParts, ...rightWing.userData.flameParts);

  [
    [0, -0.18, 1.22, 0.24, 1.72, Math.PI / 2.28, 0],
    [-0.24, -0.12, 1.1, 0.18, 1.38, Math.PI / 2.2, -0.22],
    [0.24, -0.12, 1.1, 0.18, 1.38, Math.PI / 2.2, 0.22],
    [-0.42, -0.2, 0.96, 0.14, 1.1, Math.PI / 2.12, -0.44],
    [0.42, -0.2, 0.96, 0.14, 1.1, Math.PI / 2.12, 0.44],
  ].forEach(([x, y, z, radius, height, pitch, roll]) => {
    const tail = createFlameFeather(radius, height, materials.firebirdFlame);
    tail.name = "Flowing Tail Fire";
    tail.position.set(x, y, z);
    tail.rotation.set(pitch, 0, roll);
    group.add(tail);
    flameParts.push(tail);
  });

  [-0.22, 0.22].forEach((x) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.055, 0.44, 8), materials.firebirdTalon);
    leg.position.set(x, -0.62, -0.12);
    leg.rotation.x = -0.1;
    leg.castShadow = true;
    group.add(leg);

    [-0.1, 0, 0.1].forEach((clawOffset) => {
      const claw = new THREE.Mesh(new THREE.ConeGeometry(0.034, 0.28, 8), materials.firebirdTalon);
      claw.position.set(x + clawOffset, -0.86, -0.3);
      claw.rotation.x = -Math.PI / 2.35;
      claw.rotation.z = clawOffset * -1.7;
      claw.castShadow = true;
      group.add(claw);
    });
  });

  const glow = new THREE.PointLight(0xff6a1c, 1.55, 15);
  group.add(glow);

  group.userData = {
    velocity: new THREE.Vector3(),
    attackCooldown: THREE.MathUtils.randFloat(0.1, 0.7),
    flapOffset: index * Math.PI,
    side: index === 0 ? -1 : 1,
    leftWing,
    rightWing,
    flameParts,
  };

  return group;
}

function createFirebirdWing(side) {
  const group = new THREE.Group();
  group.name = side < 0 ? "Left Realistic Flame Wing" : "Right Realistic Flame Wing";
  const flameParts = [];

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        side * 0.32, 0.26, -0.34,
        side * 2.15, 0.62, -1.18,
        side * 3.18, 0.26, -0.34,
        side * 2.86, -0.16, 0.62,
        side * 1.52, -0.3, 1.08,
        side * 0.42, -0.08, 0.52,
      ],
      3,
    ),
  );
  geometry.setIndex([0, 1, 5, 1, 2, 4, 1, 4, 5, 2, 3, 4]);
  geometry.computeVertexNormals();

  const membrane = new THREE.Mesh(geometry, materials.firebirdWing);
  membrane.name = "Layered Golden Wing Membrane";
  membrane.castShadow = false;
  group.add(membrane);

  [
    [0.62, 0.08, 0.22, 0.06],
    [1.18, 0.08, 0.0, 0.055],
    [1.82, 0.05, -0.18, 0.05],
    [2.42, -0.02, -0.08, 0.045],
  ].forEach(([x, y, z, radius]) => {
    const bone = cylinderBetween(
      new THREE.Vector3(side * 0.18, 0.18, -0.2),
      new THREE.Vector3(side * x, y, z),
      radius,
      materials.firebirdShade,
    );
    bone.name = "Wing Feather Rib";
    group.add(bone);
  });

  [
    [1.0, -0.18, 0.74, 0.18, 0.9, 0.52],
    [1.48, -0.28, 0.86, 0.18, 1.02, 0.32],
    [1.98, -0.26, 0.72, 0.17, 1.08, 0.08],
    [2.45, -0.18, 0.36, 0.16, 1.02, -0.16],
    [2.86, 0.0, -0.18, 0.16, 0.96, -0.42],
  ].forEach(([x, y, z, radius, height, roll]) => {
    const feather = createFlameFeather(radius, height, materials.firebird);
    feather.name = "Golden Primary Feather";
    feather.position.set(side * x, y, z);
    feather.rotation.set(Math.PI / 2.45, 0, side * roll);
    feather.scale.x = 0.72;
    group.add(feather);
  });

  [
    [2.28, 0.18, -1.02, 0.15, 0.95, -0.7],
    [2.88, -0.02, -0.48, 0.21, 1.2, -0.36],
    [2.78, -0.24, 0.2, 0.2, 1.2, -0.02],
    [2.18, -0.34, 0.82, 0.17, 1.0, 0.28],
    [1.42, -0.32, 1.14, 0.14, 0.82, 0.56],
  ].forEach(([x, y, z, radius, height, roll], flameIndex) => {
    const flame = createFlameFeather(radius, height, flameIndex % 2 === 0 ? materials.firebirdFlameHot : materials.firebirdFlame);
    flame.name = "Animated Wing Flame";
    flame.position.set(side * x, y, z);
    flame.rotation.set(Math.PI / 2.55, 0, side * roll);
    group.add(flame);
    flameParts.push(flame);
  });

  group.userData.side = side;
  group.userData.flameParts = flameParts;
  return group;
}

function createFlameFeather(radius, height, material) {
  const flame = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 9), material);
  flame.castShadow = false;
  flame.userData.baseScale = new THREE.Vector3(1, 1, 1);
  flame.userData.flickerOffset = THREE.MathUtils.randFloat(0, Math.PI * 2);
  return flame;
}

function createCapturePokemon() {
  const group = new THREE.Group();
  group.name = "Capturable Helper Pokemon";

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.54, 24, 16), materials.capturePokemon);
  body.name = "Helper Pokemon Body";
  body.scale.set(0.82, 0.86, 1.18);
  body.position.y = 0.66;
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 10), materials.capturePokemonBelly);
  belly.scale.set(0.66, 0.52, 0.82);
  belly.position.set(0, 0.55, -0.26);
  belly.castShadow = true;
  group.add(belly);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.38, 20, 14), materials.capturePokemon);
  head.name = "Helper Pokemon Head";
  head.position.set(0, 1.1, -0.55);
  head.castShadow = true;
  group.add(head);

  const snout = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 8), materials.capturePokemonBelly);
  snout.scale.set(0.9, 0.62, 0.76);
  snout.position.set(0, 1.02, -0.88);
  snout.castShadow = true;
  group.add(snout);

  [-0.16, 0.16].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), materials.dragonEye);
    eye.position.set(x, 1.16, -0.9);
    eye.scale.z = 0.38;
    group.add(eye);

    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.48, 5), materials.capturePokemon);
    ear.position.set(x * 1.65, 1.43, -0.5);
    ear.rotation.set(0.22, x > 0 ? -0.26 : 0.26, x > 0 ? -0.54 : 0.54);
    ear.castShadow = true;
    group.add(ear);
  });

  [-0.22, 0.22].forEach((x) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), materials.capturePokemonBelly);
    foot.scale.set(1.15, 0.42, 0.86);
    foot.position.set(x, 0.16, -0.1);
    foot.castShadow = true;
    group.add(foot);
  });

  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.06, 8, 24, Math.PI * 1.35), materials.capturePokemon);
  tail.name = "Capture Tail";
  tail.position.set(0, 0.78, 0.62);
  tail.rotation.set(0.2, Math.PI / 2, 0.55);
  tail.castShadow = true;
  group.add(tail);

  const sparkAnchor = new THREE.Group();
  sparkAnchor.name = "Capture Spark Ring";
  sparkAnchor.position.y = 1.18;
  for (let i = 0; i < 10; i += 1) {
    const spark = new THREE.Mesh(new THREE.TetrahedronGeometry(0.07, 0), materials.captureSpark);
    const angle = (i / 10) * Math.PI * 2;
    spark.position.set(Math.sin(angle) * 0.72, Math.sin(i * 1.7) * 0.12, Math.cos(angle) * 0.72);
    spark.userData.angle = angle;
    spark.castShadow = false;
    sparkAnchor.add(spark);
  }
  group.add(sparkAnchor);

  group.userData = {
    captured: false,
    captureReady: false,
    bobOffset: THREE.MathUtils.randFloat(0, Math.PI * 2),
    sparkAnchor,
    followVelocity: new THREE.Vector3(),
  };

  return group;
}

function createGrowlitheJockey() {
  const group = new THREE.Group();
  group.name = "Growlithe Rider Player";

  const body = new THREE.Mesh(new THREE.SphereGeometry(0.86, 30, 18), materials.growlitheFur);
  body.name = "Growlithe Body";
  body.scale.set(0.78, 0.62, 1.62);
  body.position.set(0, 1.22, 0.05);
  body.castShadow = true;
  group.add(body);

  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 12), materials.growlitheCreamShade);
  belly.scale.set(0.58, 0.42, 0.96);
  belly.position.set(0, 0.95, -0.1);
  belly.castShadow = true;
  group.add(belly);

  const mane = new THREE.Mesh(new THREE.SphereGeometry(0.82, 24, 16), materials.growlitheCream);
  mane.name = "Growlithe Mane";
  mane.scale.set(0.95, 0.9, 0.82);
  mane.position.set(0, 1.52, -1.0);
  mane.castShadow = true;
  group.add(mane);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), materials.growlitheFur);
  head.scale.set(0.78, 0.78, 0.9);
  head.position.set(0, 1.93, -1.77);
  head.castShadow = true;
  group.add(head);

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.36, 18, 12), materials.growlitheCream);
  muzzle.scale.set(1.18, 0.66, 0.78);
  muzzle.position.set(0, 1.77, -2.25);
  muzzle.castShadow = true;
  group.add(muzzle);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 10), materials.growlitheNose);
  nose.scale.set(1.15, 0.8, 0.82);
  nose.position.set(0, 1.84, -2.56);
  nose.castShadow = true;
  group.add(nose);

  const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0xf8fbff,
    roughness: 0.28,
  });
  const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x1b2230 });
  [-0.24, 0.24].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), eyeMaterial);
    eye.position.set(x, 1.94, -2.22);
    eye.scale.set(1, 0.9, 0.35);
    group.add(eye);

    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 6), pupilMaterial);
    pupil.position.set(x * 1.02, 1.94, -2.29);
    pupil.scale.set(1, 1, 0.25);
    group.add(pupil);
  });

  [-0.48, 0.48].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.74, 4), materials.growlitheFur);
    ear.position.set(x, 2.08, -1.72);
    ear.rotation.set(0.28, x > 0 ? -0.42 : 0.42, x > 0 ? -0.75 : 0.75);
    ear.scale.y = 0.82;
    ear.castShadow = true;
    group.add(ear);

    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.48, 4), materials.growlitheCream);
    inner.position.set(x * 1.02, 2.04, -1.79);
    inner.rotation.copy(ear.rotation);
    inner.scale.y = 0.72;
    group.add(inner);
  });

  const crestPositions = [
    [0, 2.26, -1.92, 0.34, -0.86],
    [0, 2.5, -1.62, 0.54, -0.72],
    [0, 2.68, -1.27, 0.46, -0.52],
    [-0.18, 2.46, -1.44, 0.34, -0.62],
    [0.18, 2.46, -1.44, 0.34, -0.62],
  ];
  crestPositions.forEach(([x, y, z, scale, pitch]) => {
    group.add(createFurSpike(x, y, z, 0.34 * scale, 1.15 * scale, pitch, 0, materials.growlitheCream));
  });

  addChestFur(group);

  [-0.42, 0.42].forEach((x) => {
    [-0.4, 0.48].forEach((z, stripeIndex) => {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.15, 0.8), materials.growlitheStripe);
      stripe.position.set(x, 1.47, z);
      stripe.rotation.set(0.36, 0.18 * Math.sign(x), x > 0 ? -0.64 : 0.64);
      stripe.castShadow = true;
      group.add(stripe);
      stripe.userData.stripeIndex = stripeIndex;
    });
  });

  [-0.52, 0.52].forEach((x) => {
    group.add(createGrowlitheLeg(x, -0.95, x > 0 ? 0 : 1));
    group.add(createGrowlitheLeg(x, 0.72, x > 0 ? 2 : 3));
  });

  const tailBase = new THREE.Group();
  tailBase.name = "Growlithe Tail";
  tailBase.position.set(0, 1.64, 1.48);
  tailBase.rotation.set(0.38, 0, 0);
  group.add(tailBase);

  const tailCurl = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.12, 12, 34, Math.PI * 1.44), materials.growlitheCream);
  tailCurl.rotation.set(0.12, Math.PI / 2, 0);
  tailCurl.castShadow = true;
  tailBase.add(tailCurl);

  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 10), materials.growlitheCream);
  tailTip.position.set(0.04, 0.35, 0.34);
  tailTip.castShadow = true;
  tailBase.add(tailTip);

  [-0.32, -0.14, 0.08, 0.28].forEach((offset, index) => {
    const tuft = createFurSpike(offset * 0.18, 0.26 + index * 0.1, 0.28 - index * 0.03, 0.09, 0.42, -0.25, 0, materials.growlitheCreamShade);
    tailBase.add(tuft);
  });

  const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.14, 0.72), materials.gold);
  saddle.position.set(0, 1.78, -0.08);
  saddle.castShadow = true;
  group.add(saddle);

  const rider = new THREE.Group();
  rider.name = "Rider";
  rider.position.set(0, 1.96, -0.12);
  group.add(rider);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.78, 0.32), materials.rider);
  torso.position.y = 0.38;
  torso.castShadow = true;
  rider.add(torso);

  const riderHead = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.44), materials.riderSkin);
  riderHead.position.y = 1.0;
  riderHead.castShadow = true;
  rider.add(riderHead);

  const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.2, 0.52), materials.gold);
  helmet.position.y = 1.26;
  helmet.castShadow = true;
  rider.add(helmet);

  const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.68, 0.18), materials.riderSkin);
  leftArm.name = "Rider Left Arm";
  leftArm.position.set(-0.44, 0.36, 0.02);
  leftArm.rotation.z = -0.22;
  leftArm.castShadow = true;
  rider.add(leftArm);
  rider.add(createShoulderShield());

  const rightArm = new THREE.Group();
  rightArm.name = "Rider Right Arm";
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

  swordTrail = createSwordTrail();
  group.add(swordTrail);

  group.userData.walkCycle = 0;
  group.userData.grounded = true;
  group.userData.legs = group.children.filter((child) => child.userData.isLeg);
  group.userData.danceParts = {
    body,
    mane,
    tailBase,
    rider,
    leftArm,
    rightArm,
    saddle,
  };
  return group;
}

function createFurSpike(x, y, z, radius, length, pitch, yaw = 0, material = materials.growlitheCream) {
  const tuft = new THREE.Mesh(new THREE.ConeGeometry(radius, length, 5), material);
  tuft.position.set(x, y, z);
  tuft.rotation.set(pitch, yaw, 0);
  tuft.castShadow = true;
  return tuft;
}

function addChestFur(group) {
  const rows = [
    [-0.42, 1.54, -1.42, 0.1, 0.44],
    [-0.16, 1.52, -1.5, 0.12, 0.5],
    [0.16, 1.52, -1.5, 0.12, 0.5],
    [0.42, 1.54, -1.42, 0.1, 0.44],
    [-0.3, 1.27, -1.28, 0.1, 0.42],
    [0, 1.22, -1.38, 0.13, 0.52],
    [0.3, 1.27, -1.28, 0.1, 0.42],
    [-0.18, 1.02, -1.1, 0.09, 0.34],
    [0.18, 1.02, -1.1, 0.09, 0.34],
  ];

  rows.forEach(([x, y, z, radius, length]) => {
    const yaw = x * -0.34;
    group.add(createFurSpike(x, y, z, radius, length, -Math.PI / 2.55, yaw, materials.growlitheCream));
  });

  [-0.36, 0.36].forEach((x) => {
    group.add(createFurSpike(x, 1.0, -0.58, 0.07, 0.34, -Math.PI / 2.9, x > 0 ? -0.35 : 0.35, materials.growlitheCreamShade));
    group.add(createFurSpike(x * 0.8, 0.86, 0.24, 0.065, 0.3, -Math.PI / 3.1, x > 0 ? -0.28 : 0.28, materials.growlitheCreamShade));
  });
}

function createGrowlitheLeg(x, z, index) {
  const group = new THREE.Group();
  group.userData.isLeg = true;
  group.userData.index = index;
  group.position.set(x, 0.86, z);

  const upper = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.84, 0.29), materials.growlitheFur);
  upper.position.y = 0.12;
  upper.castShadow = true;
  group.add(upper);

  const cuff = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), materials.growlitheCream);
  cuff.scale.set(1.05, 0.72, 0.96);
  cuff.position.y = -0.2;
  cuff.castShadow = true;
  group.add(cuff);

  const paw = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 10), materials.growlitheCream);
  paw.scale.set(1.18, 0.38, 0.92);
  paw.position.set(0, -0.57, -0.05);
  paw.castShadow = true;
  group.add(paw);

  for (let i = -1; i <= 1; i += 1) {
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.14, 8), materials.shieldSpike);
    claw.position.set(i * 0.08, -0.6, -0.22);
    claw.rotation.x = -Math.PI / 2;
    group.add(claw);
  }

  return group;
}

function createShoulderShield() {
  const shield = new THREE.Group();
  shield.name = "Spiked Shoulder Shield";
  shield.position.set(-0.58, 0.74, -0.08);
  shield.rotation.set(0.12, -0.2, 0.86);
  shield.userData.isSpikedShoulderShield = true;

  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.62, 0.2, 10), materials.shield);
  plate.scale.set(1, 0.5, 1.28);
  plate.rotation.x = Math.PI / 2;
  plate.castShadow = true;
  shield.add(plate);

  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 10, 32), materials.gold);
  rim.rotation.x = Math.PI / 2;
  rim.scale.z = 1.28;
  rim.castShadow = true;
  shield.add(rim);

  const boss = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), materials.shieldSpike);
  boss.scale.set(1, 0.6, 1);
  boss.position.y = 0.13;
  boss.castShadow = true;
  shield.add(boss);

  const spikePositions = [
    [0, 0.22, -0.64, 0.44],
    [-0.43, 0.2, -0.28, 0.36],
    [0.43, 0.2, -0.28, 0.36],
    [-0.36, 0.19, 0.3, 0.32],
    [0.36, 0.19, 0.3, 0.32],
    [0, 0.18, 0.58, 0.36],
  ];

  spikePositions.forEach(([x, y, z, length]) => {
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.085, length, 12), materials.shieldSpike);
    spike.position.set(x, y, z);
    spike.rotation.x = Math.PI / 2;
    spike.castShadow = true;
    shield.add(spike);
  });

  return shield;
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

function createSwordTrail() {
  const trail = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 3.45, 54, 1, Math.PI * 1.07, Math.PI * 0.86),
    materials.swordTrail,
  );
  trail.position.set(0, 2.35, -0.48);
  trail.rotation.x = -Math.PI / 2;
  trail.visible = false;
  return trail;
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
    health: 1,
    stun: 0,
    respawn: 0,
    downTimer: 0,
    isDown: false,
    isBlocking: false,
    forceBlocking: false,
    fleeing: false,
    fleeTimer: 0,
    blockCooldown: THREE.MathUtils.randFloat(0.6, 1.8),
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

  if (!game.lost && game.phase !== "launching" && game.phase !== "space") {
    updatePlayer(delta);
    if (game.phase === "desert" && !game.won) {
      updatePiglins(delta);
      updateCapture(delta);
    } else if (game.phase === "desert") {
      updateFleeingPiglins(delta);
    } else if (game.phase === "planet") {
      updateChickens(delta);
      updatePlanetHazards(delta);
      updateDragonEncounter(delta);
    }
  } else {
    updateIdlePlayer(delta);
  }

  updateMount(elapsed);
  updateRocket(delta, elapsed);
  updateSpaceCombat(delta, elapsed);
  if (game.phase === "desert" || game.phase === "planet") {
    updateCapturePokemon(delta);
    updatePokeballs(delta);
  }
  updateEffects(delta);
  updateCamera(delta, elapsed);
  updateHud(delta);
  renderer.render(scene, camera);
}

function updatePlayer(delta) {
  const forwardInput =
    (keys.get("KeyW") || keys.get("ArrowUp") ? 1 : 0) -
    (keys.get("KeyS") || keys.get("ArrowDown") ? 1 : 0);
  const turnInput =
    (keys.get("KeyA") || keys.get("ArrowLeft") ? 1 : 0) -
    (keys.get("KeyD") || keys.get("ArrowRight") ? 1 : 0);

  if (turnInput !== 0 && game.danceTimer <= 0) {
    game.targetYaw = normalizeAngle(game.targetYaw + turnInput * (Math.PI / 12) * 4 * delta);
    holdGameplayCamera();
  }

  player.rotation.y = dampAngle(player.rotation.y, game.targetYaw, 8, delta);

  const hasMovement = forwardInput !== 0;
  if (hasMovement && game.danceTimer <= 0) {
    const speed = (keys.get("ShiftLeft") || keys.get("ShiftRight") ? 14 : 9.2) * forwardInput;
    const forward = getPlayerForward(tempVec);
    playerVelocity.lerp(forward.multiplyScalar(speed), 0.16);
    player.userData.walkCycle += delta * playerVelocity.length() * 1.4;
  } else {
    if (turnInput !== 0) {
      playerVelocity.set(0, 0, 0);
    } else {
      playerVelocity.lerp(tempVec.set(0, 0, 0), 0.16);
    }
  }

  player.position.addScaledVector(playerVelocity, delta);
  player.position.x = THREE.MathUtils.clamp(player.position.x, -worldSize + 10, worldSize - 10);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -worldSize + 10, worldSize - 10);
  updatePlayerVertical(delta);
  updateJumpInteractions();

  const isDancing = game.danceTimer > 0;
  if (isDancing) {
    game.danceTimer = Math.max(0, game.danceTimer - delta);
    updateGrowlitheDance(delta);
  } else {
    resetGrowlitheDancePose();
  }

  const bob = Math.sin(player.userData.walkCycle * 2) * Math.min(playerVelocity.length() / 9, 1) * 0.07;
  player.children[0].position.y = 1.15 + bob;
  player.children[1].position.y = 1.25 + bob * 0.7;

  player.userData.legs.forEach((leg) => {
    const phase = player.userData.walkCycle + leg.userData.index * 0.85;
    const side = leg.position.x > 0 ? 1 : -1;
    leg.rotation.z = side * (0.06 + Math.sin(phase) * 0.13);
    leg.rotation.x = Math.cos(phase) * 0.08;
    const walkingLift = Math.max(0, Math.sin(phase)) * Math.min(playerVelocity.length() / 9, 1) * 0.12;
    leg.position.y = 0.86 + walkingLift;
    game.maxLegLift = Math.max(game.maxLegLift, walkingLift);
  });

  if (isDancing) {
    updateDanceLegs();
  }

  game.attackCooldown = Math.max(0, game.attackCooldown - delta);
  if (game.attackTimer > 0) {
    game.attackTimer = Math.max(0, game.attackTimer - delta);
    const t = 1 - game.attackTimer / 0.36;
    const swing = Math.sin(t * Math.PI);
    swordAnchor.rotation.z = -1.15 - swing * 1.75;
    swordAnchor.rotation.x = 0.3 + swing * 0.68;
    swordTrail.visible = true;
    swordTrail.material.opacity = swing * 0.58;
    swordTrail.rotation.z = -0.72 + t * 1.46;
    swordTrail.scale.setScalar(0.9 + swing * 0.16);
  } else {
    swordAnchor.rotation.z = THREE.MathUtils.lerp(swordAnchor.rotation.z, -1.15, 0.14);
    swordAnchor.rotation.x = THREE.MathUtils.lerp(swordAnchor.rotation.x, 0.35, 0.14);
    swordTrail.material.opacity = THREE.MathUtils.lerp(swordTrail.material.opacity, 0, 0.22);
    swordTrail.visible = swordTrail.material.opacity > 0.02;
  }
}

function queuePlayerTurn(direction) {
  if (game.phase === "launching" || game.phase === "space" || game.danceTimer > 0) return;
  game.targetYaw = normalizeAngle(game.targetYaw + direction * (Math.PI / 12));
  holdGameplayCamera();
}

function updateGrowlitheDance(delta) {
  const parts = player.userData.danceParts;
  if (!parts) return;

  const t = clock.elapsedTime;
  const beat = Math.sin(t * 9);
  const sideBeat = Math.sin(t * 4.5);
  const macarenaStep = Math.floor((t * 3.2) % 8);

  player.rotation.y += delta * (1.3 + Math.max(0, sideBeat) * 1.6);
  player.position.y += Math.abs(beat) * 0.012;

  parts.body.rotation.z = sideBeat * 0.18;
  parts.body.rotation.x = Math.sin(t * 6) * 0.06;
  parts.mane.rotation.z = -sideBeat * 0.12;
  parts.saddle.rotation.z = sideBeat * 0.13;
  parts.tailBase.rotation.y = Math.sin(t * 8) * 0.38;
  parts.tailBase.rotation.z = Math.cos(t * 7) * 0.18;
  parts.rider.rotation.z = -sideBeat * 0.16;

  const armSwing = Math.sin(t * 10) * 0.14;
  const left = parts.leftArm.rotation;
  const right = parts.rightArm.rotation;

  if (macarenaStep === 0) {
    left.set(1.2, 0.12, -1.1 + armSwing);
    right.set(0.45, 0, -0.42);
  } else if (macarenaStep === 1) {
    left.set(1.2, 0.12, -1.1);
    right.set(1.2, -0.12, 1.1 - armSwing);
  } else if (macarenaStep === 2) {
    left.set(0.1, 0.3, -1.42);
    right.set(1.2, -0.12, 1.1);
  } else if (macarenaStep === 3) {
    left.set(0.1, 0.3, -1.42);
    right.set(0.1, -0.3, 1.42);
  } else if (macarenaStep === 4) {
    left.set(-0.7, 0.18, -0.82);
    right.set(0.1, -0.3, 1.42);
  } else if (macarenaStep === 5) {
    left.set(-0.7, 0.18, -0.82);
    right.set(-0.7, -0.18, 0.82);
  } else if (macarenaStep === 6) {
    left.set(-0.35, 0.18, -0.5 + armSwing);
    right.set(-0.35, -0.18, 0.5 - armSwing);
  } else {
    left.set(0.55, 0.05, -0.95);
    right.set(0.55, -0.05, 0.95);
  }
}

function updateDanceLegs() {
  const t = clock.elapsedTime;
  player.userData.legs.forEach((leg, index) => {
    const side = leg.position.x > 0 ? 1 : -1;
    const frontBack = leg.position.z < 0 ? 1 : -1;
    leg.rotation.x = Math.sin(t * 11 + index * 1.7) * 0.32;
    leg.rotation.z = side * (0.2 + Math.cos(t * 8 + frontBack) * 0.2);
    leg.position.y = 0.86 + Math.max(0, Math.sin(t * 10 + index)) * 0.08;
  });
}

function resetGrowlitheDancePose() {
  const parts = player.userData.danceParts;
  if (!parts) return;

  parts.body.rotation.set(0, 0, 0);
  parts.mane.rotation.set(0, 0, 0);
  parts.saddle.rotation.set(0, 0, 0);
  parts.tailBase.rotation.set(0.38, 0, 0);
  parts.rider.rotation.set(0, 0, 0);
  parts.leftArm.rotation.set(0, 0, -0.22);
  parts.rightArm.rotation.set(0, 0, -0.42);
  player.userData.legs.forEach((leg) => {
    leg.position.y = 0.86;
  });
}

function updateIdlePlayer(delta) {
  player.userData.walkCycle += delta * 1.2;
  player.userData.legs.forEach((leg) => {
    const side = leg.position.x > 0 ? 1 : -1;
    leg.rotation.z = side * (0.06 + Math.sin(player.userData.walkCycle + leg.userData.index) * 0.035);
  });
}

function updatePlayerVertical(delta) {
  const surface = getLandingSurface(player.position.x, player.position.z);

  if (!player.userData.grounded || playerVerticalVelocity !== 0) {
    playerVerticalVelocity -= 24 * delta;
    player.position.y += playerVerticalVelocity * delta;

    if (player.position.y <= surface.y) {
      player.position.y = surface.y;
      playerVerticalVelocity = 0;
      player.userData.grounded = true;
      onPlayerLanded(surface);
    } else {
      player.userData.grounded = false;
    }
  } else {
    player.position.y = surface.y;
    player.userData.grounded = true;
  }
}

function updateJumpInteractions() {
  if (game.phase !== "desert" || playerVerticalVelocity >= 0 || player.userData.grounded) return;

  const flatDistanceToGosha = flatDistance(player.position, mountGosha.position);
  if (flatDistanceToGosha < 3.6 && player.position.y <= mountGosha.position.y + 5.4) {
    captureMountByJump();
  }
}

function onPlayerLanded(surface) {
  if (surface.type === "rock" && game.phase === "desert") {
    startRockDance();
  }
}

function requestJumpOrBoard() {
  if (game.lost || game.phase === "launching" || game.phase === "space") return;

  if (game.phase === "desert" && player.position.distanceTo(rocket.position) < rocket.userData.boardRadius) {
    beginRocketBoarding("desert");
    return;
  }

  if (game.phase === "planet" && player.position.distanceTo(rocket.position) < rocket.userData.boardRadius) {
    beginRocketBoarding("planet");
    return;
  }

  if (player.userData.grounded) {
    playerVerticalVelocity = 10.8;
    player.userData.grounded = false;
    if (game.phase === "desert") {
      setStatus("Jump onto Mount Gosha to capture, or land on a rock to dance.", 1.8);
    }
  }
}

function startRockDance() {
  game.danceTimer = 3.4;
  setStatus("Rock dance. Growlithe does the Macarena.", 3.4);
}

function captureMountByJump() {
  game.capture = 100;
  player.position.set(mountGosha.position.x, mountGosha.position.y + 4.2, mountGosha.position.z);
  playerVerticalVelocity = 0;
  player.userData.grounded = true;
  completeMountGoshaCapture("You jumped onto Mount Gosha and captured it. The piglins scatter.");
}

function completeMountGoshaCapture(message) {
  if (game.won) return;

  game.capture = 100;
  game.won = true;
  game.cameraShake = Math.max(game.cameraShake, 0.16);
  setStatus(message, 8);
  mountGosha.children.forEach((child) => {
    if (child.material?.emissive) {
      child.material.emissive.setHex(0x14f7ff);
    }
  });
  scatterPiglinsFromGosha();
}

function scatterPiglinsFromGosha() {
  piglins.forEach((piglin, index) => {
    if (!piglin.visible) return;

    const away = piglin.position.clone().sub(player.position);
    away.y = 0;
    if (away.lengthSq() < 0.001) {
      away.set(Math.sin(index), 0, Math.cos(index));
    }
    away.normalize();
    piglin.userData.fleeing = true;
    piglin.userData.fleeTimer = THREE.MathUtils.randFloat(1.4, 2.35);
    piglin.userData.velocity.copy(away).multiplyScalar(THREE.MathUtils.randFloat(16, 24));
    piglin.userData.velocity.y = THREE.MathUtils.randFloat(8, 13);
    piglin.userData.isBlocking = false;
    piglin.userData.forceBlocking = false;
    piglin.rotation.x = 0;
    piglin.rotation.z = 0;
  });
}

function updateFleeingPiglins(delta) {
  piglins.forEach((piglin, index) => {
    const data = piglin.userData;
    if (!data.fleeing || !piglin.visible) return;

    data.fleeTimer -= delta;
    data.velocity.y -= 8.5 * delta;
    piglin.position.addScaledVector(data.velocity, delta);
    piglin.rotation.x += delta * (3.2 + index * 0.18);
    piglin.rotation.z += delta * (2.2 + index * 0.15);
    data.velocity.multiplyScalar(0.985);

    if (data.fleeTimer <= 0 || piglin.position.y < groundY(piglin.position.x, piglin.position.z) - 3) {
      piglin.visible = false;
      data.fleeing = false;
    }
  });
}

function updatePiglins(delta) {
  piglins.forEach((piglin, index) => {
    const data = piglin.userData;

    if (data.respawn > 0) {
      data.respawn -= delta;

      if (data.isDown) {
        data.downTimer -= delta;
        piglin.position.addScaledVector(data.velocity, delta);
        data.velocity.multiplyScalar(0.9);
        piglin.position.y = groundY(piglin.position.x, piglin.position.z);
        piglin.rotation.x = THREE.MathUtils.lerp(piglin.rotation.x, -Math.PI / 2, 0.16);
        piglin.rotation.z = THREE.MathUtils.lerp(piglin.rotation.z, 0.24, 0.12);

        if (data.downTimer <= 0) {
          piglin.visible = false;
          data.isDown = false;
        }

        return;
      }

      if (data.respawn <= 0) {
        resetPiglin(piglin);
      }
      return;
    }

    data.attackCooldown = Math.max(0, data.attackCooldown - delta);
    data.blockCooldown = Math.max(0, data.blockCooldown - delta);

    const toPlayer = player.position.clone().sub(piglin.position);
    const distance = toPlayer.length();
    data.isBlocking = data.forceBlocking || (distance < 8 && data.blockCooldown <= 0 && Math.sin(clock.elapsedTime * 2.8 + index) > 0.35);

    if (data.stun > 0) {
      data.stun -= delta;
      piglin.position.addScaledVector(data.velocity, delta);
      data.velocity.multiplyScalar(0.91);
    } else if (distance < 78) {
      toPlayer.y = 0;
      toPlayer.normalize();
      const speed = data.speed * (distance < 18 ? 1.15 : 1);
      piglin.position.addScaledVector(toPlayer, speed * delta);
      piglin.rotation.y = yawForDirection(toPlayer);

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
        piglin.rotation.y = yawForDirection(home);
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

    const weapon = piglin.children[6];
    if (weapon) {
      weapon.rotation.z = data.isBlocking ? -1.05 : -0.24;
      weapon.rotation.x = data.isBlocking ? 0.9 : 0;
    }
  });
}

function updateChickens(delta) {
  chickens.forEach((chicken, index) => {
    const data = chicken.userData;
    if (data.eaten || !chicken.visible) return;

    data.peckTimer -= delta;
    if (data.peckTimer <= 0) {
      data.wanderAngle += THREE.MathUtils.randFloat(-0.9, 0.9);
      data.peckTimer = THREE.MathUtils.randFloat(0.55, 1.55);
    }

    const direction = tempVec.set(Math.sin(data.wanderAngle), 0, Math.cos(data.wanderAngle));
    const homeOffset = data.spawn.clone().sub(chicken.position);
    homeOffset.y = 0;
    if (homeOffset.length() > 7) {
      direction.copy(homeOffset.normalize());
      data.wanderAngle = Math.atan2(direction.x, direction.z);
    }

    const playerOffset = chicken.position.clone().sub(player.position);
    playerOffset.y = 0;
    if (playerOffset.length() < 3.4) {
      direction.copy(playerOffset.normalize());
      data.wanderAngle = Math.atan2(direction.x, direction.z);
    }

    chicken.position.addScaledVector(direction, data.speed * delta);
    chicken.position.y = planetHeight(chicken.position.x, chicken.position.z);
    chicken.rotation.y = THREE.MathUtils.lerp(chicken.rotation.y, data.wanderAngle, 0.08);
    chicken.rotation.x = Math.sin(clock.elapsedTime * 8 + index) * 0.035;
    chicken.children.forEach((child, childIndex) => {
      if (childIndex >= 5 && childIndex <= 8) {
        child.rotation.x = Math.sin(clock.elapsedTime * 10 + index + childIndex) * 0.18;
      }
    });
  });
}

function eatNearestChicken() {
  if (game.phase !== "planet" || game.lost) return false;

  const nearest = getNearestChicken();

  if (!nearest || nearest.distance > 2.4) {
    setStatus("Get closer to a chicken, then press E to eat.", 1.5);
    return false;
  }

  nearest.chicken.userData.eaten = true;
  nearest.chicken.visible = false;
  game.chickensEaten += 1;
  game.health = Math.min(100, game.health + 8);
  game.cameraShake = Math.max(game.cameraShake, 0.05);
  setStatus("Growlithe ate a planet chicken.", 2.2);
  return true;
}

function getNearestChicken() {
  return chickens
    .filter((chicken) => chicken.visible && !chicken.userData.eaten)
    .map((chicken) => ({
      chicken,
      distance: flatDistance(player.position, chicken.position),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function updatePlanetHazards(delta) {
  game.hazardCooldown = Math.max(0, game.hazardCooldown - delta);

  lavaRivers.forEach((river) => {
    const pulse = 0.55 + Math.sin(clock.elapsedTime * 3.4 + river.userData.pulse) * 0.18;
    river.children[1].material.opacity = pulse;
    river.children[0].material.emissiveIntensity = 1.2 + pulse * 0.55;
    river.userData.flowBands.forEach((band) => {
      const t = (clock.elapsedTime * 0.24 + band.userData.offset) % 1;
      band.position.copy(river.userData.start).lerp(river.userData.end, t);
      band.position.y = planetHeight(band.position.x, band.position.z) + 0.16;
      band.rotation.y = river.userData.rotationY + Math.sin(clock.elapsedTime * 5 + band.userData.offset * 9) * 0.04;
      band.scale.x = 0.75 + Math.sin(clock.elapsedTime * 7 + band.userData.offset * 12) * 0.18;
      band.material.opacity = 0.3 + Math.sin(clock.elapsedTime * 4 + band.userData.offset * 8) * 0.18;
    });
  });

  volcanoes.forEach((volcano) => {
    const pulse = 0.7 + Math.sin(clock.elapsedTime * 4 + volcano.userData.pulse) * 0.28;
    volcano.userData.glow.intensity = 1.2 + pulse;
    volcano.userData.crater.scale.setScalar(0.95 + pulse * 0.08);
    volcano.userData.spewTimer -= delta;
    if (volcano.userData.spewTimer <= 0) {
      spawnVolcanoLava(volcano);
      volcano.userData.spewTimer = THREE.MathUtils.randFloat(0.55, 1.05);
    }
  });

  const lavaHit = lavaRivers.some((river) => distanceToSegment2D(player.position, river.userData.start, river.userData.end) < river.userData.width * 0.55);
  const volcanoHit = volcanoes.some((volcano) => flatDistance(player.position, volcano.position) < volcano.userData.hazardRadius);

  if ((lavaHit || volcanoHit) && game.hazardCooldown <= 0) {
    game.hazardCooldown = 0.85;
    damagePlayer(lavaHit ? 9 : 7, lavaHit ? "Lava burns Growlithe. Evade the river." : "Volcano heat is too close. Move away.");
  }
}

function startDragonEncounter() {
  clearDragonFireballs();
  clearFirebirds();
  game.dragonActive = true;
  game.dragonFireTimer = 1.8;
  game.chickensScorched = 0;

  if (redDragon) {
    redDragon.visible = true;
    redDragon.position.copy(redDragon.userData.base);
    redDragon.rotation.set(0, 0, 0);
    redDragon.scale.setScalar(1.04);
  }
}

function stopDragonEncounter() {
  game.dragonActive = false;
  game.dragonFireTimer = 0;
  if (redDragon) {
    redDragon.visible = false;
  }
  clearDragonFireballs();
  clearFirebirds();
  clearPokeballs();
}

function updateDragonEncounter(delta) {
  if (game.phase !== "planet" || !game.dragonActive) return;

  updateDragonFireballs(delta);

  if (redDragon?.visible) {
    updateRedDragon(delta);
    game.dragonFireTimer -= delta;

    if (game.dragonFireTimer <= 0) {
      spawnDragonFireball();
      game.dragonFireTimer = THREE.MathUtils.randFloat(1.35, 1.95);
    }
  }

  updateFirebirds(delta);
}

function updateRedDragon(delta) {
  const data = redDragon.userData;
  data.orbitAngle += delta * 0.58;

  const center = tempVec.set(-4, planetHeight(-4, -2) + 9.8, -2);
  redDragon.position.set(
    center.x + Math.sin(data.orbitAngle) * 22,
    center.y + Math.sin(clock.elapsedTime * 2.1) * 1.2,
    center.z + Math.cos(data.orbitAngle) * 18,
  );

  const target = getNearestVisibleChicken()?.position || player.position;
  redDragon.lookAt(target.x, target.y + 0.8, target.z);
  redDragon.rotation.z = Math.sin(clock.elapsedTime * 2.5) * 0.08;
  data.leftWing.rotation.z = 0.22 + Math.sin(clock.elapsedTime * 7.5) * 0.34;
  data.rightWing.rotation.z = -0.22 - Math.sin(clock.elapsedTime * 7.5) * 0.34;
  data.throatGlow.intensity = 1 + Math.max(0, Math.sin(clock.elapsedTime * 8)) * 1.3;
}

function spawnDragonFireball() {
  const targetChicken = getNearestVisibleChicken();
  if (!targetChicken || dragonFireballs.length > 14) return;

  const origin = redDragon.userData.mouth.getWorldPosition(new THREE.Vector3());
  const target = targetChicken.position.clone().add(new THREE.Vector3(0, 0.52, 0));
  const direction = target.sub(origin).normalize();

  const fireball = new THREE.Group();
  fireball.name = "Dragon Chicken Fireball";
  fireball.position.copy(origin);

  const outer = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 10), materials.fireball);
  outer.name = "Fireball Flame";
  fireball.add(outer);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), materials.fireballCore);
  core.name = "Fireball Core";
  fireball.add(core);

  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.9, 10), materials.firebirdFlame);
  tail.name = "Fireball Tail";
  tail.rotation.x = Math.PI / 2;
  tail.position.z = 0.46;
  fireball.add(tail);

  const glow = new THREE.PointLight(0xff5b18, 1.3, 11);
  fireball.add(glow);

  fireball.userData = {
    velocity: direction.multiplyScalar(19),
    targetChicken,
    life: 2.8,
    maxLife: 2.8,
  };

  dragonFireballs.push(fireball);
  scene.add(fireball);
  setStatus("The red dragon spits fireballs at the chickens.", 1.8);
}

function updateDragonFireballs(delta) {
  for (let i = dragonFireballs.length - 1; i >= 0; i -= 1) {
    const fireball = dragonFireballs[i];
    fireball.userData.life -= delta;
    fireball.position.addScaledVector(fireball.userData.velocity, delta);
    fireball.rotation.x += delta * 8;
    fireball.rotation.y += delta * 11;

    const pulse = 0.9 + Math.sin(clock.elapsedTime * 18 + i) * 0.18;
    fireball.scale.setScalar(pulse);
    fireball.children.forEach((child, childIndex) => {
      if (child.material?.opacity !== undefined) {
        child.material.opacity = childIndex === 1 ? 0.82 : 0.76 + pulse * 0.1;
      }
    });

    const targetChicken = fireball.userData.targetChicken;
    if (targetChicken?.visible && !targetChicken.userData.eaten && fireball.position.distanceTo(targetChicken.position) < 1.05) {
      turnChickenIntoMoltres(targetChicken, fireball.position.clone());
      removeDragonFireball(i);
      continue;
    }

    const ground = planetHeight(fireball.position.x, fireball.position.z) + 0.12;
    if (fireball.position.y <= ground || fireball.userData.life <= 0) {
      createHitBurst(fireball.position.clone().setY(Math.max(fireball.position.y, ground)), new THREE.Vector3(0, 1, 0));
      removeDragonFireball(i);
    }
  }
}

function turnChickenIntoMoltres(chicken, impactPosition) {
  const transformPosition = chicken.position.clone();
  chicken.userData.eaten = true;
  chicken.visible = false;
  game.chickensScorched += 1;
  game.cameraShake = Math.max(game.cameraShake, 0.1);
  createDamageNumber(impactPosition.clone().add(new THREE.Vector3(0, 0.8, 0)), "MOLTRES", "enemy");
  createHitBurst(impactPosition, new THREE.Vector3(0, 1, 0));

  const bird = createFirebird(game.chickensScorched);
  bird.name = `Moltres From Chicken ${game.chickensScorched}`;
  bird.position.set(
    transformPosition.x,
    planetHeight(transformPosition.x, transformPosition.z) + 2.9,
    transformPosition.z,
  );
  const awayFromDragon = redDragon
    ? transformPosition.clone().sub(redDragon.position).setY(0).normalize()
    : new THREE.Vector3(0, 0, -1);
  bird.userData.velocity.copy(awayFromDragon.multiplyScalar(5.2));
  bird.userData.velocity.y = 4.5;
  firebirds.push(bird);
  scene.add(bird);

  setStatus("A fireball transformed a chicken into a Moltres-like attacker.", 2.4);
}

function updateFirebirds(delta) {
  firebirds.forEach((bird, index) => {
    const data = bird.userData;
    data.attackCooldown = Math.max(0, data.attackCooldown - delta);

    const target = player.position.clone().add(new THREE.Vector3(0, 1.45, 0));
    const toPlayer = target.sub(bird.position);
    const distance = toPlayer.length();
    const direction = distance > 0.001 ? toPlayer.normalize() : new THREE.Vector3(0, 0, -1);
    const side = data.side || (index === 0 ? -1 : 1);
    const orbit = new THREE.Vector3(-direction.z * side, 0.28, direction.x * side).normalize();
    const desired = direction.multiplyScalar(distance > 4 ? 13 : 7).addScaledVector(orbit, 3.4);

    data.velocity.lerp(desired, 0.07);
    bird.position.addScaledVector(data.velocity, delta);

    const ground = planetHeight(bird.position.x, bird.position.z) + 2.5;
    if (bird.position.y < ground) {
      bird.position.y = ground;
      data.velocity.y = Math.max(data.velocity.y, 2.2);
    }

    bird.lookAt(player.position.x, player.position.y + 1.2, player.position.z);
    bird.rotation.z += Math.sin(clock.elapsedTime * 5 + index) * 0.015;

    const flap = Math.sin(clock.elapsedTime * 11.5 + data.flapOffset);
    data.leftWing.rotation.z = 0.2 + flap * 0.42;
    data.rightWing.rotation.z = -0.2 - flap * 0.42;
    data.leftWing.rotation.y = -0.12 + flap * 0.14;
    data.rightWing.rotation.y = 0.12 - flap * 0.14;
    data.flameParts.forEach((flame, flameIndex) => {
      const flicker = Math.sin(clock.elapsedTime * 13 + flame.userData.flickerOffset + flameIndex * 0.37);
      flame.scale.set(0.92 + flicker * 0.08, 1 + Math.max(0, flicker) * 0.18, 0.92 + flicker * 0.08);
      flame.rotation.y = Math.sin(clock.elapsedTime * 7 + flame.userData.flickerOffset) * 0.05;
    });
    bird.scale.setScalar(1.3 + Math.max(0, flap) * 0.06);

    if (distance < 2.25 && data.attackCooldown <= 0) {
      data.attackCooldown = 1.15;
      data.velocity.addScaledVector(direction, -8);
      damagePlayer(7, "A Moltres-like attacker raked Growlithe. Keep moving.");
    }
  });
}

function getNearestVisibleChicken() {
  return chickens
    .filter((chicken) => chicken.visible && !chicken.userData.eaten)
    .sort((a, b) => redDragon.position.distanceTo(a.position) - redDragon.position.distanceTo(b.position))[0];
}

function removeDragonFireball(index) {
  const fireball = dragonFireballs[index];
  scene.remove(fireball);
  fireball.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
  dragonFireballs.splice(index, 1);
}

function clearDragonFireballs() {
  for (let i = dragonFireballs.length - 1; i >= 0; i -= 1) {
    removeDragonFireball(i);
  }
}

function clearFirebirds() {
  for (let i = firebirds.length - 1; i >= 0; i -= 1) {
    const bird = firebirds[i];
    scene.remove(bird);
    bird.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
    });
    firebirds.splice(i, 1);
  }
}

function spawnPokeballs(position, count = 3) {
  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + THREE.MathUtils.randFloat(-0.28, 0.28);
    const radius = THREE.MathUtils.randFloat(0.8, 1.45);
    const x = THREE.MathUtils.clamp(position.x + Math.sin(angle) * radius, -worldSize + 12, worldSize - 12);
    const z = THREE.MathUtils.clamp(position.z + Math.cos(angle) * radius, -worldSize + 12, worldSize - 12);
    const y = planetHeight(x, z) + 0.55;
    const tint = new THREE.Color().setHSL(THREE.MathUtils.randFloat(0, 1), 0.72, 0.64);
    const material = new THREE.MeshStandardMaterial({
      map: pokeballTexture,
      color: tint,
      roughness: 0.38,
      metalness: 0.08,
      emissive: tint.clone().multiplyScalar(0.16),
      emissiveIntensity: 0.36,
    });
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.46, 32, 18), material);
    ball.name = "Random Color Pokeball";
    ball.position.set(x, y, z);
    ball.rotation.set(
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI * 2),
      THREE.MathUtils.randFloat(0, Math.PI),
    );
    ball.castShadow = true;
    ball.userData = {
      baseY: y,
      bobOffset: THREE.MathUtils.randFloat(0, Math.PI * 2),
      spinSpeed: THREE.MathUtils.randFloat(1.2, 2.6),
      tint,
    };
    pokeballs.push(ball);
    scene.add(ball);
  }
}

function updatePokeballs(delta) {
  pokeballs.forEach((ball) => {
    ball.position.y = ball.userData.baseY + Math.sin(clock.elapsedTime * 3.8 + ball.userData.bobOffset) * 0.16;
    ball.rotation.y += delta * ball.userData.spinSpeed;
    ball.rotation.x += delta * ball.userData.spinSpeed * 0.35;
  });
}

function getNearestPokeball() {
  return pokeballs
    .map((ball, index) => ({
      ball,
      index,
      distance: flatDistance(player.position, ball.position),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function captureNearestPokeball() {
  if (pokeballs.length === 0 || game.phase !== "planet") return false;

  const nearest = getNearestPokeball();

  if (!nearest || nearest.distance > 2.6) {
    return false;
  }

  const { ball, index } = nearest;
  const position = ball.position.clone();
  scene.remove(ball);
  ball.geometry.dispose();
  ball.material.dispose();
  pokeballs.splice(index, 1);
  game.pokeballsCollected += 1;
  game.cameraShake = Math.max(game.cameraShake, 0.05);
  createDamageNumber(position.clone().add(new THREE.Vector3(0, 0.8, 0)), "+1 BALL", "block");
  createHitBurst(position, new THREE.Vector3(0, 1, 0));
  setStatus("Pokeball captured.", 1.6);
  return true;
}

function clearPokeballs() {
  for (let i = pokeballs.length - 1; i >= 0; i -= 1) {
    const ball = pokeballs[i];
    scene.remove(ball);
    ball.geometry.dispose();
    ball.material.dispose();
    pokeballs.splice(i, 1);
  }
}

function spawnCapturePokemon(position) {
  if (!capturePokemon) return;

  const x = THREE.MathUtils.clamp(position.x, -worldSize + 12, worldSize - 12);
  const z = THREE.MathUtils.clamp(position.z, -worldSize + 12, worldSize - 12);
  capturePokemon.position.set(x, planetHeight(x, z), z);
  capturePokemon.rotation.set(0, yawForDirection(player.position.clone().sub(capturePokemon.position)), 0);
  capturePokemon.visible = true;
  capturePokemon.userData.captured = false;
  capturePokemon.userData.captureReady = true;
  capturePokemon.userData.followVelocity.set(0, 0, 0);
  game.capturePokemonSpawned = true;
  createHitBurst(capturePokemon.position.clone().add(new THREE.Vector3(0, 1.05, 0)), new THREE.Vector3(0, 1, 0));
  setStatus("A helper Pokemon appeared. Get close and press E to capture it.", 4);
}

function tryCapturePokemon() {
  if (!capturePokemon?.visible || capturePokemon.userData.captured || !capturePokemon.userData.captureReady) {
    return false;
  }

  const distance = flatDistance(player.position, capturePokemon.position);
  if (distance > 3.1) {
    if (game.phase === "planet") {
      setStatus("Get closer to the helper Pokemon, then press E to capture it.", 1.6);
    }
    return false;
  }

  capturePokemon.userData.captured = true;
  capturePokemon.userData.captureReady = false;
  game.capturePokemonCaptured = true;
  game.companionCapturePower = 1;
  game.cameraShake = Math.max(game.cameraShake, 0.08);
  createDamageNumber(capturePokemon.position.clone().add(new THREE.Vector3(0, 1.7, 0)), "CAPTURED", "block");
  setStatus("Helper Pokemon captured. It will help capture more Pokemon in future battles.", 4.5);
  return true;
}

function updateCapturePokemon(delta) {
  if (!capturePokemon?.visible) return;

  const data = capturePokemon.userData;
  const elapsed = clock.elapsedTime + data.bobOffset;
  const ground = getCurrentGroundY(capturePokemon.position.x, capturePokemon.position.z);

  if (data.captured) {
    const followOffset = new THREE.Vector3(2.2, 0, 2.7).applyAxisAngle(yAxis, player.rotation.y);
    const desired = player.position.clone().add(followOffset);
    desired.y = getCurrentGroundY(desired.x, desired.z);
    const toTarget = desired.sub(capturePokemon.position);
    toTarget.y = 0;
    if (toTarget.length() > 0.15) {
      data.followVelocity.lerp(toTarget.normalize().multiplyScalar(6.2), 0.08);
      capturePokemon.position.addScaledVector(data.followVelocity, delta);
    } else {
      data.followVelocity.multiplyScalar(0.88);
    }
    capturePokemon.position.y = getCurrentGroundY(capturePokemon.position.x, capturePokemon.position.z) + Math.sin(elapsed * 4.5) * 0.08;
    capturePokemon.rotation.y = dampAngle(capturePokemon.rotation.y, yawForDirection(player.position.clone().sub(capturePokemon.position)), 7, delta);
  } else {
    capturePokemon.position.y = ground + Math.sin(elapsed * 3.8) * 0.12;
    capturePokemon.rotation.y += delta * 0.8;
  }

  data.sparkAnchor.rotation.y -= delta * (data.captured ? 2.6 : 1.5);
  data.sparkAnchor.children.forEach((spark, index) => {
    const angle = data.sparkAnchor.rotation.y + spark.userData.angle;
    const radius = data.captured ? 0.86 : 0.7;
    spark.position.set(Math.sin(angle) * radius, Math.sin(elapsed * 5 + index) * 0.16, Math.cos(angle) * radius);
    spark.rotation.x += delta * 3.4;
    spark.rotation.y += delta * 4.2;
    spark.material.opacity = data.captured ? 0.92 : 0.68 + Math.sin(elapsed * 4 + index) * 0.18;
  });
}

function distanceToSegment2D(point, start, end) {
  const px = point.x;
  const pz = point.z;
  const sx = start.x;
  const sz = start.z;
  const ex = end.x;
  const ez = end.z;
  const dx = ex - sx;
  const dz = ez - sz;
  const lengthSq = dx * dx + dz * dz;
  if (lengthSq <= 0.0001) return Math.hypot(px - sx, pz - sz);

  const t = THREE.MathUtils.clamp(((px - sx) * dx + (pz - sz) * dz) / lengthSq, 0, 1);
  return Math.hypot(px - (sx + dx * t), pz - (sz + dz * t));
}

function spawnVolcanoLava(volcano) {
  if (lavaBombs.length > 70) return;

  const origin = volcano.localToWorld(new THREE.Vector3(0, 8.9, 0));
  const count = THREE.MathUtils.randInt(2, 4);
  for (let i = 0; i < count; i += 1) {
    const material = materials.lavaCore.clone();
    material.opacity = THREE.MathUtils.randFloat(0.72, 0.95);
    const bomb = new THREE.Mesh(
      new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.12, 0.28), 10, 8),
      material,
    );
    bomb.position.copy(origin);
    const angle = THREE.MathUtils.randFloat(0, Math.PI * 2);
    const speed = THREE.MathUtils.randFloat(2.8, 5.8);
    bomb.userData.velocity = new THREE.Vector3(
      Math.sin(angle) * speed,
      THREE.MathUtils.randFloat(7.2, 10.5),
      Math.cos(angle) * speed,
    );
    bomb.userData.life = THREE.MathUtils.randFloat(1.2, 1.8);
    bomb.userData.maxLife = bomb.userData.life;
    bomb.castShadow = false;
    lavaBombs.push(bomb);
    scene.add(bomb);
    game.lavaSpewCount += 1;
  }
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
    completeMountGoshaCapture("Mount Gosha captured. Piglins fly away and the world stays open.");
  }
}

function updateMount(elapsed) {
  if (game.phase !== "desert") return;

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

function updateRocket(delta, elapsed) {
  if (!rocket) return;

  if (game.phase === "desert") {
    rocket.position.y = rocketHome.y + Math.sin(elapsed * 1.6) * 0.035;
    rocket.rotation.set(0, Math.sin(elapsed * 0.6) * 0.02, 0);
    updateRocketFlame(0);
    return;
  }

  if (game.phase === "launching") {
    game.launchTimer += delta;
    const lift = game.launchTimer * game.launchTimer * 14;
    const launchBase = game.launchOrigin === "planet"
      ? new THREE.Vector3(8, planetHeight(8, 20), 20)
      : rocketHome;
    rocket.position.set(launchBase.x, launchBase.y + lift, launchBase.z);
    rocket.rotation.set(Math.sin(elapsed * 12) * 0.025, Math.sin(elapsed * 9) * 0.025, 0);
    updateRocketFlame(1, true);
    game.cameraShake = Math.max(game.cameraShake, 0.09);

    if (game.launchTimer >= 2.65) {
      beginSpaceFlight();
    }
    return;
  }

  if (game.phase === "space") {
    const targetPlanet = game.flightTarget === "desert" ? originalPlanet : destinationPlanet;
    const toPlanet = targetPlanet.position.clone().sub(rocket.position);
    const distance = toPlanet.length();
    const direction = toPlanet.normalize();
    const steer = tempVec.set(0, 0, 0);

    if (keys.get("KeyA") || keys.get("ArrowLeft")) steer.x -= 1;
    if (keys.get("KeyD") || keys.get("ArrowRight")) steer.x += 1;
    if (keys.get("KeyW") || keys.get("ArrowUp")) steer.y += 1;
    if (keys.get("KeyS") || keys.get("ArrowDown")) steer.y -= 1;

    shipVelocity.lerp(direction.multiplyScalar(35).add(steer.multiplyScalar(13)), 0.045);
    rocket.position.addScaledVector(shipVelocity, delta);

    const flyDirection = shipVelocity.lengthSq() > 1 ? shipVelocity.clone().normalize() : direction;
    rocket.quaternion.slerp(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), flyDirection),
      0.14,
    );
    updateRocketFlame(0.92 + Math.sin(elapsed * 20) * 0.08, false);
    destinationPlanet.rotation.y += delta * 0.18;
    originalPlanet.rotation.y -= delta * 0.16;

    if (distance < 23) {
      if (game.flightTarget === "desert") {
        landBackOnDesert();
      } else {
        landOnNewPlanet();
      }
    }
  }
}

function updateRocketFlame(power, emitSmoke = false) {
  if (!rocketFlame) return;
  rocketFlame.visible = power > 0.03;
  rocketFlame.userData.power = Math.max(rocketFlame.userData.power || 0, power);

  const scale = 0.65 + power * (0.5 + Math.sin(clock.elapsedTime * 28) * 0.08);
  rocketFlame.scale.set(scale, 0.85 + power * 0.4, scale);
  rocketFlame.children.forEach((flame, index) => {
    flame.material.opacity = THREE.MathUtils.clamp(power, 0, 1) * (index === 0 ? 0.68 : index === 1 ? 0.9 : 0.72);
    flame.scale.x = 1 + Math.sin(clock.elapsedTime * (22 + index * 4)) * 0.08;
    flame.scale.z = 1 + Math.cos(clock.elapsedTime * (20 + index * 3)) * 0.08;
  });

  if (emitSmoke && power > 0.25) {
    spawnRocketSmoke();
  }
}

function spawnRocketSmoke() {
  if (smokePuffs.length > 90) return;

  const engine = rocket.localToWorld(new THREE.Vector3(0, 0.08, 0));
  const count = game.phase === "launching" ? 3 : 1;

  for (let i = 0; i < count; i += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: 0x5c5d62,
      transparent: true,
      opacity: THREE.MathUtils.randFloat(0.28, 0.46),
      depthWrite: false,
    });
    const puff = new THREE.Mesh(
      new THREE.SphereGeometry(THREE.MathUtils.randFloat(0.32, 0.78), 12, 8),
      material,
    );

    puff.position.copy(engine);
    puff.position.x += THREE.MathUtils.randFloatSpread(1.3);
    puff.position.z += THREE.MathUtils.randFloatSpread(1.3);
    puff.position.y -= THREE.MathUtils.randFloat(0.1, 0.55);
    puff.scale.set(
      THREE.MathUtils.randFloat(1.2, 2.1),
      THREE.MathUtils.randFloat(0.55, 1.05),
      THREE.MathUtils.randFloat(1.2, 2.1),
    );
    puff.userData.life = THREE.MathUtils.randFloat(1.1, 1.7);
    puff.userData.maxLife = puff.userData.life;
    puff.userData.velocity = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1.4),
      THREE.MathUtils.randFloat(-0.3, 0.7),
      THREE.MathUtils.randFloatSpread(1.4),
    );
    smokePuffs.push(puff);
    scene.add(puff);
  }
}

function startSpaceCombat() {
  clearSpaceCombat();
  game.asteroidsDestroyed = 0;
  game.lastAsteroidHitTime = 0;
  game.spaceShotCooldown = 0;
  game.asteroidSpawnTimer = 0.42;
}

function updateSpaceCombat(delta, elapsed) {
  if (game.phase !== "space" || game.lost) return;

  game.spaceShotCooldown = Math.max(0, game.spaceShotCooldown - delta);
  game.asteroidSpawnTimer -= delta;

  if (game.asteroidSpawnTimer <= 0 && asteroids.length < 7) {
    spawnAsteroid();
    game.asteroidSpawnTimer = THREE.MathUtils.randFloat(0.78, 1.2);
  }

  updateSpaceShots(delta, elapsed);
  updateAsteroids(delta);
}

function updateSpaceShots(delta, elapsed) {
  for (let i = spaceShots.length - 1; i >= 0; i -= 1) {
    const shot = spaceShots[i];
    shot.userData.life -= delta;
    shot.position.addScaledVector(shot.userData.velocity, delta);
    const pulse = 0.96 + Math.sin(elapsed * 38 + i) * 0.08;
    shot.scale.set(pulse, 1, pulse);

    let destroyed = false;
    for (let j = asteroids.length - 1; j >= 0; j -= 1) {
      const asteroid = asteroids[j];
      const hitDistance = asteroid.userData.radius + shot.userData.radius;
      if (shot.position.distanceTo(asteroid.position) <= hitDistance) {
        const hitDir = asteroid.position.clone().sub(shot.position).normalize();
        destroyAsteroid(j, hitDir);
        removeSpaceShot(i);
        destroyed = true;
        break;
      }
    }

    if (destroyed) continue;

    if (shot.userData.life <= 0 || shot.position.distanceTo(rocket.position) > 120) {
      removeSpaceShot(i);
    }
  }
}

function updateAsteroids(delta) {
  for (let i = asteroids.length - 1; i >= 0; i -= 1) {
    const asteroid = asteroids[i];
    const toShip = rocket.position.clone().sub(asteroid.position);
    const distance = toShip.length();
    const direction = distance > 0.001 ? toShip.normalize() : getRocketForward(new THREE.Vector3()).multiplyScalar(-1);

    asteroid.userData.life -= delta;
    asteroid.userData.velocity.lerp(direction.clone().multiplyScalar(asteroid.userData.speed), 0.018);
    asteroid.position.addScaledVector(asteroid.userData.velocity, delta);
    asteroid.rotation.x += asteroid.userData.spin.x * delta;
    asteroid.rotation.y += asteroid.userData.spin.y * delta;
    asteroid.rotation.z += asteroid.userData.spin.z * delta;

    if (distance < asteroid.userData.radius + 2.25) {
      const hitPosition = asteroid.position.clone();
      createHitBurst(hitPosition, asteroid.userData.velocity.clone().normalize().multiplyScalar(-1));
      removeAsteroid(i);
      damageShip(12, "Asteroid hit the rocket. Press Space to shoot incoming asteroids.", hitPosition);
      continue;
    }

    if (asteroid.userData.life <= 0 || distance > 145) {
      removeAsteroid(i);
    }
  }
}

function fireSpaceBlaster() {
  if (game.lost || game.phase !== "space" || game.spaceShotCooldown > 0) return false;

  const forward = getRocketForward(new THREE.Vector3());
  const origin = rocket.position.clone().addScaledVector(forward, 4.7);
  const shot = new THREE.Group();
  shot.name = "Rocket Space Blaster Shot";
  shot.position.copy(origin);
  shot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), forward);

  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 2.4, 14), materials.spaceShot);
  beam.position.y = -0.34;
  shot.add(beam);

  const core = new THREE.Mesh(new THREE.SphereGeometry(0.26, 18, 10), materials.spaceShotCore);
  core.position.y = 1.02;
  shot.add(core);

  shot.userData = {
    velocity: forward.clone().multiplyScalar(86),
    life: 0.92,
    maxLife: 0.92,
    radius: 0.55,
  };

  spaceShots.push(shot);
  scene.add(shot);
  game.spaceShotCooldown = 0.18;
  setStatus("Blaster fired. Break asteroids before they hit the rocket.", 0.75);
  return true;
}

function spawnAsteroid(options = {}) {
  if (!rocket) return null;

  const forward = getRocketForward(new THREE.Vector3());
  const right = getRocketRight(new THREE.Vector3());
  const up = getRocketUp(new THREE.Vector3());
  const radius = options.radius ?? THREE.MathUtils.randFloat(1.15, 2.25);
  const asteroid = createRealisticAsteroid(radius);
  const distance = options.distance ?? THREE.MathUtils.randFloat(34, 54);
  const lateral = options.lateral ?? THREE.MathUtils.randFloatSpread(23);
  const vertical = options.vertical ?? THREE.MathUtils.randFloatSpread(17);
  const speed = options.speed ?? THREE.MathUtils.randFloat(14, 23);

  asteroid.position
    .copy(rocket.position)
    .addScaledVector(forward, distance)
    .addScaledVector(right, lateral)
    .addScaledVector(up, vertical);

  const target = rocket.position
    .clone()
    .addScaledVector(right, THREE.MathUtils.randFloatSpread(options.targetSpread ?? 3.2))
    .addScaledVector(up, THREE.MathUtils.randFloatSpread(options.targetSpread ?? 2.4));

  asteroid.userData = {
    radius: radius * 1.1,
    speed,
    velocity: target.sub(asteroid.position).normalize().multiplyScalar(speed),
    spin: new THREE.Vector3(
      THREE.MathUtils.randFloat(-1.1, 1.1),
      THREE.MathUtils.randFloat(-1.25, 1.25),
      THREE.MathUtils.randFloat(-1.0, 1.0),
    ),
    life: 7.5,
    maxLife: 7.5,
  };

  asteroids.push(asteroid);
  scene.add(asteroid);
  return asteroid;
}

function createRealisticAsteroid(radius) {
  const group = new THREE.Group();
  group.name = "Cratered Realistic Asteroid";
  const craters = createAsteroidCraterData(THREE.MathUtils.randInt(6, 10));
  const body = new THREE.Mesh(createAsteroidGeometry(radius, craters), materials.asteroidSurface);
  body.castShadow = true;
  group.add(body);

  craters.slice(0, 7).forEach((crater) => {
    const discRadius = radius * Math.sin(crater.size) * THREE.MathUtils.randFloat(0.72, 0.96);
    const surface = crater.normal.clone().multiplyScalar(radius * (1.006 - crater.depth * 0.18));

    const bowl = new THREE.Mesh(new THREE.CircleGeometry(discRadius, 28), materials.asteroidCrater);
    bowl.name = "Dark Asteroid Crater";
    bowl.position.copy(surface);
    bowl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), crater.normal);
    group.add(bowl);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(discRadius * 1.04, Math.max(0.022, radius * 0.018), 8, 30),
      materials.asteroidRim,
    );
    rim.name = "Raised Asteroid Crater Rim";
    rim.position.copy(crater.normal.clone().multiplyScalar(radius * 1.012));
    rim.quaternion.copy(bowl.quaternion);
    group.add(rim);
  });

  const pebbleCount = THREE.MathUtils.randInt(12, 18);
  for (let i = 0; i < pebbleCount; i += 1) {
    const normal = randomUnitVector();
    const pebble = new THREE.Mesh(
      new THREE.DodecahedronGeometry(THREE.MathUtils.randFloat(radius * 0.04, radius * 0.11), 0),
      i % 3 === 0 ? materials.asteroidShadow : materials.asteroidRim,
    );
    pebble.name = "Asteroid Surface Boulder";
    pebble.position.copy(normal.multiplyScalar(radius * THREE.MathUtils.randFloat(0.92, 1.08)));
    pebble.rotation.set(
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
    );
    group.add(pebble);
  }

  group.rotation.set(
    THREE.MathUtils.randFloat(0, Math.PI),
    THREE.MathUtils.randFloat(0, Math.PI),
    THREE.MathUtils.randFloat(0, Math.PI),
  );
  return group;
}

function createAsteroidCraterData(count) {
  const craters = [];
  for (let i = 0; i < count; i += 1) {
    craters.push({
      normal: randomUnitVector(),
      size: THREE.MathUtils.randFloat(0.16, 0.38),
      depth: THREE.MathUtils.randFloat(0.08, 0.2),
    });
  }
  return craters;
}

function createAsteroidGeometry(radius, craters) {
  const baseGeometry = new THREE.IcosahedronGeometry(radius, 4);
  const geometry = baseGeometry.index ? baseGeometry.toNonIndexed() : baseGeometry;
  if (geometry !== baseGeometry) baseGeometry.dispose();

  const positions = geometry.attributes.position;
  const colors = [];
  const vertex = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const color = new THREE.Color();
  const shadow = new THREE.Color(0x252b34);
  const lightDirection = new THREE.Vector3(-0.45, 0.62, 0.66).normalize();

  for (let i = 0; i < positions.count; i += 1) {
    vertex.fromBufferAttribute(positions, i);
    normal.copy(vertex).normalize();

    const grain =
      Math.sin(normal.x * 10.7 + normal.y * 2.9) * 0.055 +
      Math.sin(normal.z * 12.4 - normal.x * 4.5) * 0.045 +
      Math.cos((normal.x + normal.y - normal.z) * 17.0) * 0.035;
    const chunkiness =
      Math.sin(normal.x * 4.1 + 1.7) * 0.08 +
      Math.cos(normal.y * 4.7 - normal.z * 2.2) * 0.07;
    let craterDent = 0;
    let craterRim = 0;
    let craterShade = 0;

    craters.forEach((crater) => {
      const angle = normal.angleTo(crater.normal);
      if (angle < crater.size) {
        const t = 1 - angle / crater.size;
        const smooth = t * t * (3 - 2 * t);
        craterDent += crater.depth * smooth;
        craterShade = Math.max(craterShade, smooth);
      }

      const rimDistance = Math.abs(angle - crater.size * 0.82);
      if (rimDistance < crater.size * 0.17) {
        craterRim += (1 - rimDistance / (crater.size * 0.17)) * crater.depth * 0.55;
      }
    });

    const radial = radius * Math.max(0.62, 1 + grain + chunkiness + craterRim - craterDent);
    vertex.copy(normal).multiplyScalar(radial);
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z);

    const light = THREE.MathUtils.clamp(normal.dot(lightDirection) * 0.45 + 0.55, 0, 1);
    const warmth = THREE.MathUtils.clamp(0.5 + normal.x * 0.25 - normal.z * 0.18, 0, 1);
    color.setHSL(0.07 + warmth * 0.025, 0.06 + warmth * 0.055, 0.36 + light * 0.24 + grain * 0.28);
    if (craterShade > 0.18) {
      color.lerp(shadow, THREE.MathUtils.clamp(craterShade * 0.48, 0, 0.62));
    }
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function randomUnitVector() {
  const vector = new THREE.Vector3(
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1),
    THREE.MathUtils.randFloatSpread(1),
  );
  if (vector.lengthSq() < 0.0001) return new THREE.Vector3(0, 1, 0);
  return vector.normalize();
}

function destroyAsteroid(index, hitDir) {
  const asteroid = asteroids[index];
  if (!asteroid) return;

  const position = asteroid.position.clone();
  createHitBurst(position, hitDir.lengthSq() > 0 ? hitDir : getRocketForward(new THREE.Vector3()));
  createDamageNumber(position.clone().add(new THREE.Vector3(0, 1.1, 0)), "BOOM", "enemy");
  removeAsteroid(index);
  game.asteroidsDestroyed += 1;
  game.lastAsteroidHitTime = clock.elapsedTime;
  game.cameraShake = Math.max(game.cameraShake, 0.12);
  setStatus("Asteroid blown apart before it hit the rocket.", 1.35);
}

function removeAsteroid(index) {
  const asteroid = asteroids[index];
  if (!asteroid) return;

  scene.remove(asteroid);
  asteroid.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
  asteroids.splice(index, 1);
}

function removeSpaceShot(index) {
  const shot = spaceShots[index];
  if (!shot) return;

  scene.remove(shot);
  shot.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });
  spaceShots.splice(index, 1);
}

function clearSpaceCombat() {
  for (let i = asteroids.length - 1; i >= 0; i -= 1) {
    removeAsteroid(i);
  }

  for (let i = spaceShots.length - 1; i >= 0; i -= 1) {
    removeSpaceShot(i);
  }

  game.spaceShotCooldown = 0;
  game.asteroidSpawnTimer = 0;
}

function damageShip(amount, message, position = rocket.position.clone()) {
  if (game.lost) return;

  game.health = Math.max(0, game.health - amount);
  game.cameraShake = Math.max(game.cameraShake, 0.24);
  createDamageNumber(position.clone().add(new THREE.Vector3(0, 1.4, 0)), `-${amount}`, "player");
  setStatus(message, 2.5);

  if (game.health <= 0) {
    game.lost = true;
    shipVelocity.multiplyScalar(0.15);
    setStatus("Rocket destroyed by asteroids. Press R to try again.", 30);
  }
}

function prepareDebugSpaceFlight() {
  game.phase = "space";
  game.flightTarget = "planet";
  game.lost = false;
  game.won = false;
  game.health = Math.max(game.health, 50);
  player.visible = false;
  setWorldMode("space");
  rocket.position.set(0, 72, 36);
  shipVelocity.set(0, 8, -32);
  rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.1, -1).normalize());
  updateRocketFlame(0.92, false);
}

function beginRocketBoarding(origin = game.phase) {
  if (origin === "planet") {
    stopDragonEncounter();
  }
  game.phase = "launching";
  game.launchOrigin = origin;
  game.flightTarget = origin === "planet" ? "desert" : "planet";
  game.launchTimer = 0;
  game.won = false;
  player.visible = false;
  if (origin === "planet" && capturePokemon) {
    capturePokemon.visible = false;
  }
  game.chickenPassenger = origin === "planet" ? boardChickenPassenger() : false;
  if (rocketChickenPassenger) {
    rocketChickenPassenger.visible = game.chickenPassenger;
  }
  playerVelocity.set(0, 0, 0);
  playerVerticalVelocity = 0;
  setWorldMode("launching");
  setStatus(
    game.chickenPassenger
      ? "Rocket launching back home with a chicken passenger."
      : "Growlithe rider jumped into the rocket. Launching.",
    3.2,
  );
}

function beginSpaceFlight() {
  game.phase = "space";
  startSpaceCombat();
  if (game.flightTarget === "desert") {
    shipVelocity.set(0, 8, 32);
    rocket.position.set(0, 72, -36);
    rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.1, 1).normalize());
  } else {
    shipVelocity.set(0, 8, -32);
    rocket.position.set(0, 72, 36);
    rocket.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.1, -1).normalize());
  }
  setWorldMode("space");
  setStatus(
    game.flightTarget === "desert"
      ? "Outer space. Fly back to the original desert planet."
      : "Outer space. Fly to the green planet to escape the piglins.",
    4,
  );
}

function boardChickenPassenger() {
  const nearest = getNearestChicken();
  if (!nearest || nearest.distance > 10) return false;

  nearest.chicken.userData.eaten = true;
  nearest.chicken.visible = false;
  return true;
}

function landOnNewPlanet() {
  clearSpaceCombat();
  game.phase = "planet";
  game.escaped = true;
  game.won = false;
  setWorldMode("planet");
  player.visible = true;
  player.position.set(0, planetHeight(0, 12), 12);
  player.rotation.y = 0;
  game.targetYaw = 0;
  syncGameplayCameraToPlayer();
  player.userData.grounded = true;
  playerVerticalVelocity = 0;
  rocket.position.set(8, planetHeight(8, 20), 20);
  rocket.rotation.set(0, 0.32, 0);
  if (rocketChickenPassenger) rocketChickenPassenger.visible = false;
  if (capturePokemon?.userData.captured) {
    capturePokemon.visible = true;
    capturePokemon.position.set(-2.4, planetHeight(-2.4, 13.8), 13.8);
  }
  shipVelocity.set(0, 0, 0);
  startDragonEncounter();
  if (game.lavaSpewCount === 0) {
    volcanoes.slice(0, 1).forEach((volcano) => spawnVolcanoLava(volcano));
  }
  setStatus("You landed on a different planet. A red dragon is hunting the chickens.", 8);
}

function landBackOnDesert() {
  stopDragonEncounter();
  clearSpaceCombat();
  game.phase = "desert";
  game.escaped = false;
  game.won = false;
  setWorldMode("desert");
  player.visible = true;
  player.position.set(rocketHome.x + 3.6, groundY(rocketHome.x + 3.6, rocketHome.z + 1.2), rocketHome.z + 1.2);
  player.rotation.y = yawForDirection(rocket.position.clone().sub(player.position));
  game.targetYaw = player.rotation.y;
  syncGameplayCameraToPlayer();
  player.userData.grounded = true;
  playerVerticalVelocity = 0;
  rocket.position.copy(rocketHome);
  rocket.rotation.set(0, 0, 0);
  shipVelocity.set(0, 0, 0);

  if (rocketChickenPassenger) rocketChickenPassenger.visible = false;
  if (capturePokemon?.userData.captured) {
    capturePokemon.visible = true;
    capturePokemon.position.set(player.position.x + 2.2, groundY(player.position.x + 2.2, player.position.z + 2.4), player.position.z + 2.4);
  }
  if (game.chickenPassenger) {
    game.returnedChicken = true;
    desertChicken.visible = true;
    desertChicken.userData.eaten = false;
    desertChicken.position.set(rocketHome.x + 5.2, groundY(rocketHome.x + 5.2, rocketHome.z + 3.5), rocketHome.z + 3.5);
    desertChicken.rotation.y = -0.8;
  }

  game.chickenPassenger = false;
  setStatus(
    game.returnedChicken
      ? "Back on the original planet with a chicken passenger."
      : "Back on the original planet.",
    8,
  );
}

function setWorldMode(mode) {
  const showDesert = mode === "desert" || (mode === "launching" && game.launchOrigin === "desert");
  const showPlanet = mode === "planet" || (mode === "launching" && game.launchOrigin === "planet");
  const showSpacePlanet = mode === "space";

  desertObjects.forEach((object) => {
    object.visible = showDesert;
  });
  planetObjects.forEach((object) => {
    object.visible = showPlanet;
  });

  destinationPlanet.visible = showSpacePlanet && game.flightTarget === "planet";
  originalPlanet.visible = showSpacePlanet && game.flightTarget === "desert";
  mountGosha.visible = showDesert;
  captureRing.visible = showDesert;
  captureParticles.visible = showDesert;
  piglins.forEach((piglin) => {
    piglin.visible = showDesert && !piglin.userData.isDown;
  });
  if (desertChicken) {
    desertChicken.visible = showDesert && game.returnedChicken;
  }
  rocket.visible = true;
  if (rocket.userData.pad) {
    rocket.userData.pad.visible = mode !== "launching" && mode !== "space";
  }
}

function updateCamera(delta, elapsed) {
  if (game.phase === "launching") {
    const desired = rocket.position.clone().add(new THREE.Vector3(8, 5, 17));
    camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
    camera.lookAt(rocket.position.clone().add(new THREE.Vector3(0, 3, 0)));
    return;
  }

  if (game.phase === "space") {
    const desired = rocket.position.clone().add(new THREE.Vector3(0, 7, 24));
    if (game.cameraShake > 0) {
      game.cameraShake = Math.max(0, game.cameraShake - delta);
      const shake = game.cameraShake * 0.48;
      desired.x += Math.sin(elapsed * 65) * shake;
      desired.y += Math.cos(elapsed * 73) * shake;
    }
    camera.position.lerp(desired, 1 - Math.pow(0.001, delta));
    camera.lookAt(rocket.position.clone().add(shipVelocity.clone().normalize().multiplyScalar(8)));
    return;
  }

  const cameraYaw = updateGameplayCameraYaw(delta);
  const cameraOffset = new THREE.Vector3(0, 5.8, 10.8).applyAxisAngle(yAxis, cameraYaw);
  const desired = player.position.clone().add(cameraOffset);
  desired.y = Math.max(desired.y, getCurrentGroundY(desired.x, desired.z) + 3.2);

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

function holdGameplayCamera() {
  if (game.phase !== "desert" && game.phase !== "planet") return;
  game.cameraTurnHold = Math.max(game.cameraTurnHold, cameraTurnHoldSeconds);
}

function updateGameplayCameraYaw(delta) {
  if (!Number.isFinite(game.cameraYaw)) {
    game.cameraYaw = player.rotation.y;
  }

  if (game.cameraTurnHold > 0) {
    game.cameraTurnHold = Math.max(0, game.cameraTurnHold - delta);
    return game.cameraYaw;
  }

  game.cameraYaw = dampAngle(game.cameraYaw, player.rotation.y, 2.45, delta);
  return game.cameraYaw;
}

function syncGameplayCameraToPlayer() {
  game.cameraYaw = player.rotation.y;
  game.cameraTurnHold = 0;
}

function updateHud(delta) {
  game.statusTimer = Math.max(0, game.statusTimer - delta);
  if (game.statusTimer <= 0 && !game.lost) {
    if (game.phase === "space") {
      ui.status.textContent = game.flightTarget === "desert"
        ? "Steer home and press Space to shoot asteroids."
        : "Steer to the green planet and press Space to shoot asteroids.";
    } else if (game.phase === "planet") {
      const nearestChicken = getNearestChicken();
      const rocketDistance = player.position.distanceTo(rocket.position);
      const nearestPokeball = getNearestPokeball();
      if (rocketDistance < rocket.userData.boardRadius) {
        ui.status.textContent = "Press Space to return in the rocket with a nearby chicken.";
      } else if (nearestPokeball && nearestPokeball.distance < 3.2) {
        ui.status.textContent = "Press E to capture the Pokeball.";
      } else if (capturePokemon?.visible && !capturePokemon.userData.captured && flatDistance(player.position, capturePokemon.position) < 4.2) {
        ui.status.textContent = "Press E to capture the helper Pokemon.";
      } else if (firebirds.length > 0) {
        ui.status.textContent = "Dodge the Moltres-like attackers and hit them with the diamond sword.";
      } else if (game.dragonActive) {
        ui.status.textContent = "The red dragon is turning chickens into Moltres-like attackers.";
      } else if (nearestChicken && nearestChicken.distance < 3.2) {
        ui.status.textContent = "Press E to let Growlithe eat the chicken.";
      } else {
        ui.status.textContent = "Evade lava rivers and volcanoes while finding chickens.";
      }
    } else if (game.phase === "launching") {
      ui.status.textContent = game.launchOrigin === "planet"
        ? "Rocket climbing off the green planet."
        : "Rocket climbing out of the desert.";
    } else {
      const distance = player.position.distanceTo(mountGosha.position);
      const rocketDistance = player.position.distanceTo(rocket.position);
      if (rocketDistance < rocket.userData.boardRadius) {
        ui.status.textContent = "Press Space to jump into the rocket.";
      } else if (game.won) {
        ui.status.textContent = "Mount Gosha is captured. Keep exploring or find the rocket.";
      } else if (distance < 9) {
        ui.status.textContent = "Jump onto Mount Gosha or hold E inside the capture circle.";
      } else if (distance < 28) {
        ui.status.textContent = "The evil mount is close.";
      } else {
        ui.status.textContent = "Find Mount Gosha, rocks to dance on, or the escape rocket.";
      }
    }
  }

  ui.missionEyebrow.textContent = game.phase === "planet" ? "Escaped" : game.won ? "Gosha Captured" : "Growlithe Rider";
  ui.missionTitle.textContent =
    game.phase === "space"
      ? game.flightTarget === "desert"
        ? "Fly Back Home"
        : "Fly To The Planet"
      : game.phase === "planet"
        ? game.capturePokemonCaptured
          ? "Train The Helper Pokemon"
          : "Safe On A New Planet"
        : game.won
          ? "Explore The Desert"
          : "Capture Mount Gosha";
  ui.healthFill.style.width = `${game.health}%`;
  ui.healthText.textContent = `${Math.round(game.health)}`;
  ui.captureFill.style.width = `${game.capture}%`;
  ui.captureText.textContent = `${Math.round(game.capture)}%`;
  ui.piglinScore.textContent = `${game.piglinsDefeated}`;
  ui.pokeballScore.textContent = `${game.pokeballsCollected}`;
  const nearRocket =
    (game.phase === "desert" || game.phase === "planet") &&
    player.position.distanceTo(rocket.position) < rocket.userData.boardRadius;
  ui.rocketPrompt.classList.toggle("visible", nearRocket);
  updateTargetIndicator();
}

function swingSword() {
  if (game.lost || game.attackCooldown > 0) return;

  game.attackCooldown = 0.54;
  game.attackTimer = 0.36;
  const { hits, blocks } = resolveSwordTargets();
  const firebirdHits = resolveFirebirdTargets();

  blocks.forEach(({ piglin }) => showBlockEffect(piglin));
  hits.forEach(({ piglin, hitDir }) => takeDownPiglin(piglin, hitDir));
  firebirdHits.forEach(({ bird, hitDir }) => takeDownFirebird(bird, hitDir));

  if (hits.length > 0 || blocks.length > 0 || firebirdHits.length > 0) {
    game.cameraShake = Math.max(game.cameraShake, blocks.length > 0 ? 0.16 : 0.08);
  } else {
    setStatus(game.phase === "planet" ? "Face a Moltres-like attacker and swing close to hit it." : "Face a piglin and swing close to land the diamond sword.", 1.2);
  }
}

function resolveSwordTargets() {
  const forward = getPlayerForward(tempVec2);
  const right = getPlayerRight(tempVec3);
  const hits = [];
  const blocks = [];

  piglins.forEach((piglin) => {
    const data = piglin.userData;
    if (!piglin.visible || data.respawn > 0 || data.isDown) return;

    const offset = piglin.position.clone().sub(player.position);
    offset.y = 0;
    const distance = offset.length();
    if (distance > 4.85 || distance < 0.25) return;

    const lateral = Math.abs(offset.dot(right));
    const direction = offset.clone().normalize();
    const inFrontArc = direction.dot(forward) > 0.28 && lateral < 3.15;

    if (inFrontArc) {
      if (data.isBlocking || data.forceBlocking) {
        blocks.push({ piglin, distance });
        return;
      }
      hits.push({ piglin, hitDir: direction, distance });
    }
  });

  return {
    blocks: blocks.sort((a, b) => a.distance - b.distance).slice(0, 1),
    hits: hits.sort((a, b) => a.distance - b.distance).slice(0, 2),
  };
}

function resolveFirebirdTargets() {
  if (game.phase !== "planet" || firebirds.length === 0) return [];

  const forward = getPlayerForward(new THREE.Vector3());
  const right = getPlayerRight(new THREE.Vector3());
  return firebirds
    .map((bird) => {
      const offset = bird.position.clone().sub(player.position);
      offset.y *= 0.35;
      const distance = offset.length();
      const flatOffset = bird.position.clone().sub(player.position);
      flatOffset.y = 0;
      const direction = flatOffset.lengthSq() > 0.001 ? flatOffset.normalize() : getPlayerForward(new THREE.Vector3());
      const lateral = Math.abs(direction.clone().multiplyScalar(distance).dot(right));
      const inFrontArc = direction.dot(forward) > 0.18 && lateral < 4.6;
      return { bird, distance, hitDir: direction, inFrontArc };
    })
    .filter((target) => target.distance < 6.2 && target.inFrontArc)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 1);
}

function takeDownPiglin(piglin, hitDir) {
  const data = piglin.userData;
  data.health = 0;
  data.stun = 0;
  data.isDown = true;
  data.downTimer = 1.1;
  data.respawn = 5.8;
  data.velocity.copy(hitDir).multiplyScalar(10.5);
  data.attackCooldown = 1.2;
  game.piglinsDefeated += 1;

  createDamageNumber(piglin.position.clone().add(new THREE.Vector3(0, 2.25, 0)), "-25", "enemy");
  createHitBurst(piglin.position.clone().add(new THREE.Vector3(0, 1.35, 0)), hitDir);
  setStatus("Diamond sword hit. Piglin down.");
}

function takeDownFirebird(bird, hitDir) {
  const position = bird.position.clone();
  const index = firebirds.indexOf(bird);
  if (index >= 0) {
    firebirds.splice(index, 1);
  }

  scene.remove(bird);
  bird.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
  });

  createDamageNumber(position.clone().add(new THREE.Vector3(0, 1.25, 0)), "-50", "enemy");
  createHitBurst(position, hitDir);
  spawnPokeballs(position, 3);
  game.cameraShake = Math.max(game.cameraShake, 0.16);
  setStatus("Diamond sword destroyed a Moltres-like attacker. Random-color Pokeballs appeared.", 2.4);

  if (!game.capturePokemonSpawned && !game.capturePokemonCaptured) {
    spawnCapturePokemon(position);
  }
}

function showBlockEffect(piglin) {
  const data = piglin.userData;
  data.forceBlocking = false;
  data.isBlocking = true;
  data.blockCooldown = 1.4;
  game.blockFlashTimer = 0.46;
  game.lastBlockTime = clock.elapsedTime;

  createDamageNumber(piglin.position.clone().add(new THREE.Vector3(0, 2.25, 0)), "BLOCK", "block");
  createHitBurst(piglin.position.clone().add(new THREE.Vector3(0, 1.4, 0)), getPlayerForward(new THREE.Vector3()));
  setStatus("Piglin blocked the sword hit.", 1.8);
}

function createHitBurst(position, hitDir) {
  const burst = new THREE.Group();
  burst.position.copy(position);

  for (let i = 0; i < 8; i += 1) {
    const shard = new THREE.Mesh(new THREE.TetrahedronGeometry(0.12, 0), materials.impact);
    const spread = new THREE.Vector3(
      THREE.MathUtils.randFloatSpread(1.3),
      THREE.MathUtils.randFloat(0.15, 1),
      THREE.MathUtils.randFloatSpread(1.3),
    ).addScaledVector(hitDir, 1.4);

    shard.userData.velocity = spread.multiplyScalar(THREE.MathUtils.randFloat(2.8, 5.8));
    shard.rotation.set(
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
      THREE.MathUtils.randFloat(0, Math.PI),
    );
    burst.add(shard);
  }

  burst.userData.life = 0.46;
  impactBursts.push(burst);
  scene.add(burst);
}

function createDamageNumber(position, text, type) {
  const element = document.createElement("div");
  element.className = `damage-number ${type}`;
  element.textContent = text;
  ui.combatFeedback.appendChild(element);

  damageNumbers.push({
    element,
    position,
    velocity: new THREE.Vector3(THREE.MathUtils.randFloatSpread(0.35), 1.7, 0),
    life: 0.92,
    maxLife: 0.92,
  });
}

function updateEffects(delta) {
  updateDamageNumbers(delta);

  game.blockFlashTimer = Math.max(0, game.blockFlashTimer - delta);
  ui.blockFlash.classList.toggle("visible", game.blockFlashTimer > 0);

  for (let i = impactBursts.length - 1; i >= 0; i -= 1) {
    const burst = impactBursts[i];
    burst.userData.life -= delta;

    burst.children.forEach((shard) => {
      shard.position.addScaledVector(shard.userData.velocity, delta);
      shard.userData.velocity.y -= 7.5 * delta;
      shard.rotation.x += delta * 7;
      shard.rotation.y += delta * 9;
    });

    const opacity = Math.max(0, burst.userData.life / 0.46);
    burst.children.forEach((shard) => {
      shard.material.opacity = opacity;
    });

    if (burst.userData.life <= 0) {
      scene.remove(burst);
      impactBursts.splice(i, 1);
    }
  }

  for (let i = smokePuffs.length - 1; i >= 0; i -= 1) {
    const puff = smokePuffs[i];
    puff.userData.life -= delta;
    puff.position.addScaledVector(puff.userData.velocity, delta);
    puff.scale.multiplyScalar(1 + delta * 0.95);
    puff.material.opacity = Math.max(0, (puff.userData.life / puff.userData.maxLife) * 0.42);

    if (puff.userData.life <= 0) {
      scene.remove(puff);
      puff.geometry.dispose();
      puff.material.dispose();
      smokePuffs.splice(i, 1);
    }
  }

  for (let i = lavaBombs.length - 1; i >= 0; i -= 1) {
    const bomb = lavaBombs[i];
    bomb.userData.life -= delta;
    bomb.userData.velocity.y -= 9.8 * delta;
    bomb.position.addScaledVector(bomb.userData.velocity, delta);
    bomb.scale.setScalar(1 + (1 - bomb.userData.life / bomb.userData.maxLife) * 0.7);
    bomb.material.opacity = Math.max(0, bomb.userData.life / bomb.userData.maxLife);

    const ground = planetHeight(bomb.position.x, bomb.position.z) + 0.06;
    if (bomb.position.y <= ground || bomb.userData.life <= 0) {
      bomb.position.y = ground;
      createHitBurst(bomb.position.clone(), new THREE.Vector3(0, 1, 0));
      scene.remove(bomb);
      bomb.geometry.dispose();
      bomb.material.dispose();
      lavaBombs.splice(i, 1);
    }
  }
}

function updateDamageNumbers(delta) {
  for (let i = damageNumbers.length - 1; i >= 0; i -= 1) {
    const number = damageNumbers[i];
    number.life -= delta;
    number.position.addScaledVector(number.velocity, delta);
    number.velocity.y += delta * 0.55;

    const screen = number.position.clone().project(camera);
    const x = (screen.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-screen.y * 0.5 + 0.5) * window.innerHeight;
    const opacity = Math.max(0, number.life / number.maxLife);
    number.element.style.opacity = `${opacity}`;
    number.element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${0.85 + (1 - opacity) * 0.3})`;

    if (number.life <= 0) {
      number.element.remove();
      damageNumbers.splice(i, 1);
    }
  }
}

function damagePlayer(amount, message) {
  if (game.lost || game.won) return;
  game.health = Math.max(0, game.health - amount);
  game.cameraShake = Math.max(game.cameraShake, 0.22);
  createDamageNumber(player.position.clone().add(new THREE.Vector3(0, 3.15, 0)), `-${amount}`, "player");
  setStatus(message);

  if (game.health <= 0) {
    game.lost = true;
    setStatus("Growlithe rider down. Remount to try again.", 30);
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
  game.pokeballsCollected = 0;
  game.chickensEaten = 0;
  game.won = false;
  game.lost = false;
  game.escaped = false;
  game.phase = "desert";
  game.attackCooldown = 0;
  game.attackTimer = 0;
  game.cameraShake = 0;
  game.launchTimer = 0;
  game.danceTimer = 0;
  game.maxLegLift = 0;
  game.blockFlashTimer = 0;
  game.lastBlockTime = 0;
  game.hazardCooldown = 0;
  game.flightTarget = "planet";
  game.launchOrigin = "desert";
  game.chickenPassenger = false;
  game.returnedChicken = false;
  game.lavaSpewCount = 0;
  game.dragonActive = false;
  game.dragonFireTimer = 0;
  game.chickensScorched = 0;
  game.capturePokemonSpawned = false;
  game.capturePokemonCaptured = false;
  game.companionCapturePower = 0;
  game.spaceShotCooldown = 0;
  game.asteroidSpawnTimer = 0;
  game.asteroidsDestroyed = 0;
  game.lastAsteroidHitTime = 0;
  player.position.set(0, groundY(0, 8), 8);
  player.rotation.y = 0;
  game.targetYaw = 0;
  syncGameplayCameraToPlayer();
  player.visible = true;
  player.userData.grounded = true;
  playerVelocity.set(0, 0, 0);
  playerVerticalVelocity = 0;
  shipVelocity.set(0, 0, 0);
  rocketHome.y = groundY(rocketHome.x, rocketHome.z);
  rocket.position.copy(rocketHome);
  rocket.rotation.set(0, 0, 0);
  updateRocketFlame(0);
  rocketFlame.userData.power = 0;
  if (rocketChickenPassenger) rocketChickenPassenger.visible = false;
  if (desertChicken) desertChicken.visible = false;
  clearSmokePuffs();
  clearLavaBombs();
  clearSpaceCombat();
  stopDragonEncounter();
  clearPokeballs();
  resetCapturePokemon();
  clearDamageNumbers();
  mountGosha.userData.base.set(8, 0, -74);
  materials.gosha.emissive.setHex(0x000000);
  materials.goshaGlow.emissive.setHex(0x6a22e4);

  piglins.forEach((piglin) => {
    resetPiglin(piglin);
  });
  resetChickens();

  setWorldMode("desert");
  setStatus("Find Mount Gosha, rocks to dance on, or the escape rocket.", 3);
  updateHud(0);
}

function resetPiglin(piglin) {
  const spawn = piglin.userData.spawn;
  piglin.position.set(spawn.x, groundY(spawn.x, spawn.z), spawn.z);
  piglin.rotation.set(0, 0, 0);
  piglin.visible = true;
  piglin.userData.health = 1;
  piglin.userData.stun = 0;
  piglin.userData.respawn = 0;
  piglin.userData.downTimer = 0;
  piglin.userData.isDown = false;
  piglin.userData.isBlocking = false;
  piglin.userData.forceBlocking = false;
  piglin.userData.fleeing = false;
  piglin.userData.fleeTimer = 0;
  piglin.userData.blockCooldown = THREE.MathUtils.randFloat(0.6, 1.8);
  piglin.userData.velocity.set(0, 0, 0);
}

function resetChickens() {
  chickens.forEach((chicken) => {
    chicken.position.copy(chicken.userData.spawn);
    chicken.position.y = planetHeight(chicken.position.x, chicken.position.z);
    chicken.visible = true;
    chicken.userData.eaten = false;
    chicken.userData.peckTimer = THREE.MathUtils.randFloat(0.2, 1.4);
  });
}

function resetCapturePokemon() {
  if (!capturePokemon) return;

  capturePokemon.visible = false;
  capturePokemon.position.set(0, 0, 0);
  capturePokemon.rotation.set(0, 0, 0);
  capturePokemon.userData.captured = false;
  capturePokemon.userData.captureReady = false;
  capturePokemon.userData.followVelocity.set(0, 0, 0);
}

function clearSmokePuffs() {
  for (let i = smokePuffs.length - 1; i >= 0; i -= 1) {
    const puff = smokePuffs[i];
    scene.remove(puff);
    puff.geometry.dispose();
    puff.material.dispose();
    smokePuffs.splice(i, 1);
  }
}

function clearLavaBombs() {
  for (let i = lavaBombs.length - 1; i >= 0; i -= 1) {
    const bomb = lavaBombs[i];
    scene.remove(bomb);
    bomb.geometry.dispose();
    bomb.material.dispose();
    lavaBombs.splice(i, 1);
  }
}

function clearDamageNumbers() {
  for (let i = damageNumbers.length - 1; i >= 0; i -= 1) {
    damageNumbers[i].element.remove();
    damageNumbers.splice(i, 1);
  }
  ui.blockFlash.classList.remove("visible");
}

function updateTargetIndicator() {
  if (game.phase === "planet" || game.phase === "launching") {
    ui.goshaIndicator.style.opacity = "0";
    return;
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const margin = width < 760 ? 58 : 72;
  const targetObject = game.phase === "space"
    ? game.flightTarget === "desert"
      ? originalPlanet
      : destinationPlanet
    : mountGosha;
  const label = game.phase === "space" ? (game.flightTarget === "desert" ? "Home" : "Planet") : "Gosha";
  const target = targetObject.position.clone();
  target.y += game.phase === "space" ? 0 : 3.2;
  target.project(camera);

  let ndcX = target.x;
  let ndcY = target.y;
  const behindCamera = target.z > 1;

  if (behindCamera) {
    ndcX *= -1;
    ndcY *= -1;
  }

  const onScreen =
    !behindCamera && ndcX > -0.82 && ndcX < 0.82 && ndcY > -0.76 && ndcY < 0.76;

  const unclampedX = (ndcX * 0.5 + 0.5) * width;
  const unclampedY = (-ndcY * 0.5 + 0.5) * height;
  const x = onScreen ? unclampedX : THREE.MathUtils.clamp(unclampedX, margin, width - margin);
  const y = onScreen ? unclampedY : THREE.MathUtils.clamp(unclampedY, margin, height - margin);
  const angle = Math.atan2(y - height / 2, x - width / 2) + Math.PI / 2;
  const distance =
    game.phase === "space"
      ? rocket.position.distanceTo(targetObject.position)
      : player.position.distanceTo(mountGosha.position);

  ui.goshaIndicator.style.left = `${x}px`;
  ui.goshaIndicator.style.top = `${y}px`;
  ui.goshaIndicator.style.opacity = "1";
  ui.goshaIndicator.classList.toggle("on-target", onScreen);
  ui.goshaArrow.style.transform = `rotate(${angle}rad)`;
  ui.targetLabel.textContent = label;
  ui.goshaDistance.textContent = `${Math.max(1, Math.round(distance))}m`;
}

function getPlayerForward(target = new THREE.Vector3()) {
  return target.set(-Math.sin(player.rotation.y), 0, -Math.cos(player.rotation.y)).normalize();
}

function getPlayerRight(target = new THREE.Vector3()) {
  return target.set(Math.cos(player.rotation.y), 0, -Math.sin(player.rotation.y)).normalize();
}

function getRocketForward(target = new THREE.Vector3()) {
  return target.set(0, 1, 0).applyQuaternion(rocket.quaternion).normalize();
}

function getRocketRight(target = new THREE.Vector3()) {
  return target.set(1, 0, 0).applyQuaternion(rocket.quaternion).normalize();
}

function getRocketUp(target = new THREE.Vector3()) {
  return target.set(0, 0, 1).applyQuaternion(rocket.quaternion).normalize();
}

function yawForDirection(direction) {
  const flat = direction.clone();
  flat.y = 0;
  if (flat.lengthSq() < 0.0001) return player.rotation.y;
  flat.normalize();
  return Math.atan2(-flat.x, -flat.z);
}

function dampAngle(current, target, lambda, delta) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-lambda * delta));
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
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

function planetHeight(x, z) {
  const roll = Math.sin(x * 0.055) * 0.65 + Math.cos(z * 0.047) * 0.7;
  const small = Math.sin((x - z) * 0.13) * 0.12;
  return roll + small - 0.7;
}

function getCurrentGroundY(x, z) {
  return game.phase === "planet" ? planetHeight(x, z) : groundY(x, z);
}

function getLandingSurface(x, z) {
  let surface = {
    type: game.phase === "planet" ? "planet" : "ground",
    y: getCurrentGroundY(x, z),
  };

  if (game.phase !== "desert") {
    return surface;
  }

  rocks.forEach((rock) => {
    const distance = Math.hypot(x - rock.position.x, z - rock.position.z);
    if (distance < rock.userData.platformRadius && rock.userData.platformTop > surface.y) {
      surface = { type: "rock", y: rock.userData.platformTop, rock };
    }
  });

  return surface;
}

function flatDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
