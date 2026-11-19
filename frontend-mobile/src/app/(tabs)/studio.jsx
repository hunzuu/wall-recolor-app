// /app/(tabs)/studio.jsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

// CONFIG: Your computer's local Wi-Fi IP and backend port
const BACKEND_URL = 'http://192.168.100.140:4000';

const DEFAULT_COLORS = [
  { hex: '#7C8D77', name: 'Sage Green' },
  { hex: '#C2634B', name: 'Terracotta' },
  { hex: '#1D3557', name: 'Deep Navy' },
  { hex: '#F5EBE0', name: 'Cozy Linen' },
  { hex: '#374151', name: 'Charcoal' },
  { hex: '#D98880', name: 'Dusty Rose' },
  { hex: '#7EA0B7', name: 'Coastal Blue' },
  { hex: '#D4A373', name: 'Warm Amber' },
];

export default function StudioScreen() {
  const params = useLocalSearchParams();

  // Core image state & history stack (for Undo / Redo)
  const [baseImageUri, setBaseImageUri] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [activeImgWidth, setActiveImgWidth] = useState(1);
  const [activeImgHeight, setActiveImgHeight] = useState(1);

  // UI & Tool states
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState('Tap on any wall to paint');
  const [mode, setMode] = useState('paint'); // 'paint' | 'eyedropper' | 'eraser'
  const [selectedColor, setSelectedColor] = useState(DEFAULT_COLORS[0].hex);
  const [customColors, setCustomColors] = useState([]);
  const [colorsInUse, setColorsInUse] = useState([]);

  // Eraser brush & Sensitivity tolerance
  const [eraserSize, setEraserSize] = useState(25); // 20 | 35 | 50
  const [tolerance, setTolerance] = useState(36); // 25 (tight), 36 (balanced), 50 (wide)
  const [pickPin, setPickPin] = useState(null);

  // Free plan limit (3 walls)
  const [wallsPaintedCount, setWallsPaintedCount] = useState(0);

  const displayImageUri = history[historyIndex] || baseImageUri;
  const hasImage = Boolean(baseImageUri);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Helper: converts local file URI or remote URL to a standard Blob (Expo-compatible)
  const uriToBlob = async (uri) => {
    const res = await fetch(uri);
    return await res.blob();
  };

  // 1. Initial image preparation
  useEffect(() => {
    const prepareImage = async () => {
      if (!params.imageUri) return;

      try {
        setIsLoading(true);
        setStatusText('Preparing room photo...');

        const result = await manipulateAsync(
          params.imageUri,
          [],
          { compress: 0.92, format: SaveFormat.JPEG }
        );

        setActiveImgWidth(result.width);
        setActiveImgHeight(result.height);
        setBaseImageUri(result.uri);
        setHistory([result.uri]);
        setHistoryIndex(0);
        setWallsPaintedCount(0);
        setColorsInUse([]);
        setStatusText('Ready! Select a color and tap a wall.');
      } catch (error) {
        console.error('Image prep error:', error);
        Alert.alert('Error', 'Could not process the selected image.');
      } finally {
        setIsLoading(false);
      }
    };

    prepareImage();
  }, [params.imageUri]);

  const imageDisplayHeight = (screenWidth / activeImgWidth) * activeImgHeight;

  // 2. Undo / Redo Handlers
  const handleUndo = () => {
    if (canUndo) {
      const prevIdx = historyIndex - 1;
      setHistoryIndex(prevIdx);
      setWallsPaintedCount((prev) => Math.max(0, prev - 1));
      setStatusText('Undid last action.');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const nextIdx = historyIndex + 1;
      setHistoryIndex(nextIdx);
      setWallsPaintedCount((prev) => prev + 1);
      setStatusText('Redid action.');
    }
  };

  // 3. Reset Handler with Confirmation
  const handleResetWithConfirm = () => {
    if (!hasImage) return;

    Alert.alert(
      'Reset Room Photo?',
      'Are you sure you want to remove all painted walls and start over with the original image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setHistory([baseImageUri]);
            setHistoryIndex(0);
            setWallsPaintedCount(0);
            setColorsInUse([]);
            setPickPin(null);
            setStatusText('Reset complete. Tap on a wall to paint.');
          },
        },
      ]
    );
  };

  // 4. Download / Save Final Image
  const handleDownloadImage = async () => {
    if (!displayImageUri) return;
    try {
      setIsLoading(true);
      await Share.share({
        title: 'My ColorVision Repainted Room',
        url: displayImageUri,
        message: 'Check out my newly repainted room designed with ColorVision Paint Co.!',
      });
    } catch (err) {
      Alert.alert('Save Error', 'Could not save the image.');
    } finally {
      setIsLoading(false);
    }
  };

  // 5. AI Object Removal Placeholder
  const handleRemoveObjectPrompt = () => {
    Alert.alert(
      '✨ AI Object Removal (Coming Soon)',
      'Tap on any item in your room (like a chair, table, or wall painting) to cleanly remove it with generative AI before visualizing wall paints.',
      [{ text: 'Got it!' }]
    );
  };

  // 6. Custom Color Helpers
  const addCustomColor = (hexCode) => {
    if (customColors.includes(hexCode) || DEFAULT_COLORS.some((c) => c.hex === hexCode)) {
      setSelectedColor(hexCode);
      return;
    }

    if (customColors.length >= 3) {
      Alert.alert('✨ Pro Limit', 'Free tier stores up to 3 custom eyedropped colors.');
      return;
    }

    setCustomColors((prev) => [...prev, hexCode]);
    setSelectedColor(hexCode);
  };

  const removeCustomColor = (hexCode) => {
    setCustomColors((prev) => prev.filter((c) => c !== hexCode));
    if (selectedColor === hexCode) {
      setSelectedColor(DEFAULT_COLORS[0].hex);
    }
  };

  // 7. Touch Handler
  const handleImageTap = async (event) => {
    if (!hasImage || isLoading) return;

    const { locationX, locationY } = event.nativeEvent;
    const scaleX = activeImgWidth / screenWidth;
    const scaleY = activeImgHeight / imageDisplayHeight;

    const actualX = Math.round(locationX * scaleX);
    const actualY = Math.round(locationY * scaleY);

    if (mode === 'eyedropper') {
      setPickPin({ x: locationX, y: locationY, color: '#FFFFFF' });
      await pickColor(actualX, actualY, locationX, locationY);
    } else if (mode === 'eraser') {
      await eraseSpot(actualX, actualY);
    } else {
      setPickPin(null);
      await paintWall(actualX, actualY);
    }
  };

  // 8. Paint Wall API (Uses Web Blob for Expo compatibility)
  const paintWall = async (x, y) => {
    if (wallsPaintedCount >= 3) {
      Alert.alert(
        '🎨 Free Trial Limit',
        'You have repainted 3 walls on this room photo. Upgrade to ColorVision Pro for unlimited walls or tap Reset to start over.'
      );
      return;
    }

    setIsLoading(true);
    setStatusText('Applying paint to wall with anti-bleed AI...');
    try {
      const imageBlob = await uriToBlob(displayImageUri);
      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg');
      formData.append('x', String(x));
      formData.append('y', String(y));
      formData.append('color', selectedColor);
      formData.append('tolerance', String(tolerance));
      formData.append('displayWidth', String(activeImgWidth));
      formData.append('displayHeight', String(activeImgHeight));

      const response = await fetch(`${BACKEND_URL}/api/preview-flood`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Server error ${response.status}`);
      }

      const nextUrl = `${BACKEND_URL}${data.previewUrl}?t=${Date.now()}`;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(nextUrl);

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setWallsPaintedCount((prev) => prev + 1);

      if (!colorsInUse.includes(selectedColor)) {
        setColorsInUse((prev) => [...prev, selectedColor]);
      }

      setStatusText(`Wall painted! (${wallsPaintedCount + 1}/3 free walls). Use Eraser to fix edges.`);
    } catch (error) {
      console.warn('Paint error:', error.message);
      Alert.alert('Paint Error', error.message);
      setStatusText('Ready! Select a color and tap a wall.');
    } finally {
      setIsLoading(false);
    }
  };

  // 9. Eraser Tool API (Uses Web Blobs for Expo compatibility)
  const eraseSpot = async (x, y) => {
    setIsLoading(true);
    setStatusText('Erasing paint mask...');
    try {
      const currBlob = await uriToBlob(displayImageUri);
      const origBlob = await uriToBlob(baseImageUri);

      const formData = new FormData();
      formData.append('currentImage', currBlob, 'current.jpg');
      formData.append('originalImage', origBlob, 'original.jpg');
      formData.append('x', String(x));
      formData.append('y', String(y));
      formData.append('radius', String(eraserSize));
      formData.append('displayWidth', String(activeImgWidth));
      formData.append('displayHeight', String(activeImgHeight));

      const response = await fetch(`${BACKEND_URL}/api/erase`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Eraser failed');
      }

      const nextUrl = `${BACKEND_URL}${data.previewUrl}?t=${Date.now()}`;
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(nextUrl);

      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      setStatusText('Bleed erased! Tap another spot or switch to Paint.');
    } catch (error) {
      console.warn('Eraser error:', error.message);
      Alert.alert('Eraser Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 10. Eyedropper API (Uses Web Blob for Expo compatibility)
  const pickColor = async (x, y, screenX, screenY) => {
    setIsLoading(true);
    setStatusText('Sampling pixel color...');
    try {
      const imageBlob = await uriToBlob(baseImageUri);
      const formData = new FormData();
      formData.append('image', imageBlob, 'photo.jpg');
      formData.append('x', String(x));
      formData.append('y', String(y));
      formData.append('displayWidth', String(activeImgWidth));
      formData.append('displayHeight', String(activeImgHeight));

      const response = await fetch(`${BACKEND_URL}/api/pick-color`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Color extraction failed');
      }

      setPickPin({ x: screenX, y: screenY, color: data.hex });
      addCustomColor(data.hex);
      setMode('paint');
      setStatusText(`Sampled ${data.hex}! Tap wall to paint.`);
    } catch (error) {
      console.warn('Eyedropper error:', error.message);
      Alert.alert('Eyedropper Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} bounces={false}>
      {/* Canvas Viewport */}
      <View style={styles.canvasContainer}>
        {!hasImage ? (
          <View style={[styles.emptyState, { width: screenWidth, height: screenWidth * 1.1 }]}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="image-outline" size={48} color="#94A3B8" />
            </View>
            <Text style={styles.emptyTitle}>No Room Loaded</Text>
            <Text style={styles.emptySubtitle}>
              Go to the Home tab to pick or take a photo of the room you want to paint.
            </Text>
            <TouchableOpacity
              style={styles.emptyGoHomeBtn}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={styles.emptyGoHomeText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity activeOpacity={0.98} onPress={handleImageTap}>
            <Image
              source={{ uri: displayImageUri }}
              style={{ width: screenWidth, height: imageDisplayHeight }}
              resizeMode="contain"
            />
            {pickPin && mode === 'eyedropper' && (
              <View
                style={[
                  styles.pin,
                  { left: pickPin.x - 16, top: pickPin.y - 16, backgroundColor: pickPin.color },
                ]}
              >
                <View style={styles.pinCenterDot} />
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Loading Overlay */}
        {isLoading && hasImage && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>{statusText}</Text>
          </View>
        )}

        {/* Top Canvas Action Bar (Undo, Redo, Download, Reset) */}
        {hasImage && (
          <View style={styles.topCanvasBar}>
            <View style={styles.actionPillGroup}>
              <TouchableOpacity
                style={[styles.toolIconBtn, !canUndo && styles.btnDisabled]}
                onPress={handleUndo}
                disabled={!canUndo}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-undo" size={18} color={canUndo ? '#FFFFFF' : '#64748B'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toolIconBtn, !canRedo && styles.btnDisabled]}
                onPress={handleRedo}
                disabled={!canRedo}
                activeOpacity={0.7}
              >
                <Ionicons name="arrow-redo" size={18} color={canRedo ? '#FFFFFF' : '#64748B'} />
              </TouchableOpacity>

              <View style={styles.pillDivider} />

              <TouchableOpacity
                style={styles.toolIconBtn}
                onPress={handleResetWithConfirm}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={18} color="#EF4444" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolIconBtn}
                onPress={handleDownloadImage}
                activeOpacity={0.7}
              >
                <Ionicons name="download-outline" size={18} color="#22C55E" />
              </TouchableOpacity>
            </View>

            {/* AI Object Removal Feature */}
            <TouchableOpacity
              style={styles.aiObjectBtn}
              onPress={handleRemoveObjectPrompt}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="auto-fix" size={16} color="#F59E0B" />
              <Text style={styles.aiObjectText}>Remove Object</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Studio Bottom Controls */}
      <View style={styles.controls}>
        {/* Status Toast */}
        <View style={styles.statusToast}>
          <Ionicons name="information-circle-outline" size={16} color="#2563EB" />
          <Text style={styles.statusToastText} numberOfLines={1}>
            {statusText}
          </Text>
        </View>

        {/* Tool Mode Selector: Paint, Eyedrop, Eraser */}
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'paint' && styles.modeActive]}
            onPress={() => setMode('paint')}
            disabled={!hasImage}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="format-paint"
              size={18}
              color={mode === 'paint' ? '#2563EB' : '#64748B'}
            />
            <Text style={mode === 'paint' ? styles.modeTextActive : styles.modeText}>Paint</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'eyedropper' && styles.modeActive]}
            onPress={() => setMode('eyedropper')}
            disabled={!hasImage}
            activeOpacity={0.85}
          >
            <Ionicons
              name="eyedrop-outline"
              size={18}
              color={mode === 'eyedropper' ? '#2563EB' : '#64748B'}
            />
            <Text style={mode === 'eyedropper' ? styles.modeTextActive : styles.modeText}>
              Eyedrop
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeButton, mode === 'eraser' && styles.modeActive]}
            onPress={() => setMode('eraser')}
            disabled={!hasImage}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name="eraser"
              size={18}
              color={mode === 'eraser' ? '#2563EB' : '#64748B'}
            />
            <Text style={mode === 'eraser' ? styles.modeTextActive : styles.modeText}>Eraser</Text>
          </TouchableOpacity>
        </View>

        {/* Eraser Brush Size Control (Only visible in Eraser mode) */}
        {mode === 'eraser' && (
          <View style={styles.subControlCard}>
            <Text style={styles.subControlLabel}>Eraser Size:</Text>
            <View style={styles.sizeButtonGroup}>
              {[
                { label: 'Small (20px)', size: 20 },
                { label: 'Med (35px)', size: 35 },
                { label: 'Large (50px)', size: 50 },
              ].map((b) => (
                <TouchableOpacity
                  key={b.size}
                  style={[styles.sizeBtn, eraserSize === b.size && styles.sizeBtnActive]}
                  onPress={() => setEraserSize(b.size)}
                >
                  <Text style={eraserSize === b.size ? styles.sizeTextActive : styles.sizeText}>
                    {b.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Bleed Sensitivity Selector (Only visible in Paint mode) */}
        {mode === 'paint' && (
          <View style={styles.subControlCard}>
            <Text style={styles.subControlLabel}>Bleed Sensitivity:</Text>
            <View style={styles.sizeButtonGroup}>
              {[
                { label: 'Tight', val: 25 },
                { label: 'Balanced', val: 36 },
                { label: 'Wide', val: 50 },
              ].map((t) => (
                <TouchableOpacity
                  key={t.val}
                  style={[styles.sizeBtn, tolerance === t.val && styles.sizeBtnActive]}
                  onPress={() => setTolerance(t.val)}
                >
                  <Text style={tolerance === t.val ? styles.sizeTextActive : styles.sizeText}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 1. "Colors in Use" Row (Visible ONLY when colors are applied) */}
        {colorsInUse.length > 0 && (
          <View style={styles.colorsInUseSection}>
            <View style={styles.paletteHeaderRow}>
              <Text style={styles.paletteLabelInUse}>Colors Currently on Walls</Text>
              <Text style={styles.wallCountBadge}>{wallsPaintedCount}/3 Free Walls</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
              {colorsInUse.map((hex) => (
                <TouchableOpacity
                  key={hex}
                  onPress={() => {
                    setSelectedColor(hex);
                    setMode('paint');
                  }}
                  style={[
                    styles.inUseColorChip,
                    selectedColor.toLowerCase() === hex.toLowerCase() && styles.inUseChipActive,
                  ]}
                >
                  <View style={[styles.colorCircle, { backgroundColor: hex }]} />
                  <Text style={styles.inUseChipText}>{hex.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 2. Designer Preset Colors */}
        <View style={styles.paletteHeaderRow}>
          <Text style={styles.paletteLabel}>Designer Paint Colors</Text>
          <View style={styles.selectedPill}>
            <View style={[styles.selectedPillDot, { backgroundColor: selectedColor }]} />
            <Text style={styles.selectedPillText}>{selectedColor.toUpperCase()}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}
        >
          {DEFAULT_COLORS.map((item) => {
            const isSelected = selectedColor.toLowerCase() === item.hex.toLowerCase();
            return (
              <TouchableOpacity
                key={item.hex}
                disabled={!hasImage}
                onPress={() => {
                  setSelectedColor(item.hex);
                  setMode('paint');
                }}
                activeOpacity={0.8}
                style={[
                  styles.colorChip,
                  isSelected && styles.colorChipSelected,
                  !hasImage && styles.disabled,
                ]}
              >
                <View style={[styles.colorCircle, { backgroundColor: item.hex }]} />
                <Text style={styles.colorChipLabel} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 3. Eyedropper Sampled Custom Colors */}
        <View style={styles.paletteHeaderRow}>
          <Text style={styles.paletteLabel}>Sampled Colors ({customColors.length}/3)</Text>
          {customColors.length >= 3 && <Text style={styles.proLimitBadge}>PRO LIMIT REACHED</Text>}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.colorRow}
        >
          {customColors.length === 0 ? (
            <View style={styles.emptyCustomCard}>
              <Ionicons name="eyedrop-outline" size={18} color="#94A3B8" />
              <Text style={styles.emptyColorsText}>
                Use the Eyedrop tool to sample colors from rugs, chairs, or curtains.
              </Text>
            </View>
          ) : (
            customColors.map((hex) => {
              const isSelected = selectedColor.toLowerCase() === hex.toLowerCase();
              return (
                <View key={hex} style={styles.customSwatchWrapper}>
                  <TouchableOpacity
                    disabled={!hasImage}
                    onPress={() => {
                      setSelectedColor(hex);
                      setMode('paint');
                    }}
                    style={[
                      styles.colorCircleLarge,
                      { backgroundColor: hex },
                      isSelected && styles.colorCircleSelected,
                    ]}
                  />
                  <TouchableOpacity
                    onPress={() => removeCustomColor(hex)}
                    style={styles.removeBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={12} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  canvasContainer: {
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#1E293B',
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 6 },
  emptySubtitle: { color: '#94A3B8', fontSize: 14, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  emptyGoHomeBtn: {
    marginTop: 20,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  emptyGoHomeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pin: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  pinCenterDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#000000' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  // Top Canvas Action Bar
  topCanvasBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionPillGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 20,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  toolIconBtn: {
    padding: 6,
  },
  btnDisabled: {
    opacity: 0.35,
  },
  pillDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  aiObjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  aiObjectText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },

  // Bottom Controls
  controls: {
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
  },
  statusToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  statusToastText: { fontSize: 12, fontWeight: '600', color: '#1E40AF', flex: 1 },

  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  modeActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modeText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  modeTextActive: { color: '#2563EB', fontWeight: '700', fontSize: 13 },

  // Sub-controls (Brush Size & Sensitivity)
  subControlCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subControlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  sizeButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  sizeBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  sizeText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  sizeTextActive: {
    fontSize: 11,
    color: '#2563EB',
    fontWeight: '700',
  },

  // Colors in Use Section
  colorsInUseSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#DBEAFE',
  },
  paletteLabelInUse: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  wallCountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  inUseColorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginRight: 8,
  },
  inUseChipActive: {
    borderColor: '#2563EB',
    borderWidth: 2,
  },
  inUseChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },

  // Standard Palettes
  paletteHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paletteLabel: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  selectedPillDot: { width: 10, height: 10, borderRadius: 5 },
  selectedPillText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  proLimitBadge: { fontSize: 10, fontWeight: '800', color: '#B45309' },
  colorRow: { gap: 10, paddingBottom: 16 },
  colorChip: {
    alignItems: 'center',
    padding: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    width: 68,
  },
  colorChipSelected: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  colorCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  colorChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  emptyCustomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    maxWidth: screenWidth - 40,
  },
  emptyColorsText: { color: '#64748B', fontSize: 12, lineHeight: 16, flex: 1 },
  customSwatchWrapper: { alignItems: 'center', marginRight: 6 },
  colorCircleLarge: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: '#E2E8F0' },
  colorCircleSelected: { borderColor: '#2563EB', borderWidth: 3 },
  removeBtn: {
    marginTop: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
});