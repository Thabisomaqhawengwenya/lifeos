import * as Updates from 'expo-updates';
import * as Network from 'expo-network';

export interface UpdateStatus {
  isChecking: boolean;
  isAvailable: boolean;
  isDownloaded: boolean;
  isWifi: boolean;
  manifest?: Updates.Manifest;
  error?: string | null;
}

type UpdateListener = (status: UpdateStatus) => void;

class UpdateService {
  private listeners: Set<UpdateListener> = new Set();
  private status: UpdateStatus = {
    isChecking: false,
    isAvailable: false,
    isDownloaded: false,
    isWifi: false,
    error: null,
  };

  public subscribe(listener: UpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.status));
  }

  public getStatus(): UpdateStatus {
    return this.status;
  }

  /**
   * Check for updates strictly over Wi-Fi (or if force=true)
   */
  public async checkForUpdates(force = false): Promise<boolean> {
    if (__DEV__ || !Updates.isEnabled) {
      // In development or when updates are disabled, expo-updates does not pull remote bundles
      return false;
    }

    try {
      this.status = { ...this.status, isChecking: true, error: null };
      this.notify();

      const netState = await Network.getNetworkStateAsync();
      const isWifi = netState.type === Network.NetworkStateType.WIFI;
      this.status.isWifi = isWifi;

      if (!isWifi && !force) {
        this.status.isChecking = false;
        this.notify();
        return false;
      }

      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        this.status.isAvailable = true;
        this.status.manifest = update.manifest;
        this.notify();

        // Download the update payload
        await Updates.fetchUpdateAsync();
        this.status.isDownloaded = true;
        this.status.isChecking = false;
        this.notify();
        return true;
      } else {
        this.status.isAvailable = false;
        this.status.isChecking = false;
        this.notify();
        return false;
      }
    } catch (err: any) {
      this.status.isChecking = false;
      this.status.error = err?.message || 'Failed to check for updates';
      this.notify();
      return false;
    }
  }

  /**
   * Reload the app to activate the freshly downloaded update
   */
  public async applyUpdate(): Promise<void> {
    if (this.status.isDownloaded) {
      await Updates.reloadAsync();
    }
  }
}

export const updateService = new UpdateService();
