import { chromium } from "playwright-core";

const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const gameUrl = process.env.GAME_URL || "http://localhost:5173/";
const screenshotDir = process.env.SCREENSHOT_DIR || "/private/tmp";

const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844, isMobile: true },
];

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ["--no-sandbox"],
});

try {
  for (const viewport of viewports) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.isMobile ? 2 : 1,
      isMobile: Boolean(viewport.isMobile),
    });

    await page.goto(gameUrl, { waitUntil: "networkidle" });
    await page.waitForSelector("canvas");
    await page.waitForFunction(() => Boolean(window.__GOSHA_GAME_DEBUG__));
    await page.waitForTimeout(900);
    const beforeState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    const result = await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

      const canvas = document.querySelector("canvas");
      const rect = canvas.getBoundingClientRect();
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");

      if (!gl) {
        return { ok: false, reason: "WebGL context is unavailable" };
      }

      const width = gl.drawingBufferWidth;
      const height = gl.drawingBufferHeight;
      const pixels = new Uint8Array(width * height * 4);
      gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      let bright = 0;
      let colored = 0;
      let alpha = 0;
      let samples = 0;
      const step = 53;

      for (let i = 0; i < pixels.length; i += 4 * step) {
        const red = pixels[i];
        const green = pixels[i + 1];
        const blue = pixels[i + 2];
        const a = pixels[i + 3];
        const max = Math.max(red, green, blue);
        const min = Math.min(red, green, blue);

        if (red + green + blue > 45) bright += 1;
        if (max - min > 18) colored += 1;
        if (a > 0) alpha += 1;
        samples += 1;
      }

      const hud = document.querySelector("#hud").getBoundingClientRect();
      const indicator = document.querySelector("#goshaIndicator").getBoundingClientRect();
      const indicatorText = document.querySelector("#goshaIndicator").textContent.trim();
      const restart = document.querySelector("#restartButton").getBoundingClientRect();

      return {
        ok: true,
        canvasWidth: Math.round(rect.width),
        canvasHeight: Math.round(rect.height),
        hudWidth: Math.round(hud.width),
        hudHeight: Math.round(hud.height),
        indicatorWidth: Math.round(indicator.width),
        indicatorHeight: Math.round(indicator.height),
        indicatorText,
        restartWidth: Math.round(restart.width),
        restartHeight: Math.round(restart.height),
        brightRatio: bright / samples,
        coloredRatio: colored / samples,
        alphaRatio: alpha / samples,
      };
    });

    const screenshotPath = `${screenshotDir}/evans-game-part2-${viewport.name}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });

    await page.keyboard.down("w");
    await page.waitForTimeout(360);
    await page.keyboard.up("w");
    await page.waitForTimeout(80);
    const afterMoveState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    await page.keyboard.down("d");
    await page.waitForTimeout(450);
    await page.keyboard.up("d");
    await page.waitForTimeout(80);
    const afterTurnState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    const beforeHitState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePiglinInSwordRange();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.keyboard.press("KeyF");
    await page.waitForTimeout(260);
    const afterHitState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeBlockState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placeBlockingPiglinInSwordRange();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.keyboard.press("KeyF");
    await page.waitForTimeout(160);
    const afterBlockState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    const rockState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerOnRock();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.waitForTimeout(260);
    const afterRockState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    const goshaJumpState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerOverGosha();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.waitForTimeout(420);
    const afterGoshaJumpState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    await page.click("#restartButton");
    await page.waitForTimeout(240);
    const afterRestartState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerAtRocket();
    });
    await page.keyboard.press("Space");
    await page.waitForTimeout(3100);
    const afterLaunchState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeAsteroidShotState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.spawnAsteroidInBlasterPath();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.keyboard.press("Space");
    await page.waitForTimeout(520);
    const afterAsteroidShotState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeAsteroidCrashState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.spawnAsteroidOnCollisionPath();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.waitForTimeout(1200);
    const afterAsteroidCrashState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());

    await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placeRocketNearPlanet();
    });
    await page.waitForTimeout(1100);
    const afterLandingState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeHazardState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerOnLava();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.waitForTimeout(260);
    const afterHazardState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeChickenState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerNearChicken();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.keyboard.press("KeyE");
    await page.waitForTimeout(260);
    const afterChickenState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    const beforeReturnLaunchState = await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placePlayerAtPlanetRocket();
      return window.__GOSHA_GAME_DEBUG__.state();
    });
    await page.keyboard.press("Space");
    await page.waitForTimeout(3100);
    const afterReturnLaunchState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    await page.evaluate(() => {
      window.__GOSHA_GAME_DEBUG__.placeRocketNearHome();
    });
    await page.waitForTimeout(1100);
    const afterHomeLandingState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    await page.close();

    if (!result.ok) {
      throw new Error(`${viewport.name}: ${result.reason}`);
    }

    if (result.canvasWidth < viewport.width * 0.95 || result.canvasHeight < viewport.height * 0.95) {
      throw new Error(`${viewport.name}: canvas is not filling the viewport`);
    }

    if (
      result.indicatorWidth < 70 ||
      result.indicatorHeight < 30 ||
      !result.indicatorText.includes("Gosha")
    ) {
      throw new Error(`${viewport.name}: Mount Gosha indicator is missing or too small`);
    }

    if (result.restartWidth < 70 || result.restartHeight < 30) {
      throw new Error(`${viewport.name}: restart button is missing or too small`);
    }

    if (result.brightRatio < 0.08 || result.coloredRatio < 0.04 || result.alphaRatio < 0.95) {
      throw new Error(
        `${viewport.name}: canvas appears blank; bright=${result.brightRatio.toFixed(
          3,
        )}, colored=${result.coloredRatio.toFixed(3)}, alpha=${result.alphaRatio.toFixed(3)}`,
      );
    }

    const playerDelta = Math.hypot(
      afterMoveState.player.x - beforeState.player.x,
      afterMoveState.player.z - beforeState.player.z,
    );
    const mountDelta = Math.hypot(
      afterMoveState.mount.x - beforeState.mount.x,
      afterMoveState.mount.z - beforeState.mount.z,
    );
    const turnDelta = Math.hypot(
      afterTurnState.player.x - afterMoveState.player.x,
      afterTurnState.player.z - afterMoveState.player.z,
    );
    const forwardYaw = normalizeAngle(afterMoveState.playerYaw);
    const turnYaw = normalizeAngle(afterTurnState.playerYaw);

    if (playerDelta < 0.3) {
      throw new Error(`${viewport.name}: player did not respond to movement input`);
    }

    if (turnDelta > 0.2) {
      throw new Error(`${viewport.name}: left/right turn input moved the player instead of only turning`);
    }

    if (Math.abs(forwardYaw) > 0.55) {
      throw new Error(`${viewport.name}: Growlithe faces the wrong way when moving forward`);
    }

    if (turnYaw > -0.38 || turnYaw < -0.95) {
      throw new Error(`${viewport.name}: Growlithe did not keep turning while right was held`);
    }

    if (afterMoveState.maxLegLift < 0.03) {
      throw new Error(`${viewport.name}: Growlithe legs did not lift while walking`);
    }

    if (!beforeState.hasShoulderShield) {
      throw new Error(`${viewport.name}: spiked shoulder shield is missing from the rider`);
    }

    if (
      afterHitState.piglinsDefeated <= beforeHitState.piglinsDefeated ||
      !afterHitState.firstPiglin.isDown ||
      afterHitState.damageNumbers <= beforeHitState.damageNumbers
    ) {
      throw new Error(`${viewport.name}: sword hit did not show damage and take down the piglin`);
    }

    if (
      afterBlockState.lastBlockTime <= beforeBlockState.lastBlockTime ||
      !afterBlockState.blockFlashActive ||
      afterBlockState.piglinsDefeated > beforeBlockState.piglinsDefeated
    ) {
      throw new Error(`${viewport.name}: blocked piglin attack did not show a block effect`);
    }

    if (afterRockState.danceTimer <= 0 || rockState.phase !== "desert") {
      throw new Error(`${viewport.name}: landing on a rock did not start the dance`);
    }

    if (!afterGoshaJumpState.won || afterGoshaJumpState.capture < 100 || goshaJumpState.phase !== "desert") {
      throw new Error(`${viewport.name}: jumping onto Mount Gosha did not capture it`);
    }

    if (afterRestartState.phase !== "desert" || afterRestartState.won || afterRestartState.escaped) {
      throw new Error(`${viewport.name}: restart button did not reset the game`);
    }

    if (afterLaunchState.phase !== "space" || afterLaunchState.playerVisible) {
      throw new Error(`${viewport.name}: jumping into the rocket did not reach space flight`);
    }

    if (!afterLaunchState.rocketFlameVisible || afterLaunchState.rocketFlamePower < 0.6 || afterLaunchState.smokePuffs < 3) {
      throw new Error(`${viewport.name}: rocket blastoff did not produce visible flames and smoke`);
    }

    if (beforeAsteroidShotState.asteroidsVisible <= 0) {
      throw new Error(`${viewport.name}: debug asteroid did not spawn in the rocket blaster path`);
    }

    if (
      afterAsteroidShotState.asteroidsDestroyed <= beforeAsteroidShotState.asteroidsDestroyed ||
      afterAsteroidShotState.asteroidsVisible >= beforeAsteroidShotState.asteroidsVisible ||
      afterAsteroidShotState.lastAsteroidHitTime <= beforeAsteroidShotState.lastAsteroidHitTime
    ) {
      throw new Error(`${viewport.name}: Spacebar blaster did not destroy the incoming asteroid`);
    }

    if (
      afterAsteroidCrashState.health >= beforeAsteroidCrashState.health ||
      afterAsteroidCrashState.asteroidsVisible >= beforeAsteroidCrashState.asteroidsVisible
    ) {
      throw new Error(`${viewport.name}: asteroid collision did not damage the rocket`);
    }

    if (afterLandingState.phase !== "planet" || !afterLandingState.escaped || afterLandingState.piglinsVisible > 0) {
      throw new Error(`${viewport.name}: rocket did not land on the different planet away from piglins`);
    }

    if (afterLandingState.lavaRivers <= 0 || afterLandingState.volcanoes <= 0) {
      throw new Error(`${viewport.name}: destination planet has no lava rivers or volcanoes`);
    }

    if (afterLandingState.lavaFlowBands <= 0 || afterLandingState.lavaSpewCount <= 0) {
      throw new Error(`${viewport.name}: lava rivers are not flowing or volcanoes are not spewing lava`);
    }

    if (afterHazardState.health >= beforeHazardState.health || afterHazardState.damageNumbers <= beforeHazardState.damageNumbers) {
      throw new Error(`${viewport.name}: lava hazard did not damage Growlithe`);
    }

    if (afterLandingState.chickensVisible <= 0) {
      throw new Error(`${viewport.name}: destination planet has no visible chickens`);
    }

    if (
      afterChickenState.chickensEaten <= beforeChickenState.chickensEaten ||
      afterChickenState.chickensVisible >= beforeChickenState.chickensVisible
    ) {
      throw new Error(`${viewport.name}: Growlithe did not eat the nearby chicken`);
    }

    if (
      beforeReturnLaunchState.phase !== "planet" ||
      afterReturnLaunchState.phase !== "space" ||
      afterReturnLaunchState.flightTarget !== "desert" ||
      !afterReturnLaunchState.chickenPassenger
    ) {
      throw new Error(`${viewport.name}: rocket did not launch home with a chicken passenger`);
    }

    if (
      afterHomeLandingState.phase !== "desert" ||
      !afterHomeLandingState.returnedChicken ||
      !afterHomeLandingState.desertChickenVisible
    ) {
      throw new Error(`${viewport.name}: rocket did not bring a chicken back to the original planet`);
    }

    if (mountDelta < 0.02) {
      throw new Error(`${viewport.name}: animated mount did not move`);
    }

    console.log(
      `${viewport.name}: ${result.canvasWidth}x${result.canvasHeight}, bright=${result.brightRatio.toFixed(
        3,
      )}, colored=${result.coloredRatio.toFixed(3)}, playerDelta=${playerDelta.toFixed(
        2,
      )}, turnYaw=${turnYaw.toFixed(2)}, swordHit=yes, blockEffect=yes, rockDance=yes, goshaJump=yes, rocketEscape=yes, rocketReturn=yes, rocketSmoke=yes, asteroidCombat=yes, lavaHazards=yes, lavaFlow=yes, chickens=yes, mountDelta=${mountDelta.toFixed(
        2,
      )}, shoulderShield=yes, screenshot=${screenshotPath}`,
    );
  }
} finally {
  await browser.close();
}

function normalizeAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}
