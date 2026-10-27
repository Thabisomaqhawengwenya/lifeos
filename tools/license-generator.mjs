#!/usr/bin/env node
/**
 * LifeOS — CLI License Key Generator & Validator (HMAC-SHA256)
 * -------------------------------------------------------------
 * Generates and validates cryptographic offline activation keys for LifeOS.
 *
 * Usage:
 *   node tools/license-generator.mjs --name "MRQ" --tier pro
 *   node tools/license-generator.mjs --name "MRQ" --tier enterprise --year 2035
 *   node tools/license-generator.mjs --verify LIFEOS-PRO-MRQ-XXXXXXXX
 */

import crypto from 'node:crypto';

const LICENSE_SECRET = 'LIFEOS_2026_OFFLINE_HMAC_SHA256_ACTIVATION_SECRET';
const MIN_YEAR = 2026;
const MAX_YEAR = 2036;

function computeSignature(payload) {
  const combined = `${payload}:${LICENSE_SECRET}`;
  return crypto.createHash('sha256').update(combined).digest('hex').slice(0, 8).toUpperCase();
}

function generateLicenseKey({ name = 'MRQ', tier = 'pro', year = 2030 }) {
  const tierCode = tier.toLowerCase() === 'enterprise' ? 'ENT' : 'PRO';
  const cleanName = name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8) || 'MRQ';
  const safeYear = Math.min(Math.max(parseInt(year, 10) || 2030, MIN_YEAR), MAX_YEAR);
  const payload = `${tierCode}-${cleanName}-${safeYear}`;
  const signature = computeSignature(payload);
  return `LIFEOS-${tierCode}-${cleanName}-${signature}`;
}

function verifyLicenseKey(key) {
  const clean = key.trim().toUpperCase().replace(/\s+/g, '');
  const parts = clean.split('-');
  if (parts.length < 4 || parts[0] !== 'LIFEOS') {
    return { isValid: false, error: 'Invalid key structure.' };
  }
  const [, tierCode, cleanName, providedSig] = parts;
  const tier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : null;
  if (!tier) return { isValid: false, error: 'Unknown tier' };

  for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
    const payload = `${tierCode}-${cleanName}-${y}`;
    if (computeSignature(payload) === providedSig) {
      return { isValid: true, tier, name: cleanName, expiresYear: y };
    }
  }
  return { isValid: false, error: 'Signature mismatch.' };
}

// CLI Arg Parsing
const args = process.argv.slice(2);
let name = 'MRQ';
let tier = 'pro';
let year = 2030;
let verifyKey = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--name' && args[i + 1]) name = args[i + 1];
  if (args[i] === '--tier' && args[i + 1]) tier = args[i + 1];
  if (args[i] === '--year' && args[i + 1]) year = args[i + 1];
  if (args[i] === '--verify' && args[i + 1]) verifyKey = args[i + 1];
}

if (verifyKey) {
  const res = verifyLicenseKey(verifyKey);
  console.log('\n--- LifeOS License Verification ---');
  console.log(res);
} else {
  const key = generateLicenseKey({ name, tier, year });
  console.log('\n=============================================');
  console.log('       LifeOS Offline License Generator      ');
  console.log('=============================================');
  console.log(`Holder Name : ${name}`);
  console.log(`Tier        : ${tier.toUpperCase()}`);
  console.log(`Valid Until : ${year}`);
  console.log(`License Key : ${key}`);
  console.log('=============================================\n');
}
