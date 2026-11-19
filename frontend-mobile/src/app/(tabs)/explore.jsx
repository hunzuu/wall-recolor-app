// /app/(tabs)/explore.jsx
// Explore Screen: 2026 Interior Design Color Trends & Room Palette Inspirations

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const TRENDING_PALETTES = [
  {
    title: 'Nordic Calm',
    category: 'MINIMALIST',
    description: 'Crisp airy tones that open up compact living spaces and maximize natural light.',
    colors: ['#F1F5F9', '#CBD5E1', '#94A3B8', '#64748B'],
  },
  {
    title: 'Earthy Sanctuary',
    category: 'WARM & COZY',
    description: 'Terracotta and warm taupes inspired by Mediterranean villas and clay architecture.',
    colors: ['#FDF2F8', '#FBCFE8', '#F472B6', '#BE185D'],
  },
  {
    title: 'Forest Retreat',
    category: 'BIOPHILIC',
    description: 'Deep sage and botanical greens known to reduce heart rates and induce calm.',
    colors: ['#ECFDF5', '#A7F3D0', '#34D399', '#065F46'],
  },
  {
    title: 'Midnight Lounge',
    category: 'DRAMATIC ACCENT',
    description: 'Moody jewel tones ideal for dining rooms, home theaters, and study alcoves.',
    colors: ['#EEF2FF', '#C7D2FE', '#6366F1', '#312E81'],
  },
];

export default function ExploreTab() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.trendBadge}>
          <Text style={styles.trendBadgeText}>2026 FORECAST</Text>
        </View>
        <Text style={styles.title}>Trending Paint Palettes</Text>
        <Text style={styles.subtitle}>
          Curated room color stories designed by leading interior architects.
        </Text>
      </View>

      {/* Palette Cards */}
      {TRENDING_PALETTES.map((palette) => (
        <View key={palette.title} style={styles.paletteCard}>
          <View style={styles.paletteTop}>
            <View>
              <Text style={styles.categoryText}>{palette.category}</Text>
              <Text style={styles.paletteTitle}>{palette.title}</Text>
            </View>
            <TouchableOpacity
              style={styles.tryBtn}
              onPress={() => router.push('/(tabs)/studio')}
            >
              <Text style={styles.tryBtnText}>Try in Studio</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.paletteDesc}>{palette.description}</Text>

          {/* Color Swatch Bars */}
          <View style={styles.swatchBar}>
            {palette.colors.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.swatchSegment,
                  { backgroundColor: c },
                  i === 0 && styles.firstSegment,
                  i === palette.colors.length - 1 && styles.lastSegment,
                ]}
              />
            ))}
          </View>
        </View>
      ))}

      {/* Sheen Guide Card */}
      <View style={styles.guideCard}>
        <View style={styles.guideHeader}>
          <MaterialCommunityIcons name="format-paint" size={20} color="#2563EB" />
          <Text style={styles.guideTitle}>Paint Sheen Cheat Sheet</Text>
        </View>
        <View style={styles.guideRow}>
          <Text style={styles.sheenType}>Matte / Flat:</Text>
          <Text style={styles.sheenText}>Hides wall flaws, best for ceilings & master bedrooms.</Text>
        </View>
        <View style={styles.guideRow}>
          <Text style={styles.sheenType}>Eggshell / Satin:</Text>
          <Text style={styles.sheenText}>Durable and washable, ideal for living rooms & hallways.</Text>
        </View>
        <View style={styles.guideRow}>
          <Text style={styles.sheenType}>Semi-Gloss:</Text>
          <Text style={styles.sheenText}>Resists moisture, best for bathrooms, kitchens, and trim.</Text>
        </View>
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
  header: {
    marginVertical: 16,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  trendBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2563EB',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },
  paletteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  paletteTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  paletteTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  tryBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  tryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  paletteDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  swatchBar: {
    flexDirection: 'row',
    height: 36,
    borderRadius: 10,
    overflow: 'hidden',
  },
  swatchSegment: {
    flex: 1,
  },
  firstSegment: {
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  lastSegment: {
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  guideRow: {
    marginBottom: 10,
  },
  sheenType: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  sheenText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});