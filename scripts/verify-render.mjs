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

      return {
        ok: true,
        canvasWidth: Math.round(rect.width),
        canvasHeight: Math.round(rect.height),
        hudWidth: Math.round(hud.width),
        hudHeight: Math.round(hud.height),
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
    await page.keyboard.press("Space");
    await page.waitForTimeout(500);
    const afterState = await page.evaluate(() => window.__GOSHA_GAME_DEBUG__.state());
    await page.close();

    if (!result.ok) {
      throw new Error(`${viewport.name}: ${result.reason}`);
    }

    if (result.canvasWidth < viewport.width * 0.95 || result.canvasHeight < viewport.height * 0.95) {
      throw new Error(`${viewport.name}: canvas is not filling the viewport`);
    }

    if (result.brightRatio < 0.08 || result.coloredRatio < 0.04 || result.alphaRatio < 0.95) {
      throw new Error(
        `${viewport.name}: canvas appears blank; bright=${result.brightRatio.toFixed(
          3,
        )}, colored=${result.coloredRatio.toFixed(3)}, alpha=${result.alphaRatio.toFixed(3)}`,
      );
    }

    const playerDelta = Math.hypot(
      afterState.player.x - beforeState.player.x,
      afterState.player.z - beforeState.player.z,
    );
    const mountDelta = Math.hypot(
      afterState.mount.x - beforeState.mount.x,
      afterState.mount.z - beforeState.mount.z,
    );

    if (playerDelta < 0.3) {
      throw new Error(`${viewport.name}: player did not respond to movement input`);
    }

    if (mountDelta < 0.02) {
      throw new Error(`${viewport.name}: animated mount did not move`);
    }

    console.log(
      `${viewport.name}: ${result.canvasWidth}x${result.canvasHeight}, bright=${result.brightRatio.toFixed(
        3,
      )}, colored=${result.coloredRatio.toFixed(3)}, playerDelta=${playerDelta.toFixed(
        2,
      )}, mountDelta=${mountDelta.toFixed(2)}, screenshot=${screenshotPath}`,
    );
  }
} finally {
  await browser.close();
}
