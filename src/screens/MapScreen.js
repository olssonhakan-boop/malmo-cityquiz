import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  PermissionsAndroid,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import MapView from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getDistance, UNLOCK_RADIUS, NEARBY_RADIUS} from '../utils/geo';
import {t} from '../utils/i18n';
import {useLocations, isLocationComplete, makeProgressId} from '../hooks/useLocations';
import QuizModal from '../components/QuizModal';
import FreeQuestionsPanel from '../components/FreeQuestionsPanel';
import LanguagePicker from '../components/LanguagePicker';
import QuizMarker from '../components/QuizMarker';
import ClusterMarker from '../components/ClusterMarker';

const MALMO_CENTER = {latitude: 55.605, longitude: 13.0038};
const PROGRESS_KEY = 'malmo_progress';
const SCORE_KEY = 'malmo_score';
const BASE_POINTS = 10;
const GPS_MULTIPLIER = 3;

// Zoom-nivåer: latitudeDelta → markörsstorlek (0 = dölj)
function getMarkerSize(latitudeDelta) {
  if (latitudeDelta > 0.25) return 0;
  if (latitudeDelta > 0.10) return 18;
  if (latitudeDelta > 0.04) return 26;
  if (latitudeDelta > 0.015) return 34;
  return 42;
}

// Klustringslogik: slår ihop markörer som är nära varandra vid given zoom
function clusterLocations(locations, latitudeDelta) {
  const mergeDistance = latitudeDelta * 0.12;
  const used = new Set();
  const clusters = [];

  for (let i = 0; i < locations.length; i++) {
    if (used.has(i)) continue;
    const group = [locations[i]];
    used.add(i);
    for (let j = i + 1; j < locations.length; j++) {
      if (used.has(j)) continue;
      const dLat = Math.abs(locations[i].latitude - locations[j].latitude);
      const dLng = Math.abs(locations[i].longitude - locations[j].longitude);
      if (dLat < mergeDistance && dLng < mergeDistance) {
        group.push(locations[j]);
        used.add(j);
      }
    }
    const lat = group.reduce((s, l) => s + l.latitude, 0) / group.length;
    const lng = group.reduce((s, l) => s + l.longitude, 0) / group.length;
    clusters.push({locations: group, latitude: lat, longitude: lng});
  }
  return clusters;
}

// Döljer Googles POI-lager men behåller vägar, stadsdelar och landmärken
const CUSTOM_MAP_STYLE = [
  {featureType: 'poi', elementType: 'labels', stylers: [{visibility: 'off'}]},
  {featureType: 'poi', elementType: 'geometry', stylers: [{visibility: 'off'}]},
  {featureType: 'transit', elementType: 'labels.icon', stylers: [{visibility: 'off'}]},
];

