// =============================================================================
// server.js — AI Paint Color Visualizer Backend
// This file creates, configures, and starts the Express web server.
// It is the entry point for the entire backend API.
// =============================================================================

// --- IMPORTS ---

// Load environment variables from the .env file into process.env.
// This lets us store secrets (like API keys) outside of code.
// The '/config' path auto-runs dotenv.config() on import.
import 'dotenv/config';

// Multer handles multipart/form-data — the format browsers and phones use
// to upload files. Express can parse JSON bodies natively, but it cannot
// parse file uploads. Multer fills that gap.
import multer from 'multer';

// Sharp is a high-performance image processing library. It can resize,
// crop, convert formats, and composite (layer) images on top of each other.
// Under the hood it uses libvips, which is much faster than alternatives.
import sharp from 'sharp';

// Node's built-in path module for constructing file paths safely.
// It handles the difference between Linux (/) and Windows (\) separators.
import path from 'path';

// ES modules don't provide __dirname automatically (CommonJS does).
// fileURLToPath converts a file:// URL string into a normal filesystem path.
import { fileURLToPath } from 'url';

// Node's filesystem module, promise-based version.
// We use this to delete temporary files after processing.
// The /promises suffix means all functions return Promises (usable with await)
// instead of requiring old-style callbacks.
import fs from 'fs/promises';

// Express is the web framework. It handles routing, middleware, and HTTP.
// We only need the default export (the express function itself).
import express from 'express';

// CORS (Cross-Origin Resource Sharing) middleware.
// By default, browsers block requests from your phone (origin A) to your
// laptop server (origin B). CORS tells the browser "this is allowed."
import cors from 'cors';


// --- APP SETUP ---

// Create the Express application instance.
// This object is where we register routes, middleware, and settings.
const app = express();

// Read the PORT from the .env file. If it's not set, default to 4000.
// process.env is a plain object containing all environment variables.
// The || operator means "use the right side if the left side is falsy."
const PORT = process.env.PORT || 4000;


// --- DATA ---

// The paint color catalog. This is the single source of truth for all colors.
// In a production app, this would come from a database (PostgreSQL, MongoDB, etc).
// For now, it's a hardcoded array of objects. Each object has:
//   - id: a URL-safe string used to reference the color in API requests
//   - name: the human-readable display name
//   - hex: the CSS hex color code used for rendering
const PAINT_COLORS = [
  { id: 'red-orange',    name: 'Red Orange',    hex: '#ff5733' },
  { id: 'black',         name: 'Black',         hex: '#000000' },
  { id: 'blue',          name: 'Blue',          hex: '#3357ff' },
  { id: 'yellow',        name: 'Yellow',        hex: '#f3ff33' },
  { id: 'purple',        name: 'Purple',        hex: '#b833ff' },
  { id: 'midnight-blue', name: 'Midnight Blue', hex: '#191970' },
];


// --- MIDDLEWARE ---

// Register CORS middleware globally (applies to ALL routes).
// Without this, your phone's requests would be blocked by the browser's
// same-origin policy. cors() with no arguments allows all origins.
app.use(cors());

// Register JSON body parser middleware globally.
// This tells Express: "When a request has Content-Type: application/json,
// parse the body text into a JavaScript object and put it on request.body."
// Without this, request.body would be undefined for JSON requests.
app.use(express.json());


// --- FILE UPLOAD CONFIGURATION ---

// Reconstruct __dirname for ES modules.
// import.meta.url is the URL of this file, e.g.:
//   "file:///home/hunzu/Desktop/.../backend-server/server.js"
// fileURLToPath converts it to:
//   "/home/hunzu/Desktop/.../backend-server/server.js"
const __filename = fileURLToPath(import.meta.url);

// path.dirname strips the filename, leaving just the folder:
//   "/home/hunzu/Desktop/.../backend-server"
const __dirname = path.dirname(__filename);

