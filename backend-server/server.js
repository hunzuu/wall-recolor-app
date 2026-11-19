// backend-server/server.js

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const app = express();
const PORT = process.env.PORT || 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, 'uploads');

await fs.mkdir(uploadsDir, { recursive: true }).catch(() => {});

app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use('/uploads', express.static(uploadsDir));

const upload = multer({
  dest: uploadsDir,
  limits: { fileSize: 25 * 1024 * 1024 },
});

const PAINT_COLORS = [
  { id: 'sage-green', name: 'Sage Green', hex: '#7C8D77' },
  { id: 'terracotta', name: 'Warm Terracotta', hex: '#C2634B' },
  { id: 'deep-navy', name: 'Deep Navy', hex: '#1D3557' },
  { id: 'cozy-linen', name: 'Cozy Linen', hex: '#F5EBE0' },
  { id: 'charcoal', name: 'Charcoal Slate', hex: '#374151' },
  { id: 'dusty-rose', name: 'Dusty Rose', hex: '#D98880' },
  { id: 'coastal-blue', name: 'Coastal Blue', hex: '#7EA0B7' },
  { id: 'warm-amber', name: 'Warm Amber', hex: '#D4A373' },
];

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'paint-visualizer-api', time: new Date().toISOString() });
});

app.get('/api/colors', (req, res) => {
  res.json({ colors: PAINT_COLORS });
});

