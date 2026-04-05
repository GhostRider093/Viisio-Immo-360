import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';
import { config } from '../config.js';

const leboncoinDir = path.join(config.paths.capturesDir, 'leboncoin');
const metadataPath = path.join(leboncoinDir, 'captures.json');

let captureState = {
  running: false,
  lastError: null,
  lastRunAt: null
};

const ensureDirectory = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const readMetadata = () => {
  try {
    if (!fs.existsSync(metadataPath)) {
      return [];
    }

    const rawValue = fs.readFileSync(metadataPath, 'utf8');
    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : [];
  } catch (error) {
    console.error('Erreur lors de la lecture des captures Leboncoin:', error);
    return [];
  }
};

const writeMetadata = (captures) => {
  ensureDirectory(leboncoinDir);
  fs.writeFileSync(metadataPath, JSON.stringify(captures, null, 2), 'utf8');
};

const removeCaptureSet = (captureSet) => {
  if (captureSet?.folderPath && fs.existsSync(captureSet.folderPath)) {
    fs.rmSync(captureSet.folderPath, { recursive: true, force: true });
  }
};

const cleanupOldCaptures = (captures, maxEntries = 8) => {
  if (captures.length <= maxEntries) {
    return captures;
  }

  const capturesToRemove = captures.slice(maxEntries);
  capturesToRemove.forEach(removeCaptureSet);
  return captures.slice(0, maxEntries);
};

const clickIfVisible = async (page, locator) => {
  try {
    const count = await locator.count();

    if (count > 0) {
      await locator.first().click({ timeout: 2000 });
      return true;
    }
  } catch (error) {
    return false;
  }

  return false;
};

const dismissCookieBanners = async (page) => {
  const selectors = [
    page.locator('button:has-text("Accepter")'),
    page.locator('button:has-text("Tout accepter")'),
    page.locator('button:has-text("J’accepte")'),
    page.locator('button:has-text("Continuer")')
  ];

  for (const locator of selectors) {
    const handled = await clickIfVisible(page, locator);

    if (handled) {
      await page.waitForTimeout(800);
      return;
    }
  }
};

const waitForListings = async (page) => {
  const selectors = [
    '[data-qa-id="aditem_container"]',
    '[data-test-id="adcard"]',
    'main'
  ];

  for (const selector of selectors) {
    try {
      await page.waitForSelector(selector, { timeout: 6000 });
      return;
    } catch (error) {
      continue;
    }
  }
};

const assertLeboncoinPageAvailable = async (page) => {
  const bodyText = await page.locator('body').innerText().catch(() => '');
  const normalizedText = bodyText.toLowerCase();
  const html = await page.content().catch(() => '');
  const normalizedHtml = html.toLowerCase();

  if (
    normalizedText.includes('access is temporarily restricted') ||
    normalizedText.includes('we detected unusual activity') ||
    normalizedText.includes('acces est temporairement restreint') ||
    normalizedHtml.includes('captcha-delivery.com') ||
    normalizedHtml.includes('geo.captcha-delivery.com')
  ) {
    const error = new Error('Leboncoin a bloque la capture automatique sur cette machine. Ouvre la recherche manuellement ou utilise un navigateur non bloque.');
    error.code = 'LEBONCOIN_BLOCKED';
    throw error;
  }
};

export const getLeboncoinCaptureState = () => ({
  ...captureState
});

export const getLeboncoinCapturePayload = () => {
  const captures = readMetadata();

  return {
    state: getLeboncoinCaptureState(),
    latest: captures[0] || null,
    history: captures.slice(0, 5)
  };
};

export const runLeboncoinCapture = async ({
  url = config.watch.leboncoin.defaultUrl,
  segments = config.watch.leboncoin.maxSegments
} = {}) => {
  if (captureState.running) {
    const error = new Error('Une capture Leboncoin est deja en cours');
    error.code = 'CAPTURE_BUSY';
    throw error;
  }

  captureState = {
    ...captureState,
    running: true,
    lastError: null
  };

  ensureDirectory(leboncoinDir);

  const captureId = new Date().toISOString().replace(/[:.]/g, '-');
  const captureFolderPath = path.join(leboncoinDir, captureId);
  ensureDirectory(captureFolderPath);

  let browser;

  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1600 },
      deviceScaleFactor: 1
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    await page.waitForTimeout(2500);
    await dismissCookieBanners(page);
    await waitForListings(page);
    await assertLeboncoinPageAvailable(page);

    const pageHeight = await page.evaluate(() => {
      return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight
      );
    });

    const viewportHeight = page.viewportSize()?.height || 1600;
    const items = [];
    const totalSegments = Math.max(1, Math.min(Number(segments) || 1, config.watch.leboncoin.maxSegments));

    for (let index = 0; index < totalSegments; index += 1) {
      const scrollY = Math.max(0, Math.min(index * Math.floor(viewportHeight * 0.82), Math.max(0, pageHeight - viewportHeight)));

      await page.evaluate((nextScrollY) => {
        window.scrollTo({ top: nextScrollY, behavior: 'instant' });
      }, scrollY);

      await page.waitForTimeout(1400);

      const filename = `segment-${String(index + 1).padStart(2, '0')}.jpg`;
      const filePath = path.join(captureFolderPath, filename);

      await page.screenshot({
        path: filePath,
        type: 'jpeg',
        quality: 72,
        fullPage: false
      });

      items.push({
        id: `${captureId}-${index + 1}`,
        filename,
        filePath,
        url: `/captures/leboncoin/${captureId}/${filename}`,
        scrollY
      });
    }

    await browser.close();

    const newCapture = {
      id: captureId,
      createdAt: new Date().toISOString(),
      sourceUrl: url,
      folderPath: captureFolderPath,
      items
    };

    const updatedCaptures = cleanupOldCaptures([newCapture, ...readMetadata()]);
    writeMetadata(updatedCaptures);

    captureState = {
      running: false,
      lastError: null,
      lastRunAt: newCapture.createdAt
    };

    return newCapture;
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }

    removeCaptureSet({ folderPath: captureFolderPath });

    captureState = {
      running: false,
      lastError: error.message,
      lastRunAt: new Date().toISOString()
    };

    throw error;
  }
};