// Configure multer with three settings:
const upload = multer({
  // dest: Where to save uploaded files on disk.
  // path.join safely combines the server folder path with "uploads".
  // Multer will create files with random names (no extension) in this folder.
  dest: path.join(__dirname, 'uploads'),

  // limits: Restrictions on uploads to prevent abuse.
  // fileSize is in bytes. 10 * 1024 * 1024 = 10,485,760 bytes = 10 MB.
  limits: { fileSize: 10 * 1024 * 1024 },

  // fileFilter: A function called before each file is saved.
  // It receives the request, the file metadata, and a callback function.
  // The callback pattern is: callback(errorOrNull, acceptBoolean).
  fileFilter: (request, file, callback) => {
    // file.mimetype is a string like "image/jpeg", "image/png", "text/plain".
    // .startsWith('image/') accepts any image format (jpeg, png, webp, etc).
    if (file.mimetype.startsWith('image/')) {
      // null = no error, true = accept the file
      callback(null, true);
    } else {
      // new Error() creates an error object with a message.
      // false = reject the file. Multer will pass this error to Express.
      callback(new Error('Only image files are allowed'), false);
    }
  },
});


// --- ROUTES ---

// GET /api/colors
// Returns the full paint color catalog as JSON.
// The frontend calls this to populate the color palette buttons.
app.get('/api/colors', (request, response) => {
  // response.json() sets Content-Type to application/json and sends the data.
  // We wrap the array in an object { colors: [...] } because it's easier
  // to extend later (e.g., adding pagination metadata).
  response.json({ colors: PAINT_COLORS });
});


// GET /api/colors/:id
// Returns a single color by its ID.
// The colon in :id makes it a "route parameter" — a variable in the URL.
// For example, GET /api/colors/black sets request.params.id to "black".
app.get('/api/colors/:id', (request, response) => {
  // Destructure the id from request.params.
  // request.params is an object of all named route parameters.
  const { id } = request.params;

  // .find() searches the array and returns the FIRST element where the
  // callback returns true. If no match is found, it returns undefined.
  const matchedColor = PAINT_COLORS.find((color) => color.id === id);

  // If no color matched, send a 404 (Not Found) error with helpful info.
  if (!matchedColor) {
    return response.status(404).json({
      error: 'Color not found',
      received: id, // Echo back what the client sent so they can debug.
    });
  }

  // If we found a match, send it back wrapped in an object.
  return response.json({ color: matchedColor });
});


// GET /api/health
// A health check endpoint. Used to verify the server is running.
// Monitoring tools and load balancers call this periodically.
app.get('/api/health', (request, response) => {
  response.json({
    status: 'ok',                              // Simple status indicator.
    service: 'paint-visualizer-api',            // Identifies which service.
    time: new Date().toISOString(),             // Current UTC timestamp.
    // new Date() creates a Date object for "right now."
    // .toISOString() converts it to "2024-11-03T15:00:00.000Z" format.
  });
});


// POST /api/preview
// The original JSON-only preview endpoint (no image upload).
// Validates that the colorId and tap coordinates are correct.
// Currently returns a mock response — no actual image processing.
// This will eventually be replaced or supplemented by /api/preview-image.
app.post('/api/preview', (request, response) => {
  // Destructure colorId and point from the JSON request body.
  const { colorId, point } = request.body;

  // Validate: colorId must be present.
  if (!colorId) {
    return response.status(400).json({
      error: 'Missing field: colorId',
    });
  }

  // Look up the color in our catalog.
  const matchedColor = PAINT_COLORS.find((color) => color.id === colorId);

  // Validate: colorId must match a known color.
  if (!matchedColor) {
    return response.status(400).json({
      error: 'Unknown colorId',
      received: colorId,
      // .map() transforms each element. Here it extracts just the IDs
      // so the client can see which values are valid.
      validIds: PAINT_COLORS.map((color) => color.id),
    });
  }

  // Validate: point must exist and be an object (not null, not a number).
  if (!point || typeof point !== 'object') {
    return response.status(400).json({
      error: 'Missing or invalid field: point',
      expected: '{ x: number, y: number }',
    });
  }

  // Destructure x and y from the point object.
  const { x, y } = point;

  // Validate: x and y must be finite numbers.
  // Number.isFinite() is safer than typeof because typeof NaN === 'number'
  // but Number.isFinite(NaN) === false. It also rejects Infinity.
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    return response.status(400).json({
      error: 'point.x & point.y must be numbers',
      received: `{ ${point.x}, ${point.y} }`,
    });
  }

  // Validate: coordinates must not be negative (you can't tap off-screen).
  if (x < 0 || y < 0) {
    return response.status(400).json({
      error: 'point.x & point.y must not be negative',
      received: `{ ${point.x}, ${point.y} }`,
    });
  }

  // Log the request to the terminal for debugging.
  // Template literals (backticks) let you embed variables with ${}.
  console.log(`Preview requested: ${matchedColor.name} at (${x}, ${y})`);

  // Send back a mock success response.
  response.json({
    success: true,
    requestId: `req_${Date.now()}`,  // Unique ID using current timestamp.
    appliedColor: matchedColor,
    point: { x, y },                 // Shorthand for { x: x, y: y }.
    processed: false,                // Flag: no real processing happened yet.
    message: 'Mock response. No image processing has been performed yet.',
  });
});


