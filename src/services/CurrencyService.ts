import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export type SupportedCurrency = 'USD' | 'ZiG' | 'ZAR' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: SupportedCurrency;
  symbol: string;
  name: string;
}

export const CURRENCIES: Record<SupportedCurrency, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  ZiG: { code: 'ZiG', symbol: 'ZiG ', name: 'Zimbabwe Gold' },
  ZAR: { code: 'ZAR', symbol: 'R ', name: 'South African Rand' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
};

const CURRENCY_STORE_KEY = 'lifeos_preferred_currency';

export class CurrencyService {
  private static cachedCurrency: SupportedCurrency = 'USD';

  static async getPreferredCurrency(): Promise<CurrencyConfig> {
    if (Platform.OS === 'web') return CURRENCIES[this.cachedCurrency];
    try {
      const stored = await SecureStore.getItemAsync(CURRENCY_STORE_KEY);
      if (stored && stored in CURRENCIES) {
        this.cachedCurrency = stored as SupportedCurrency;
      }
    } catch {
      // Fallback to cached default
    }
    return CURRENCIES[this.cachedCurrency];
  }

  static async setPreferredCurrency(code: SupportedCurrency): Promise<void> {
    this.cachedCurrency = code;
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(CURRENCY_STORE_KEY, code);
      } catch (err) {
        console.warn('Failed saving currency:', err);
      }
    }
  }

  static formatCents(amountCents: number, currency: CurrencyConfig = CURRENCIES.USD): string {
    const value = (amountCents / 100).toFixed(2);
    return `${currency.symbol}${value}`;
  }
}