// -----------------------------------------------------------------------------
// 1. EYEDROPPER: Sample Pixel Color
// -----------------------------------------------------------------------------
app.post('/api/pick-color', upload.single('image'), async (req, res, next) => {
  const uploadedPath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });

    const tapX = parseFloat(req.body.x);
    const tapY = parseFloat(req.body.y);

    const image = sharp(uploadedPath).rotate();
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const displayW = parseFloat(req.body.displayWidth) || width;
    const displayH = parseFloat(req.body.displayHeight) || height;

    const scaledX = Math.max(0, Math.min(Math.round((tapX / displayW) * width), width - 1));
    const scaledY = Math.max(0, Math.min(Math.round((tapY / displayH) * height), height - 1));

    const { data: pixels } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const pixelIndex = (scaledY * width + scaledX) * 4;
    const r = pixels[pixelIndex];
    const g = pixels[pixelIndex + 1];
    const b = pixels[pixelIndex + 2];

    const toHex = (n) => n.toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();

    await fs.unlink(uploadedPath).catch(() => {});
    res.json({ success: true, hex, r, g, b });
  } catch (error) {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 2. EDGE-AWARE FLOOD FILL (Anti-Bleed Engine)
// -----------------------------------------------------------------------------
app.post('/api/preview-flood', upload.single('image'), async (req, res, next) => {
  const uploadedPath = req.file?.path;

  try {
    if (!req.file) return res.status(400).json({ success: false, error: 'No image uploaded' });

    let hexColor = req.body.color;
    if (!hexColor && req.body.colorId) {
      const match = PAINT_COLORS.find((c) => c.id === req.body.colorId);
      if (match) hexColor = match.hex;
    }

    if (!hexColor || !hexColor.startsWith('#')) {
      return res.status(400).json({ success: false, error: 'Valid hex color is required' });
    }

    const rawX = parseFloat(req.body.x);
    const rawY = parseFloat(req.body.y);

    const cleanHex = hexColor.replace('#', '');
    const paintR = parseInt(cleanHex.slice(0, 2), 16);
    const paintG = parseInt(cleanHex.slice(2, 4), 16);
    const paintB = parseInt(cleanHex.slice(4, 6), 16);

    const image = sharp(uploadedPath).rotate();
    const metadata = await image.metadata();
    const { width, height } = metadata;

    const displayW = parseFloat(req.body.displayWidth) || width;
    const displayH = parseFloat(req.body.displayHeight) || height;

    const scaledX = Math.max(0, Math.min(Math.round((rawX / displayW) * width), width - 1));
    const scaledY = Math.max(0, Math.min(Math.round((rawY / displayH) * height), height - 1));

    const { data: pixels } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

    const seedIndex = (scaledY * width + scaledX) * 4;
    const seedR = pixels[seedIndex];
    const seedG = pixels[seedIndex + 1];
    const seedB = pixels[seedIndex + 2];

    // Tolerance configuration: Default to 36 (avoids bleeding onto furniture)
    const tolerance = parseInt(req.body.tolerance) || 36;
    const tolSq = tolerance * tolerance * 3;

    // Edge contrast threshold: stops spread if adjacent pixel changes sharply
    const maxLocalGradient = Math.max(22, Math.round(tolerance * 0.7));
    const localGradSq = maxLocalGradient * maxLocalGradient * 3;

    const mask = new Uint8Array(width * height);
    const visited = new Uint8Array(width * height);

    const stack = [scaledX, scaledY];
    visited[scaledY * width + scaledX] = 1;
    mask[scaledY * width + scaledX] = 1;

    while (stack.length > 0) {
      const cy = stack.pop();
      const cx = stack.pop();
      const curIdx = (cy * width + cx) * 4;
      const curR = pixels[curIdx];
      const curG = pixels[curIdx + 1];
      const curB = pixels[curIdx + 2];

      const neighbors = [
        cx - 1, cy,
        cx + 1, cy,
        cx, cy - 1,
        cx, cy + 1,
      ];

      for (let i = 0; i < 8; i += 2) {
        const nx = neighbors[i];
        const ny = neighbors[i + 1];

        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;

        const nPos = ny * width + nx;
        if (visited[nPos]) continue;
        visited[nPos] = 1;

        const nIdx = nPos * 4;
        const nR = pixels[nIdx];
        const nG = pixels[nIdx + 1];
        const nB = pixels[nIdx + 2];

        // 1. Distance from initial tap seed
        const dr = nR - seedR;
        const dg = nG - seedG;
        const db = nB - seedB;
        const distFromSeedSq = dr * dr + dg * dg + db * db;

        // 2. Local step contrast (detects borders & furniture edges)
        const ldr = nR - curR;
        const ldg = nG - curG;
        const ldb = nB - curB;
        const localStepSq = ldr * ldr + ldg * ldg + ldb * ldb;

        if (distFromSeedSq <= tolSq && localStepSq <= localGradSq) {
          mask[nPos] = 1;
          stack.push(nx, ny);
        }
      }
    }

    // Build solid color overlay layer
    const overlayBuffer = Buffer.alloc(width * height * 4, 0);
    const paintAlpha = parseInt(req.body.opacity) || 225; // Clean solid paint coat

    for (let i = 0; i < width * height; i++) {
      if (mask[i]) {
        const idx = i * 4;
        overlayBuffer[idx] = paintR;
        overlayBuffer[idx + 1] = paintG;
        overlayBuffer[idx + 2] = paintB;
        overlayBuffer[idx + 3] = paintAlpha;
      }
    }

    const overlayPng = await sharp(overlayBuffer, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    const resultFilename = `result_${Date.now()}.png`;
    const resultPath = path.join(uploadsDir, resultFilename);

    await sharp(uploadedPath)
      .rotate()
      .composite([{ input: overlayPng, blend: 'over' }])
      .png({ quality: 95 })
      .toFile(resultPath);

    await fs.unlink(uploadedPath).catch(() => {});

    res.json({
      success: true,
      previewUrl: `/uploads/${resultFilename}`,
      color: hexColor,
    });
  } catch (error) {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
    console.error('[FloodFill Error]:', error);
    next(error);
  }
});

// -----------------------------------------------------------------------------
// 3. ERASER TOOL: Restores Original Pixels Within Brush Radius
// -----------------------------------------------------------------------------
app.post(
  '/api/erase',
  upload.fields([
    { name: 'currentImage', maxCount: 1 },
    { name: 'originalImage', maxCount: 1 },
  ]),
  async (req, res, next) => {
    const currentPath = req.files?.['currentImage']?.[0]?.path;
    const originalPath = req.files?.['originalImage']?.[0]?.path;

    try {
      if (!currentPath || !originalPath) {
        return res.status(400).json({ success: false, error: 'Both current and original images required' });
      }

      const tapX = parseFloat(req.body.x);
      const tapY = parseFloat(req.body.y);
      const radius = Math.max(10, parseInt(req.body.radius) || 25);

      const origImg = sharp(originalPath).rotate();
      const currImg = sharp(currentPath).rotate();

      const metadata = await origImg.metadata();
      const { width, height } = metadata;

      const displayW = parseFloat(req.body.displayWidth) || width;
      const displayH = parseFloat(req.body.displayHeight) || height;

      const centerX = Math.max(0, Math.min(Math.round((tapX / displayW) * width), width - 1));
      const centerY = Math.max(0, Math.min(Math.round((tapY / displayH) * height), height - 1));

      // Scale radius proportionally
      const scaledRadius = Math.round((radius / displayW) * width);
      const radiusSq = scaledRadius * scaledRadius;

      const { data: origPixels } = await origImg.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      const { data: currPixels } = await currImg.ensureAlpha().raw().toBuffer({ resolveWithObject: true });

      // Bounding box for circular brush
      const minX = Math.max(0, centerX - scaledRadius);
      const maxX = Math.min(width - 1, centerX + scaledRadius);
      const minY = Math.max(0, centerY - scaledRadius);
      const maxY = Math.min(height - 1, centerY + scaledRadius);

      for (let y = minY; y <= maxY; y++) {
        const dy = y - centerY;
        for (let x = minX; x <= maxX; x++) {
          const dx = x - centerX;
          if (dx * dx + dy * dy <= radiusSq) {
            const idx = (y * width + x) * 4;
            // Restore original image pixels
            currPixels[idx] = origPixels[idx];
            currPixels[idx + 1] = origPixels[idx + 1];
            currPixels[idx + 2] = origPixels[idx + 2];
            currPixels[idx + 3] = origPixels[idx + 3];
          }
        }
      }

      const resultFilename = `result_erase_${Date.now()}.png`;
      const resultPath = path.join(uploadsDir, resultFilename);

      await sharp(currPixels, { raw: { width, height, channels: 4 } })
        .png({ quality: 95 })
        .toFile(resultPath);

      await fs.unlink(currentPath).catch(() => {});
      await fs.unlink(originalPath).catch(() => {});

      res.json({
        success: true,
        previewUrl: `/uploads/${resultFilename}`,
      });
    } catch (error) {
      if (currentPath) await fs.unlink(currentPath).catch(() => {});
      if (originalPath) await fs.unlink(originalPath).catch(() => {});
      console.error('[Eraser Error]:', error);
      next(error);
    }
  }
);

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('[API Server Error]:', error.message);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error',
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`===============================================`);
  console.log(`🚀 ColorVision Backend running on port ${PORT}`);
  console.log(`📡 Local:   http://localhost:${PORT}`);
  console.log(`🌐 Network: http://0.0.0.0:${PORT}`);
  console.log(`✨ Health:  http://localhost:${PORT}/api/health`);
  console.log(`===============================================`);
});