// GET /api/test-ai
// Tests the Hugging Face API connection and authentication.
// Uses a simple text model (gpt2) to verify the API key works.
// This is a diagnostic endpoint — not used in the actual app flow.
app.get('/api/test-ai', async (request, response) => {
  // try/catch handles any errors that occur during the async operations.
  try {
    // Read the Hugging Face API key from environment variables.
    const HF_API_KEY = process.env.HF_API_KEY;

    // If the key is missing, we can't call the API.
    if (!HF_API_KEY) {
      return response.status(500).json({
        error: 'HF_API_KEY not found in environment variables',
      });
    }

    // fetch() is the built-in Node 18+ function for making HTTP requests.
    // It returns a Promise that resolves to a Response object.
    // We're sending a POST request to Hugging Face's inference router.
    const hfResponse = await fetch(
      'https://router.huggingface.co/hf-inference/models/gpt2',
      {
        method: 'POST',
        headers: {
          // Bearer token authentication — the standard for API keys.
          'Authorization': `Bearer ${HF_API_KEY}`,
          // Tell the server we're sending JSON in the request body.
          'Content-Type': 'application/json',
        },
        // JSON.stringify converts a JS object to a JSON string.
        // fetch requires the body to be a string, not an object.
        body: JSON.stringify({
          inputs: 'Hello, my name is',
        }),
      }
    );

    // Check the Content-Type of the response to know how to parse it.
    // Hugging Face might return JSON or plain text depending on the model.
    const contentType = hfResponse.headers.get('content-type') || '';

    // hfResponse.ok is true for status codes 200-299.
    // If it's false, something went wrong (bad key, model unavailable, etc).
    if (!hfResponse.ok) {
      // .text() reads the response body as a plain string.
      const errorText = await hfResponse.text();
      return response.status(hfResponse.status).json({
        error: 'Hugging Face API error',
        status: hfResponse.status,
        details: errorText,
      });
    }

    // Parse the response based on its content type.
    // .includes() checks if a string contains a substring.
    const data = contentType.includes('application/json')
      ? await hfResponse.json()   // Parse as JSON object.
      : await hfResponse.text();  // Read as plain string.

    // Send the result back to the client.
    response.json({
      success: true,
      result: data,
    });

  } catch (error) {
    // This catches network errors, DNS failures, etc.
    // error.cause?.message uses optional chaining to safely access
    // a nested property that might not exist.
    response.status(500).json({
      error: 'Failed to call Hugging Face',
      details: error.message,
      cause: error.cause?.message || 'unknown',
    });
  }
});


