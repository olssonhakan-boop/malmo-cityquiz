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
import TourPicker from './src/components/TourPicker'
import useLanguagePreference from './src/hooks/useLanguagePreference'
import useQuizProgress from './src/hooks/useQuizProgress'
import useUserLocation from './src/hooks/useUserLocation'
import {
  CITY_CENTER,
  filterLocationsByTour,
  getCitywideLocations,
  quizLocations,
  tourDefinitions,
} from './src/utils/quizData'
import { buildLeafletHtml } from './src/utils/mapHtml'
import {
  buildLocationStatuses,
  buildMapMarkers,
  getNearestNextLocation,
  getOverallProgress,
  getSolvedQuestionCount,
  getTourProgressItems,
} from './src/utils/quizSelectors'
import { formatDistance, translate } from './src/i18n'
import { QuizLocation } from './src/types'

const APP_TITLE = 'Malm\u00f6 CityQuiz'

type SelectedLocationState = {
  location: QuizLocation
  distanceMeters: number | null
  isUnlocked: boolean
  canForceOpen: boolean
}

export default function App() {
  const webViewRef = useRef<WebView>(null)
  const autoOpenedRef = useRef<Set<string>>(new Set())
  const [isMapReady, setIsMapReady] = useState(false)
  const [selectedTourId, setSelectedTourId] = useState('all')
  const [selectedLocation, setSelectedLocation] =
    useState<SelectedLocationState | null>(null)
  const { language, setLanguage, hydrated: languageReady } =
    useLanguagePreference()
  const {
    completedQuestionIds,
    markQuestionCompleted,
    hydrated: progressReady,
  } = useQuizProgress()
  const {
    errorMessage,
    permissionGranted,
    permissionResolved,
    userLocation,
  } = useUserLocation()

  const visibleLocations = useMemo(
    () => filterLocationsByTour(selectedTourId),
    [selectedTourId]
  )

  const locationStatuses = useMemo(
    () =>
      buildLocationStatuses(
        visibleLocations,
        completedQuestionIds,
        userLocation
      ),
    [completedQuestionIds, userLocation, visibleLocations]
  )

  const mapMarkers = useMemo(
    () => buildMapMarkers(locationStatuses, language),
    [language, locationStatuses]
  )

  const mapHtml = useMemo(
    () => buildLeafletHtml(mapMarkers, CITY_CENTER),
    [mapMarkers]
  )

  const citywideLocations = useMemo(
    () => getCitywideLocations(visibleLocations),
    [visibleLocations]
  )

  const overallProgress = useMemo(
    () => getOverallProgress(quizLocations, completedQuestionIds),
    [completedQuestionIds]
  )

  const selectedTourProgress = useMemo(
    () => getOverallProgress(visibleLocations, completedQuestionIds),
    [completedQuestionIds, visibleLocations]
  )

  const tourProgressItems = useMemo(
    () =>
      getTourProgressItems(
        tourDefinitions,
        quizLocations,
        completedQuestionIds,
        language
      ),
    [completedQuestionIds, language]
  )

  const nearestNextPlace = useMemo(
    () => getNearestNextLocation(locationStatuses),
    [locationStatuses]
  )

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

    const autoOpenCandidate = locationStatuses.find(
      (status) =>
        status.unlocked &&
        !status.locationCompleted &&
        !status.citywide &&
        !autoOpenedRef.current.has(status.location.id)
    )

    if (!autoOpenCandidate) {
      return
    }

    autoOpenedRef.current.add(autoOpenCandidate.location.id)
    setSelectedLocation({
      location: autoOpenCandidate.location,
      distanceMeters: autoOpenCandidate.distanceMeters,
      isUnlocked: true,
      canForceOpen: false,
    })
  }, [locationStatuses, permissionGranted])

  const openLocation = (locationId: string) => {
    const nextStatus = locationStatuses.find(
      (status) => status.location.id === locationId
    )

    if (!nextStatus) {
      return
    }

    if (
      nextStatus.unlocked ||
      nextStatus.locationCompleted ||
      nextStatus.citywide
    ) {
      setSelectedLocation({
        location: nextStatus.location,
        distanceMeters: nextStatus.distanceMeters,
        isUnlocked: true,
        canForceOpen: false,
      })
      return
    }

    if (nextStatus.canForceOpen) {
      setSelectedLocation({
        location: nextStatus.location,
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
        openLocation(payload.id)
      }
    } catch {
      // Ignore malformed messages from the embedded map.
    }
  }

  const centerMapOnUser = () => {
    if (!userLocation) {
      return
    }

    webViewRef.current?.injectJavaScript(
      `window.centerOnUser(${JSON.stringify(userLocation)}); true;`
    )
  }

  const centerMapOnCity = () => {
    webViewRef.current?.injectJavaScript('window.centerOnCity(); true;')
  }

  const renderLocationState = () => {
    if (!permissionResolved) {
      return translate('requestingLocation', language)
    }

    if (!permissionGranted) {
      return errorMessage || translate('locationDenied', language)
    }

    if (!nearestNextPlace || nearestNextPlace.distanceMeters === null) {
      return translate('locatingUser', language)
    }

    return `${translate('nearestQuiz', language)} ${formatDistance(
      nearestNextPlace.distanceMeters,
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
        javaScriptEnabled
        domStorageEnabled
        setSupportMultipleWindows={false}
        style={styles.map}
      />

      <View style={styles.topOverlay}>
        <View style={styles.headerCard}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.appTitle}>{APP_TITLE}</Text>
              <Text style={styles.subtitle}>
                {translate('subtitle', language)}
              </Text>
            </View>
            <View style={styles.progressBadge}>
              <Text style={styles.progressValue}>
                {overallProgress.solvedPlaces}/{overallProgress.totalPlaces}
              </Text>
              <Text style={styles.progressLabel}>
                {translate('progressPlaces', language)}
              </Text>
            </View>
          </View>

          <Text style={styles.locationText}>{renderLocationState()}</Text>
          {nearestNextPlace ? (
            <Text style={styles.helperText}>
              {translate('nextStop', language)}{' '}
              {nearestNextPlace.location.title[language]} {'\u00b7'}{' '}
              {nearestNextPlace.solvedQuestionCount}/
              {nearestNextPlace.totalQuestionCount}
            </Text>
          ) : null}

          <Text style={styles.helperText}>
            {translate('routeProgress', language)}{' '}
            {selectedTourProgress.solvedQuestions}/
            {selectedTourProgress.totalQuestions} {'\u00b7'}{' '}
            {translate('progressQuestions', language)}
          </Text>

          <View style={styles.mapActionRow}>
            <Pressable
              style={styles.mapActionButton}
              onPress={centerMapOnCity}
            >
              <Text style={styles.mapActionButtonText}>
                {translate('centerCity', language)}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.mapActionButton,
                !userLocation && styles.mapActionButtonDisabled,
              ]}
              onPress={centerMapOnUser}
              disabled={!userLocation}
            >
              <Text style={styles.mapActionButtonText}>
                {translate('centerMe', language)}
              </Text>
            </Pressable>
          </View>
        </View>

        <LanguageSelector language={language} onChange={setLanguage} />

        <TourPicker
          language={language}
          selectedTourId={selectedTourId}
          tours={tourProgressItems}
          onChange={setSelectedTourId}
        />

        {citywideLocations.length > 0 ? (
          <View style={styles.citywideCard}>
            <Text style={styles.citywideTitle}>
              {translate('citywideSection', language)}
            </Text>
            <View style={styles.citywideWrap}>
              {citywideLocations.map((location) => {
                const solvedQuestions = getSolvedQuestionCount(
                  location,
                  completedQuestionIds
                )
                const locationCompleted =
                  solvedQuestions === location.questions.length

                return (
                  <Pressable
                    key={location.id}
                    style={[
                      styles.citywideChip,
                      locationCompleted && styles.citywideChipCompleted,
                    ]}
                    onPress={() =>
                      setSelectedLocation({
                        location,
                        distanceMeters: null,
                        isUnlocked: true,
                        canForceOpen: false,
                      })
                    }
                  >
                    <Text style={styles.citywideChipIcon}>CQ</Text>
                    <View style={styles.citywideCopy}>
                      <Text style={styles.citywideChipTitle}>
                        {location.title[language]}
                      </Text>
                      <Text style={styles.citywideChipMeta}>
                        {solvedQuestions}/{location.questions.length} {'\u00b7'}{' '}
                        {locationCompleted
                          ? translate('completed', language)
                          : translate('openAnywhere', language)}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : null}
      </View>

      <View style={styles.bottomOverlay}>
        <MapLegend language={language} />
        {!hydrated ? (
          <Text style={styles.helperText}>
            {translate('loadingState', language)}
          </Text>
        ) : null}
        {!permissionGranted && permissionResolved ? (
          <Text style={styles.warningText}>
            {errorMessage || translate('locationDenied', language)}
          </Text>
        ) : null}
      </View>

      <QuizModal
        visible={Boolean(selectedLocation)}
        language={language}
        location={selectedLocation?.location ?? null}
        completedQuestionIds={completedQuestionIds}
        distanceMeters={selectedLocation?.distanceMeters ?? null}
        isUnlocked={Boolean(selectedLocation?.isUnlocked)}
        canForceOpen={Boolean(selectedLocation?.canForceOpen)}
        onRequestClose={() => setSelectedLocation(null)}
        onForceOpen={() =>
          setSelectedLocation((current) =>
            current
              ? {
                  ...current,
                  isUnlocked: true,
                  canForceOpen: false,
                }
              : current
          )
        }
        onCompleteQuestion={markQuestionCompleted}
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
    minWidth: 96,
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
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
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
  mapActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  mapActionButton: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#12364C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapActionButtonDisabled: {
    opacity: 0.45,
  },
  mapActionButtonText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
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
    minWidth: 34,
    minHeight: 34,
    borderRadius: 17,
    backgroundColor: '#254E68',
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 34,
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
