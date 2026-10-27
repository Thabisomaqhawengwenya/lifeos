import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateService, UpdateStatus } from '@/src/services/UpdateService';
import { haptic } from '@/src/design-system/haptics';

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>(updateService.getStatus());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Initial check on mount
    updateService.checkForUpdates(false);
    const unsubscribe = updateService.subscribe((s) => setStatus(s));
    return () => unsubscribe();
  }, []);

  if (!status.isDownloaded || dismissed) {
    return null;
  }

  const handleApply = async () => {
    haptic.heavy();
    await updateService.applyUpdate();
  };

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <View style={styles.headerRow}>
          <View style={styles.tag}>
            <Ionicons name="flash" size={12} color="#000000" />
            <Text style={styles.tagText}>OTA UPDATE READY</Text>
          </View>
          <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="close" size={18} color="#000000" />
          </TouchableOpacity>
        </View>

        <Text style={styles.message}>
          A new version of LifeOS was downloaded over Wi-Fi. Restart now to activate.
        </Text>

        <TouchableOpacity style={styles.actionBtn} activeOpacity={0.85} onPress={handleApply}>
          <Text style={styles.actionBtnText}>RESTART & APPLY NOW</Text>
          <Ionicons name="arrow-forward" size={14} color="#000000" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    zIndex: 9999,
  },
  banner: {
    backgroundColor: '#FFE500',
    borderWidth: 2.5,
    borderColor: '#000000',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  tagText: {
    fontFamily: 'SpaceMono',
    fontSize: 10,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 16,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  actionBtnText: {
    fontFamily: 'SpaceMono',
    fontSize: 11,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
