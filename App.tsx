import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { WebView, WebViewMessageEvent } from 'react-native-webview'
import LanguageSelector from './src/components/LanguageSelector'
import MapLegend from './src/components/MapLegend'
import QuizModal from './src/components/QuizModal'
import useLanguagePreference from './src/hooks/useLanguagePreference'
import useQuizProgress from './src/hooks/useQuizProgress'
import useUserLocation from './src/hooks/useUserLocation'
import {
  CITY_CENTER,
  getCitywideQuizzes,
  getMapQuizEntries,
  quizEntries,
} from './src/utils/quizData'
import { buildLeafletHtml } from './src/utils/mapHtml'
import { getDistanceMeters } from './src/utils/haversine'
import { formatDistance, translate } from './src/i18n'
import { QuizEntry } from './src/types'

type SelectedQuizState = {
  quiz: QuizEntry
  distanceMeters: number | null
  isUnlocked: boolean
  canForceOpen: boolean
}

type MarkerStatus = 'locked' | 'nearby' | 'unlocked' | 'completed'

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const autoOpenedRef = useRef<Set<string>>(new Set())
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedQuiz, setSelectedQuiz] = useState<SelectedQuizState | null>(null)
  const { language, setLanguage, hydrated: languageReady } = useLanguagePreference()
  const { completedIds, markCompleted, hydrated: progressReady } = useQuizProgress()
  const {
    errorMessage,
    permissionGranted,
    permissionResolved,
    userLocation,
  } = useUserLocation()

  const mapHtml = useMemo(
    () => buildLeafletHtml(getMapQuizEntries(), CITY_CENTER, language),
    [language]
  )

  const quizStatuses = useMemo(() => {
    return quizEntries.map((quiz) => {
      // GPS-based questions unlock at 30 m, while 100 m allows a manual override.
      const completed = completedIds.includes(quiz.id)
      const hasCoordinates =
        typeof quiz.latitude === 'number' && typeof quiz.longitude === 'number'
      const distanceMeters =
        hasCoordinates && userLocation
          ? getDistanceMeters(
              userLocation.latitude,
              userLocation.longitude,
              quiz.latitude as number,
              quiz.longitude as number
            )
          : null

      const citywide = !hasCoordinates
      const unlocked = citywide || completed || (distanceMeters !== null && distanceMeters <= 30)
      const canForceOpen =
        !citywide &&
        !completed &&
        distanceMeters !== null &&
        distanceMeters > 30 &&
        distanceMeters <= 100

      return {
        quiz,
        completed,
        citywide,
        distanceMeters,
        unlocked,
        canForceOpen,
        markerStatus: completed
          ? ('completed' as MarkerStatus)
          : unlocked
            ? ('unlocked' as MarkerStatus)
            : canForceOpen
              ? ('nearby' as MarkerStatus)
              : ('locked' as MarkerStatus),
      }
    })
  }, [completedIds, userLocation])

  const mapMarkers = useMemo(() => {
    return quizStatuses
      .filter((status) => !status.citywide)
      .map((status, index) => ({
        id: status.quiz.id,
        title: status.quiz.title[language],
        latitude: status.quiz.latitude as number,
        longitude: status.quiz.longitude as number,
        label: String(index + 1),
        status: status.markerStatus,
      }))
  }, [language, quizStatuses])

  const citywideQuizzes = useMemo(
    () => getCitywideQuizzes().map((quiz) => quizStatuses.find((status) => status.quiz.id === quiz.id)!),
    [quizStatuses]
  )

  const completedCount = completedIds.length
  const totalCount = quizEntries.length
  const nearestDistance = useMemo(() => {
    const distances = quizStatuses
      .filter((status) => !status.citywide && typeof status.distanceMeters === 'number')
      .map((status) => status.distanceMeters as number)

    if (distances.length === 0) {
      return null
    }

    return Math.min(...distances)
  }, [quizStatuses])

  const nearestUnlockedTitle = useMemo(() => {
    const candidate = quizStatuses.find(
      (status) => status.unlocked && !status.completed && !status.citywide
    )
    return candidate?.quiz.title[language] ?? null
  }, [language, quizStatuses])

  useEffect(() => {
    if (!isMapReady) {
      return
    }

    const payload = JSON.stringify({
      markers: mapMarkers,
      userLocation,
      language,
    })

    webViewRef.current?.injectJavaScript(
      `window.updateMapState(${payload}); true;`
    )
  }, [isMapReady, language, mapMarkers, userLocation])

  useEffect(() => {
    if (!permissionGranted) {
      return
    }

    const autoOpenCandidate = quizStatuses.find(
      (status) =>
        status.unlocked &&
        !status.completed &&
        !status.citywide &&
        !autoOpenedRef.current.has(status.quiz.id)
    )

    if (!autoOpenCandidate) {
      return
    }

    autoOpenedRef.current.add(autoOpenCandidate.quiz.id)
    setSelectedQuiz({
      quiz: autoOpenCandidate.quiz,
      distanceMeters: autoOpenCandidate.distanceMeters,
      isUnlocked: true,
      canForceOpen: false,
    })
  }, [permissionGranted, quizStatuses])

  const openQuiz = (quizId: string) => {
    const nextStatus = quizStatuses.find((status) => status.quiz.id === quizId)

    if (!nextStatus) {
      return
    }

    if (nextStatus.unlocked || nextStatus.completed || nextStatus.citywide) {
      setSelectedQuiz({
        quiz: nextStatus.quiz,
        distanceMeters: nextStatus.distanceMeters,
        isUnlocked: true,
        canForceOpen: false,
      })
      return
    }

    if (nextStatus.canForceOpen) {
      setSelectedQuiz({
        quiz: nextStatus.quiz,
        distanceMeters: nextStatus.distanceMeters,
        isUnlocked: false,
        canForceOpen: true,
      })
      return
    }

    Alert.alert(
      translate('tooFarTitle', language),
      translate('tooFarMessage', language)
    )
  }

  const handleMapMessage = (event: WebViewMessageEvent) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data)
      if (payload?.type === 'markerPress' && typeof payload.id === 'string') {
        openQuiz(payload.id)
      }
    } catch {
      // Ignore malformed map messages.
    }
  }

  const handleCorrectAnswer = async (quizId: string) => {
    await markCompleted(quizId)
  }

  const openCitywideQuiz = (quiz: QuizEntry) => {
    setSelectedQuiz({
      quiz,
      distanceMeters: null,
      isUnlocked: true,
      canForceOpen: false,
    })
  }

  const renderLocationState = () => {
    if (!permissionResolved) {
      return translate('requestingLocation', language)
    }

    if (!permissionGranted) {
      return errorMessage || translate('locationDenied', language)
    }

    if (nearestDistance === null) {
      return translate('locatingUser', language)
    }

    return `${translate('nearestQuiz', language)} ${formatDistance(
      nearestDistance,
      language
    )}`
  }

  const hydrated = languageReady && progressReady

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: mapHtml }}
        onLoadEnd={() => setIsMapReady(true)}
        onMessage={handleMapMessage}
        style={styles.map}
      />

      <View style={styles.topOverlay}>
        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.appTitle}>Malmö CityQuiz</Text>
              <Text style={styles.subtitle}>{translate('subtitle', language)}</Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressValue}>
                {completedCount}/{totalCount}
              </Text>
              <Text style={styles.progressLabel}>{translate('done', language)}</Text>
            </View>
          </View>

          <Text style={styles.locationText}>{renderLocationState()}</Text>
          {nearestUnlockedTitle ? (
            <Text style={styles.helperText}>
              {translate('readyToSolve', language)} {nearestUnlockedTitle}
            </Text>
          ) : null}
        </View>

        <LanguageSelector language={language} onChange={setLanguage} />

        {citywideQuizzes.length > 0 ? (
          <View style={styles.citywideCard}>
            <Text style={styles.citywideTitle}>
              {translate('citywideSection', language)}
            </Text>
            <View style={styles.citywideWrap}>
              {citywideQuizzes.map((status) => (
                <Pressable
                  key={status.quiz.id}
                  style={[
                    styles.citywideChip,
                    status.completed && styles.citywideChipCompleted,
                  ]}
                  onPress={() => openCitywideQuiz(status.quiz)}
                >
                  <Text style={styles.citywideChipIcon}>🧭</Text>
                  <View style={styles.citywideCopy}>
                    <Text style={styles.citywideChipTitle}>
                      {status.quiz.title[language]}
                    </Text>
                    <Text style={styles.citywideChipMeta}>
                      {status.completed
                        ? translate('completed', language)
                        : translate('openAnywhere', language)}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomOverlay}>
        <MapLegend language={language} />
        {!hydrated ? (
          <Text style={styles.helperText}>{translate('loadingState', language)}</Text>
        ) : null}
        {!permissionGranted && permissionResolved ? (
          <Text style={styles.warningText}>
            {errorMessage || translate('locationDenied', language)}
          </Text>
        ) : null}
      </View>

      <QuizModal
        visible={Boolean(selectedQuiz)}
        language={language}
        quiz={selectedQuiz?.quiz ?? null}
        completed={Boolean(
          selectedQuiz && completedIds.includes(selectedQuiz.quiz.id)
        )}
        distanceMeters={selectedQuiz?.distanceMeters ?? null}
        isUnlocked={Boolean(selectedQuiz?.isUnlocked)}
        canForceOpen={Boolean(selectedQuiz?.canForceOpen)}
        onRequestClose={() => setSelectedQuiz(null)}
        onForceOpen={() =>
          setSelectedQuiz((current) =>
            current
              ? {
                  ...current,
                  isUnlocked: true,
                  canForceOpen: false,
                }
              : current
          )
        }
        onCorrectAnswer={handleCorrectAnswer}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1722',
  },
  map: {
    flex: 1,
  },
  topOverlay: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    gap: 10,
  },
  bottomOverlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    gap: 8,
  },
  headerCard: {
    backgroundColor: 'rgba(7, 18, 27, 0.92)',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  titleBlock: {
    flex: 1,
    gap: 4,
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#B7C6D2',
    fontSize: 14,
    lineHeight: 20,
  },
  progressBadge: {
    minWidth: 76,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#12364C',
    alignItems: 'center',
    gap: 2,
  },
  progressValue: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  progressLabel: {
    color: '#B7C6D2',
    fontSize: 12,
    fontWeight: '700',
  },
  locationText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  helperText: {
    color: '#B7C6D2',
    fontSize: 13,
    lineHeight: 18,
  },
  warningText: {
    color: '#FDE68A',
    fontSize: 13,
    lineHeight: 18,
  },
  citywideCard: {
    backgroundColor: 'rgba(7, 18, 27, 0.92)',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  citywideTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  citywideWrap: {
    gap: 8,
  },
  citywideChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#142E3F',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  citywideChipCompleted: {
    backgroundColor: '#114738',
  },
  citywideChipIcon: {
    fontSize: 20,
  },
  citywideCopy: {
    flex: 1,
    gap: 2,
  },
  citywideChipTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  citywideChipMeta: {
    color: '#B7C6D2',
    fontSize: 12,
  },
})
