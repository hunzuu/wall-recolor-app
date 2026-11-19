// /app/(tabs)/index.jsx
// Home Screen: Photo capture, gallery import, visual room presets, and inspiration cards

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
  requestCameraPermissionsAsync,
  launchCameraAsync,
} from 'expo-image-picker';

const bedroomImgUri = Image.resolveAssetSource(
  require('../../../assets/images/demoPics/bedroom.png')
).uri;
const livingRoomImgUri = Image.resolveAssetSource(
  require('../../../assets/images/demoPics/living-room.png')
).uri;

export default function HomeTab() {
  const insets = useSafeAreaInsets();

  const pickImage = async () => {
    const { status } = await requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photos.');
      return;
    }

    const result = await launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled) return;
    const asset = result.assets[0];

    router.push({
      pathname: '/studio',
      params: {
        imageUri: asset.uri,
        imgWidth: asset.width,
        imgHeight: asset.height,
        isDemo: 'false',
      },
    });
  };

  const takeImage = async () => {
    const { status } = await requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    const result = await launchCameraAsync({
      quality: 1,
    });

    if (result.canceled) return;
    const asset = result.assets[0];

    router.push({
      pathname: '/studio',
      params: {
        imageUri: asset.uri,
        imgWidth: asset.width,
        imgHeight: asset.height,
        isDemo: 'false',
      },
    });
  };

  const openDemoRoom = (uri, roomName) => {
    router.push({
      pathname: '/studio',
      params: {
        imageUri: uri,
        roomName,
        isDemo: 'true',
      },
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={14} color="#2563EB" />
            <Text style={styles.badgeText}>AI WALL COLOR VISUALIZER</Text>
          </View>
          <Text style={styles.title}>See your space in any color</Text>
          <Text style={styles.subtitle}>
            Preview paint colors on your real walls before spending a dime.
          </Text>
        </View>

        {/* Primary Action Card */}
        <View style={styles.actionCard}>
          <Text style={styles.cardHeader}>Upload Your Room</Text>
          <Text style={styles.cardSubheader}>
            Snap a photo or select an existing picture of your wall
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={pickImage}
          >
            <Ionicons name="images-outline" size={20} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Choose from Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.85}
            onPress={takeImage}
          >
            <Ionicons name="camera-outline" size={20} color="#0F172A" />
            <Text style={styles.secondaryBtnText}>Take a Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.orText}>OR TRY SAMPLE ROOMS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Demo Rooms Section with Visual Thumbnails */}
        <View style={styles.demoSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Sample Rooms</Text>
            <Text style={styles.sectionSubtitle}>Tap to test colors instantly</Text>
          </View>

          <View style={styles.demoCardGrid}>
            {/* Bedroom Card */}
            <TouchableOpacity
              style={styles.roomCard}
              activeOpacity={0.9}
              onPress={() => openDemoRoom(bedroomImgUri, 'Cozy Bedroom')}
            >
              <Image source={{ uri: bedroomImgUri }} style={styles.roomImage} />
              <View style={styles.roomOverlay}>
                <View style={styles.roomTag}>
                  <Text style={styles.roomTagText}>BEDROOM</Text>
                </View>
                <Text style={styles.roomName}>Cozy Bedroom</Text>
              </View>
            </TouchableOpacity>

            {/* Living Room Card */}
            <TouchableOpacity
              style={styles.roomCard}
              activeOpacity={0.9}
              onPress={() => openDemoRoom(livingRoomImgUri, 'Modern Living Room')}
            >
              <Image source={{ uri: livingRoomImgUri }} style={styles.roomImage} />
              <View style={styles.roomOverlay}>
                <View style={styles.roomTag}>
                  <Text style={styles.roomTagText}>LIVING ROOM</Text>
                </View>
                <Text style={styles.roomName}>Modern Living Room</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pro Teaser Banner (Placeholder for Future Paid Features) */}
        <View style={styles.proBanner}>
          <View style={styles.proBannerHeader}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>PRO FEATURES</Text>
            </View>
            <Text style={styles.proBannerTitle}>Coming Soon to ColorVision</Text>
          </View>
          <Text style={styles.proBannerBody}>
            Multi-wall masking, exact paint brand catalog matching (Sherwin-Williams, Benjamin Moore), and 3D lighting simulation.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 8,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
    maxWidth: 300,
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  cardSubheader: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 18,
  },
  primaryBtn: {
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 15,
    borderRadius: 14,
    width: '100%',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 14,
    width: '100%',
    marginTop: 10,
  },
  secondaryBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  orText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginHorizontal: 12,
  },
  demoSection: {
    width: '100%',
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  demoCardGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  roomCard: {
    flex: 1,
    height: 150,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#CBD5E1',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'space-between',
    padding: 12,
  },
  roomTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  roomName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  proBanner: {
    marginTop: 24,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  proBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  proBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  proBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  proBannerBody: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});