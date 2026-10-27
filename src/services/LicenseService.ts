import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';

const LICENSE_KEY = 'lifeos_active_license_key';
const LICENSE_SECRET = 'LIFEOS_2026_OFFLINE_HMAC_SHA256_ACTIVATION_SECRET';
const MIN_YEAR = 2026;
const MAX_YEAR = 2036;

export interface LicenseInfo {
  isActivated: boolean;
  tier: 'community' | 'pro' | 'enterprise';
  licenseKey: string | null;
  holderName: string | null;
  expiresYear: number | null;
}

export class LicenseService {
  private static async computeSignature(payload: string): Promise<string> {
    const combined = `${payload}:${LICENSE_SECRET}`;
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, combined);
    return hash.slice(0, 8).toUpperCase();
  }

  static async verifyLicenseKey(rawKey: string): Promise<{ isValid: boolean; tier?: 'pro' | 'enterprise'; holderName?: string; expiresYear?: number; error?: string }> {
    const clean = rawKey.trim().toUpperCase().replace(/\s+/g, '');
    const parts = clean.split('-');

    if (parts.length < 4 || parts[0] !== 'LIFEOS') {
      return { isValid: false, error: 'Invalid key format. Expected LIFEOS-TIER-NAME-SIGNATURE' };
    }

    const [, tierCode, holderName, providedSig] = parts;
    const tier = tierCode === 'ENT' ? 'enterprise' : tierCode === 'PRO' ? 'pro' : null;

    if (!tier) {
      return { isValid: false, error: 'Unknown license tier.' };
    }

    let matchedYear = 0;
    for (let y = MIN_YEAR; y <= MAX_YEAR; y++) {
      const payload = `${tierCode}-${holderName}-${y}`;
      const sig = await this.computeSignature(payload);
      if (sig === providedSig) {
        matchedYear = y;
        break;
      }
    }

    if (!matchedYear) {
      return { isValid: false, error: 'Cryptographic signature mismatch or tampered key.' };
    }

    return {
      isValid: true,
      tier,
      holderName,
      expiresYear: matchedYear,
    };
  }

  static async activateLicense(key: string): Promise<{ success: boolean; error?: string; tier?: string }> {
    const verification = await this.verifyLicenseKey(key);
    if (!verification.isValid) {
      return { success: false, error: verification.error };
    }

    if (Platform.OS !== 'web') {
      await SecureStore.setItemAsync(LICENSE_KEY, key.trim().toUpperCase());
    }

    return { success: true, tier: verification.tier };
  }

  static async getLicenseInfo(): Promise<LicenseInfo> {
    if (Platform.OS === 'web') {
      return { isActivated: true, tier: 'pro', licenseKey: 'LIFEOS-PRO-WEB-DEMO', holderName: 'MRQ', expiresYear: 2030 };
    }

    try {
      const storedKey = await SecureStore.getItemAsync(LICENSE_KEY);
      if (!storedKey) {
        return { isActivated: false, tier: 'community', licenseKey: null, holderName: null, expiresYear: null };
      }

      const res = await this.verifyLicenseKey(storedKey);
      if (res.isValid && res.tier) {
        return {
          isActivated: true,
          tier: res.tier,
          licenseKey: storedKey,
          holderName: res.holderName || 'USER',
          expiresYear: res.expiresYear || 2030,
        };
      }

      return { isActivated: false, tier: 'community', licenseKey: null, holderName: null, expiresYear: null };
    } catch {
      return { isActivated: false, tier: 'community', licenseKey: null, holderName: null, expiresYear: null };
    }
  }

  static async deactivateLicense(): Promise<void> {
    if (Platform.OS !== 'web') {
      await SecureStore.deleteItemAsync(LICENSE_KEY);
    }
  }
}
