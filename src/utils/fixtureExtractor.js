// src/utils/fixtureExtractor.js
/**
 * Utility to extract PM CUP fixture information from an image file or a public Instagram post URL.
 * Returns a JSON object with keys: homeTeam, awayTeam, date, time, venue (optional).
 * If extraction fails, a warning is logged and null is returned.
 */

import fetch from 'node-fetch';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

// Expanded regex patterns – support "vs", "@", "-", "–", "vs." and case‑insensitive spacing.
const TEAM_REGEX = /([A-Za-z\s]+)\s*(?:vs|@|\-|–|vs\.|vs\s?\.?)\s*([A-Za-z\s]+)/i;
const DATE_REGEX = /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/; // matches 12/09/2026 or 12-09-2026
const TIME_REGEX = /(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i;
const VENUE_REGEX = /Venue[:\s]+([^\n]+)/i;

/**
 * Parse raw text to extract fixture fields.
 * @param {string} text - Raw OCR or caption text.
 * @returns {object|null}
 */
function parseFixtureText(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const combined = lines.join(' ');
  const teamsMatch = combined.match(TEAM_REGEX);
  const dateMatch = combined.match(DATE_REGEX);
  const timeMatch = combined.match(TIME_REGEX);
  const venueMatch = combined.match(VENUE_REGEX);

  if (!teamsMatch) {
    console.warn('fixtureExtractor: Unable to locate teams in text');
    return null;
  }

  return {
    homeTeam: teamsMatch[1].trim(),
    awayTeam: teamsMatch[2].trim(),
    date: dateMatch ? dateMatch[1] : null,
    time: timeMatch ? timeMatch[1] : null,
    venue: venueMatch ? venueMatch[1].trim() : null,
  };
}

/**
 * Perform OCR on a local image file.
 * @param {string} imagePath - Absolute path to the image.
 * @returns {Promise<object|null>}
 */
export async function extractFromImage(imagePath) {
  const worker = await createWorker({ logger: m => {/* silent */} });
  try {
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    // Preprocess image: grayscale + normalization to improve OCR accuracy
    const processed = await sharp(imagePath)
      .grayscale()
      .normalize()
      .toBuffer();
    const { data: { text } } = await worker.recognize(processed);
    return parseFixtureText(text);
  } catch (e) {
    console.warn('fixtureExtractor: OCR failed –', e.message);
    return null;
  } finally {
    await worker.terminate();
  }
}

/**
 * Fetch Instagram post HTML and extract caption text.
 * @param {string} url - Public Instagram post URL.
 * @returns {Promise<object|null>}
 */
export async function extractFromInstagram(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) {
      console.warn(`fixtureExtractor: Failed to fetch Instagram post – ${res.status}`);
      return null;
    }
    const html = await res.text();
    // Instagram embeds the caption inside a <meta property="og:description" content="..." />
    const metaMatch = html.match(/<meta\s+property="og:description"\s+content="([^"]+)"/i);
    const caption = metaMatch ? decodeURIComponent(metaMatch[1]) : '';
    return parseFixtureText(caption);
  } catch (e) {
    console.warn('fixtureExtractor: Instagram fetch failed –', e.message);
    return null;
  }
}

/**
 * Unified entry point – decides based on source type.
 * @param {string} source - Either a file path ending with an image extension or an Instagram URL.
 * @returns {Promise<object|null>}
 */
export async function extractFixtureInfo(source) {
  const lower = source.toLowerCase();
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.bmp')) {
    return await extractFromImage(source);
  }
  if (lower.startsWith('http') && lower.includes('instagram.com')) {
    return await extractFromInstagram(source);
  }
  console.warn('fixtureExtractor: Unsupported source type – must be image path or Instagram URL');
  return null;
}
