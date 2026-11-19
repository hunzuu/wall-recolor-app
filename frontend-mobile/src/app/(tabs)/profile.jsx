// /app/(tabs)/profile.jsx
// Profile & Settings: Account info, saved palettes, Pro subscription teaser, and preferences

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const [hapticsEnabled, setHapticsEnabled] = React.useState(true);
  const [hdExport, setHdExport] = React.useState(false);

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* User Header */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>CV</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>ColorVision Artist</Text>
          <Text style={styles.userEmail}>Free Member</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.freeBadgeText}>FREE TIER</Text>
        </View>
      </View>

      {/* Pro Membership Banner */}
      <View style={styles.proCard}>
        <View style={styles.proCardHeader}>
          <MaterialCommunityIcons name="crown" size={24} color="#F59E0B" />
          <Text style={styles.proCardTitle}>Upgrade to ColorVision Pro</Text>
        </View>
        <Text style={styles.proCardBody}>
          Unlock unlimited custom palettes, AI SAM wall edge-detection, and export high-resolution paint specification PDFs.
        </Text>
        <TouchableOpacity style={styles.proUpgradeBtn} activeOpacity={0.85}>
          <Text style={styles.proUpgradeBtnText}>View Pro Plans (Coming Soon)</Text>
        </TouchableOpacity>
      </View>

      {/* Saved Projects & Palettes */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Saved Projects</Text>
        <View style={styles.emptyProjectsCard}>
          <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
          <Text style={styles.emptyProjectsTitle}>No saved rooms yet</Text>
          <Text style={styles.emptyProjectsSubtitle}>
            When you repaint walls in Studio, tap "Save Project" to keep your room designs here.
          </Text>
        </View>
      </View>

      {/* Settings List */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Preferences</Text>

        <View style={styles.settingsGroup}>
          <View style={styles.settingRow}>
            <View style={styles.settingIconText}>
              <Ionicons name="phone-portrait-outline" size={20} color="#2563EB" />
              <Text style={styles.settingLabel}>Haptic Tap Feedback</Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={setHapticsEnabled}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={hapticsEnabled ? '#2563EB' : '#F8FAFC'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingIconText}>
              <Ionicons name="sparkles-outline" size={20} color="#2563EB" />
              <Text style={styles.settingLabel}>Ultra HD AI Processing</Text>
            </View>
            <Switch
              value={hdExport}
              onValueChange={setHdExport}
              trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
              thumbColor={hdExport ? '#2563EB' : '#F8FAFC'}
            />
          </View>
        </View>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ColorVision Paint Co. v1.2.0</Text>
        <Text style={styles.footerSubtext}>Powered by Expo & AI Vision Engine</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
  },
  avatarText: {
    color: '#2563EB',
    fontWeight: '800',
    fontSize: 16,
  },
  userInfo: {
    marginLeft: 14,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  freeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  proCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    padding: 20,
    marginTop: 18,
  },
  proCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  proCardTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  proCardBody: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  proUpgradeBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  proUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  emptyProjectsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyProjectsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#334155',
    marginTop: 8,
  },
  emptyProjectsSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 240,
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  settingIconText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#CBD5E1',
    marginTop: 2,
  },
});