// POST /api/preview-image
// The main image processing endpoint.
// Accepts a photo (multipart file upload) + colorId + tap coordinates.
// Composites a semi-transparent colored circle onto the photo at the tap point.
// Returns the modified image as a PNG file.
//
// upload.single('image') is multer middleware that runs BEFORE the route handler.
// It looks for a file in the form field named 'image', saves it to disk,
// and attaches its metadata to request.file.
app.post('/api/preview-image', upload.single('image'), async (request, response) => {
  // Save the uploaded file path immediately.
  // request.file?.path uses optional chaining: if request.file is undefined
  // (no file was uploaded), this returns undefined instead of crashing.
  // We need this path later for cleanup, even if an error occurs.
  const uploadedPath = request.file?.path;

  try {
    // For multipart requests, text fields are in request.body (not JSON).
    // Multer parses them automatically alongside the file.
    const { colorId, x, y } = request.body;

    // Validate: a file must have been uploaded.
    if (!request.file) {
      return response.status(400).json({ error: 'No image file uploaded' });
    }

    // Validate: colorId must be present.
    if (!colorId) {
      return response.status(400).json({ error: 'colorId is required' });
    }

    // Convert x and y from strings to numbers.
    // Form data always arrives as strings, even if the client sent numbers.
    // Number("160") → 160, Number("abc") → NaN.
    const pointX = Number(x);
    const pointY = Number(y);

    // Validate: the converted values must be actual finite numbers.
    if (!Number.isFinite(pointX) || !Number.isFinite(pointY)) {
      return response.status(400).json({ error: 'x and y must be valid numbers' });
    }

    // Look up the requested color in our catalog.
    const matchedColor = PAINT_COLORS.find((c) => c.id === colorId);
    if (!matchedColor) {
      return response.status(404).json({ error: 'Color not found', received: colorId });
    }

    // Read the image metadata (dimensions, format, etc) using sharp.
    // sharp(uploadedPath) creates a sharp instance from the file on disk.
    // .metadata() returns a promise with width, height, format, channels, etc.
    const metadata = await sharp(uploadedPath).metadata();
    const { width, height } = metadata;

    // Scale the tap coordinates from screen size to actual image size.
    // The phone displays the image at 320x180 pixels, but the actual photo
    // might be 4032x3024. We need to map the tap proportionally.
    // Formula: (tapPosition / displaySize) * actualSize
    const scaledX = Math.round((pointX / 320) * width);
    const scaledY = Math.round((pointY / 180) * height);

    // Calculate the circle radius as 15% of the smaller image dimension.
    // Math.min(width, height) picks the smaller side so the circle fits.
    const radius = Math.round(Math.min(width, height) * 0.15);

    // Build an SVG string that sharp will render as an overlay image.
    // SVG (Scalable Vector Graphics) is an XML-based image format.
    // Sharp can accept SVG as input and rasterize it to pixels.
    //
    // The SVG creates a full-size transparent canvas with a colored circle.
    // - xmlns is required by sharp's SVG renderer (librsvg).
    // - fill-opacity="0.5" makes the circle semi-transparent so the
    //   original wall texture, lighting, and shadows show through.
    const colorOverlaySvg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><circle cx="${scaledX}" cy="${scaledY}" r="${radius}" fill="${matchedColor.hex}" fill-opacity="0.5" /></svg>`;

    // Generate a unique output filename using the current timestamp.
    // Date.now() returns milliseconds since Jan 1, 1970 (e.g., 1699027200000).
    // This prevents filename collisions if two requests arrive simultaneously.
    const resultPath = path.join(__dirname, 'uploads', `result_${Date.now()}.png`);

    // The main image processing pipeline:
    // 1. sharp(uploadedPath) — load the original photo
    // 2. .composite([...]) — layer the SVG overlay on top
    //    - input: Buffer.from(svgString) converts the SVG text to binary data
    //    - blend: 'over' means normal layering (overlay sits on top)
    // 3. .toFile(resultPath) — save the composited result as a PNG
    await sharp(uploadedPath)
      .composite([{ input: Buffer.from(colorOverlaySvg), blend: 'over' }])
      .toFile(resultPath);

    // Delete the original uploaded file — we don't need it anymore.
    // .catch(() => {}) silently ignores errors (e.g., file already deleted).
    // Without .catch(), a failed deletion would throw an unhandled promise
    // rejection and potentially crash the server.
    await fs.unlink(uploadedPath).catch(() => {});

    // Send the result image file back to the client.
    // response.sendFile() streams the file with the correct Content-Type.
    // The callback runs AFTER the file has been fully transmitted.
    // We delete the result file in the callback because we can't delete it
    // before sending — there would be nothing to send!
    response.sendFile(resultPath, (err) => {
      fs.unlink(resultPath).catch(() => {});
    });

  } catch (error) {
    // If anything in the try block fails, clean up the uploaded file
    // so we don't leave junk in the uploads folder.
    if (uploadedPath) fs.unlink(uploadedPath).catch(() => {});

    // Send a 500 (Internal Server Error) with the error details.
    // error.message is the human-readable description of what went wrong.
    response.status(500).json({ error: 'Processing failed', details: error.message });
  }
});


// --- 404 CATCH-ALL ---

// This must be the LAST route. Express matches routes in the order they're
// defined. If no previous route matched, this one catches everything.
// request.originalUrl is the full URL path the client requested.
app.use((request, response) => {
  response.status(404).json({
    error: 'Not Found',
    path: request.originalUrl,
  });
});


// --- START SERVER ---

// app.listen starts the server and begins accepting connections.
// The callback runs once the server is successfully listening.
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});