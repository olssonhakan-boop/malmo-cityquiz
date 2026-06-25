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
import MapView, {Marker} from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {getDistance, UNLOCK_RADIUS, NEARBY_RADIUS} from '../utils/geo';
import {t} from '../utils/i18n';
import {useQuestions} from '../hooks/useQuestions';
import QuizModal from '../components/QuizModal';
import FreeQuestionsPanel from '../components/FreeQuestionsPanel';
import LanguagePicker from '../components/LanguagePicker';
import QuizMarker from '../components/QuizMarker';

const MALMO_CENTER = {latitude: 55.605, longitude: 13.0038};
const COMPLETED_KEY = 'malmo_completed';
const SCORE_KEY = 'malmo_score';
const BASE_POINTS = 10;
const GPS_MULTIPLIER = 3;

export default function MapScreen({lang, onLangChange, selectedCategories, onGoHome}) {
  const [userLocation, setUserLocation] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);
  const [completed, setCompleted] = useState(new Set());
  const [score, setScore] = useState(0);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [isOnLocation, setIsOnLocation] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef(null);

  const {questions, loading, error, reload} = useQuestions();

  const filteredQuestions =
    selectedCategories.length === 0
      ? questions
      : questions.filter(q => selectedCategories.includes(q.category));

  const gpsQuestions = filteredQuestions.filter(q => q.latitude !== null && q.longitude !== null);
  const freeQuestions = filteredQuestions.filter(q => q.latitude === null || q.longitude === null);

  useEffect(() => {
    async function loadStored() {
      const [completedVal, scoreVal] = await Promise.all([
        AsyncStorage.getItem(COMPLETED_KEY),
        AsyncStorage.getItem(SCORE_KEY),
      ]);
      if (completedVal) setCompleted(new Set(JSON.parse(completedVal)));
      if (scoreVal) setScore(parseInt(scoreVal, 10));
    }
    loadStored();
  }, []);

  const saveCompleted = useCallback(newSet => {
    AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify([...newSet]));
  }, []);

  useEffect(() => {
    let watchId = null;

    const startLocation = async () => {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'GPS-behörighet',
            message: 'Appen använder din plats för att låsa upp quiz-frågor när du är nära platsen.',
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

  function getMarkerStatus(q) {
    if (completed.has(q.id)) return 'completed';
    if (!userLocation) return 'far';
    const dist = getDistance(userLocation.latitude, userLocation.longitude, q.latitude, q.longitude);
    if (dist <= UNLOCK_RADIUS) return 'bonus';
    if (dist <= NEARBY_RADIUS) return 'nearby';
    return 'far';
  }

  function openQuestion(q, onLocation = false) {
    if (completed.has(q.id)) {
      Alert.alert('', t(lang, 'alreadyAnswered'));
      return;
    }
    setSelectedQuestion(q);
    setIsOnLocation(onLocation);
    setModalVisible(true);
  }

  function handleMarkerPress(q) {
    const status = getMarkerStatus(q);
    if (status === 'completed') {
      Alert.alert('', t(lang, 'alreadyAnswered'));
      return;
    }
    openQuestion(q, status === 'bonus');
  }

  function handleCorrect(questionId) {
    const newSet = new Set(completed);
    newSet.add(questionId);
    setCompleted(newSet);
    saveCompleted(newSet);

    const earned = isOnLocation ? BASE_POINTS * GPS_MULTIPLIER : BASE_POINTS;
    const newScore = score + earned;
    setScore(newScore);
    AsyncStorage.setItem(SCORE_KEY, String(newScore));

    setModalVisible(false);
    setSelectedQuestion(null);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#003366" />
        <Text style={styles.loadingText}>{t(lang, 'loading')}</Text>
      </View>
    );
  }

  if (error && questions.length === 0) {
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
        initialRegion={{...MALMO_CENTER, latitudeDelta: 0.04, longitudeDelta: 0.04}}
        showsUserLocation={locationGranted}
        showsMyLocationButton={true}>
        {gpsQuestions.map(q => (
          <QuizMarker
            key={q.id}
            coordinate={{latitude: q.latitude, longitude: q.longitude}}
            category={q.category}
            status={getMarkerStatus(q)}
            onPress={() => handleMarkerPress(q)}
          />
        ))}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.homeBtn} onPress={onGoHome}>
          <Text style={styles.homeBtnText}>◀ {t(lang, 'backToHome')}</Text>
        </TouchableOpacity>
        <View style={styles.scoreBar}>
          <Text style={styles.scoreText}>{score} p · {completed.size}/{filteredQuestions.length}</Text>
        </View>
        <LanguagePicker lang={lang} onSelect={onLangChange} />
      </View>

      {/* Bottom stats bar */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatNumber}>{score}</Text>
          <Text style={styles.bottomStatLabel}>{t(lang, 'yourScore')}</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatNumber}>{completed.size}</Text>
          <Text style={styles.bottomStatLabel}>{t(lang, 'completed')}</Text>
        </View>
        <View style={styles.bottomDivider} />
        <View style={styles.bottomStat}>
          <Text style={styles.bottomStatNumber}>{filteredQuestions.length - completed.size}</Text>
          <Text style={styles.bottomStatLabel}>{t(lang, 'remaining')}</Text>
        </View>
      </View>

      {freeQuestions.length > 0 && (
        <FreeQuestionsPanel
          questions={freeQuestions}
          lang={lang}
          completed={completed}
          onSelect={q => openQuestion(q, false)}
        />
      )}

      <QuizModal
        visible={modalVisible}
        question={selectedQuestion}
        lang={lang}
        isOnLocation={isOnLocation}
        onClose={() => {
          setModalVisible(false);
          setSelectedQuestion(null);
        }}
        onCorrect={handleCorrect}
      />
    </SafeAreaView>
  );
}

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
  loadingText: {marginTop: 12, fontSize: 16, color: '#003366'},
  errorText: {fontSize: 16, color: '#e74c3c', textAlign: 'center', marginBottom: 16},
  retryBtn: {
    backgroundColor: '#003366',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryText: {color: '#fff', fontWeight: '700'},
  topBar: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeBtn: {
    backgroundColor: '#003366',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  homeBtnText: {color: '#fff', fontSize: 13, fontWeight: '700'},
  scoreBar: {
    flex: 1,
    backgroundColor: '#003366',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  scoreText: {color: '#fff', fontWeight: '700', fontSize: 13},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#003366',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bottomStat: {flex: 1, alignItems: 'center'},
  bottomStatNumber: {fontSize: 22, fontWeight: '800', color: '#fff'},
  bottomStatLabel: {fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2},
  bottomDivider: {width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 4},
});