export default function MapScreen({lang, onLangChange, selectedCategories, onGoHome, onGoInfo}) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [score, setScore] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isOnLocation, setIsOnLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [latitudeDelta, setLatitudeDelta] = useState(0.04);
  const mapRef = useRef(null);

  const {locations, loading, error, reload} = useLocations();

  const filteredLocations =
    selectedCategories.length === 0
      ? locations
      : locations.filter(loc => selectedCategories.includes(loc.category));

  const gpsLocations = filteredLocations.filter(
    loc => loc.latitude !== null && loc.longitude !== null,
  );
  const freeLocations = filteredLocations.filter(
    loc => loc.latitude === null || loc.longitude === null,
  );

  useEffect(() => {
    async function loadStored() {
      const [progressVal, scoreVal] = await Promise.all([
        AsyncStorage.getItem(PROGRESS_KEY),
        AsyncStorage.getItem(SCORE_KEY),
      ]);
      if (progressVal) setCompletedIds(new Set(JSON.parse(progressVal)));
      if (scoreVal) setScore(parseInt(scoreVal, 10));
    }
    loadStored();
  }, []);

  const saveProgress = useCallback(newSet => {
    AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify([...newSet]));
  }, []);

  useEffect(() => {
    let watchId = null;

    const startLocation = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'GPS-behörighet',
            message:
              'Appen använder din plats för att låsa upp quiz-frågor när du är nära platsen.',
            buttonNegative: 'Avbryt',
            buttonPositive: 'OK',
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          setLocationGranted(false);
          return;
        }
        setLocationGranted(true);
        watchId = Geolocation.watchPosition(
          pos => setUserLocation(pos.coords),
          err => console.warn('GPS error:', err.message),
          {enableHighAccuracy: false, distanceFilter: 10, timeout: 15000},
        );
      } catch (err) {
        console.warn('Permission error:', err);
        setLocationGranted(false);
      }
    };

    const timer = setTimeout(startLocation, 800);
    return () => {
      clearTimeout(timer);
      if (watchId !== null) Geolocation.clearWatch(watchId);
    };
  }, []);

  function getMarkerStatus(loc) {
    if (isLocationComplete(loc, completedIds)) return 'completed';
    if (!userLocation) return 'far';
    const dist = getDistance(
      userLocation.latitude,
      userLocation.longitude,
      loc.latitude,
      loc.longitude,
    );
    if (dist <= UNLOCK_RADIUS) return 'bonus';
    if (dist <= NEARBY_RADIUS) return 'nearby';
    return 'far';
  }

  function openLocation(loc, onGps = false) {
    if (isLocationComplete(loc, completedIds)) {
      Alert.alert('', t(lang, 'alreadyAnswered'));
      return;
    }
    setSelectedLocation(loc);
    setIsOnLocation(onGps);
    setModalVisible(true);
  }

  function handleMarkerPress(loc) {
    const status = getMarkerStatus(loc);
    if (status === 'completed') {
      Alert.alert('', t(lang, 'alreadyAnswered'));
      return;
    }
    openLocation(loc, status === 'bonus');
  }

  function handleCompleteQuestion(progressId) {
    const newSet = new Set(completedIds);
    newSet.add(progressId);
    setCompletedIds(newSet);
    saveProgress(newSet);

    const earned = isOnLocation ? BASE_POINTS * GPS_MULTIPLIER : BASE_POINTS;
    const newScore = score + earned;
    setScore(newScore);
    AsyncStorage.setItem(SCORE_KEY, String(newScore));
  }

  const totalQuestions = filteredLocations.reduce(
    (sum, loc) => sum + loc.questions.length,
    0,
  );
  const completedLocations = filteredLocations.filter(loc =>
    isLocationComplete(loc, completedIds),
  ).length;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>{t(lang, 'loading')}</Text>
      </View>
    );
  }

  if (error && locations.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t(lang, 'errorFetch')}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reload}>
          <Text style={styles.retryText}>{t(lang, 'retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider="google"
        initialRegion={{
          ...MALMO_CENTER,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={region => setLatitudeDelta(region.latitudeDelta)}>
        {(() => {
          const markerSize = getMarkerSize(latitudeDelta);
          if (markerSize === 0) return null;
          const clusters = clusterLocations(gpsLocations, latitudeDelta);
          return clusters.map((cluster, idx) => {
            if (cluster.locations.length > 1) {
              return (
                <ClusterMarker
                  key={`cluster-${idx}`}
                  coordinate={{latitude: cluster.latitude, longitude: cluster.longitude}}
                  count={cluster.locations.length}
                  size={markerSize}
                  onPress={() => {}}
                />
              );
            }
            const loc = cluster.locations[0];
            return (
              <QuizMarker
                key={loc.id}
                coordinate={{latitude: loc.latitude, longitude: loc.longitude}}
                category={loc.category}
                status={getMarkerStatus(loc)}
                size={markerSize}
                onPress={() => handleMarkerPress(loc)}
              />
            );
          });
        })()}
      </MapView>

      {/* Top bar — runda 3D-knappar uppe till vänster */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={onGoHome} activeOpacity={0.8}>
          <View style={styles.iconBtnHighlight} />
          <Text style={styles.iconBtnIcon}>{String.fromCodePoint(0xe88a)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onGoInfo} activeOpacity={0.8}>
          <View style={styles.iconBtnHighlight} />
          <Text style={styles.iconBtnIcon}>{String.fromCodePoint(0xe88e)}</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom bar med statistik */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomStat}>
          <Text style={styles.bottomNum}>{score}</Text>
          <Text style={styles.bottomLabel}>Poäng</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStat}>
          <Text style={styles.bottomNum}>{completedLocations}</Text>
          <Text style={styles.bottomLabel}>Avklarade</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStat}>
          <Text style={styles.bottomNum}>{filteredLocations.length - completedLocations}</Text>
          <Text style={styles.bottomLabel}>Kvar</Text>
        </View>
      </View>

      <QuizModal
        visible={modalVisible}
        location={selectedLocation}
        lang={lang}
        completedIds={completedIds}
        isOnLocation={isOnLocation}
        onClose={() => {
          setModalVisible(false);
          setSelectedLocation(null);
        }}
        onCompleteQuestion={handleCompleteQuestion}
      />
    </SafeAreaView>
  );
}

const CARD_BG = 'rgba(44,30,15,0.88)';
const GOLD    = '#C8A840';

const styles = StyleSheet.create({
  container: {flex: 1},
  map: {flex: 1},
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  loadingText: {marginTop: 12, fontSize: 16, color: '#2C1E0F'},
  errorText: {fontSize: 16, color: '#e74c3c', textAlign: 'center', marginBottom: 16},
  retryBtn: {
    backgroundColor: CARD_BG,
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {color: '#fff', fontWeight: '700'},

  topBar: {
    position: 'absolute',
    top: 48,
    left: 12,
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    overflow: 'hidden',
    // 3D-rim: ljus kant topp, mörk kant botten
    borderWidth: 2,
    borderTopColor: '#F0D870',
    borderLeftColor: '#E8C850',
    borderRightColor: '#9A7A10',
    borderBottomColor: '#7A5A00',
  },
  iconBtnHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 26,
  },
  iconBtnIcon: {
    fontFamily: 'MaterialSymbolsOutlined',
    fontSize: 24,
    color: '#2C1E0F',
  },

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: CARD_BG,
    flexDirection: 'row',
    paddingVertical: 14,
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 12,
  },
  bottomStat: {flex: 1, alignItems: 'center'},
  bottomNum: {fontSize: 36, fontWeight: '900', color: GOLD, letterSpacing: -0.5},
  bottomLabel: {fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontWeight: '500'},
  bottomDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },
});
