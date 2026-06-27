import { translate } from '../i18n'
import { AppLanguage, QuizLocation, TourDefinition, UserCoordinates } from '../types'
import { buildQuestionProgressId } from './quizData'
import { getDistanceMeters } from './haversine'

export const QUIZ_UNLOCK_DISTANCE_METERS = 30
export const QUIZ_FORCE_OPEN_DISTANCE_METERS = 100

export type MarkerStatus = 'locked' | 'nearby' | 'unlocked' | 'completed'

export type LocationStatus = {
  location: QuizLocation
  citywide: boolean
  distanceMeters: number | null
  solvedQuestionCount: number
  totalQuestionCount: number
  locationCompleted: boolean
  unlocked: boolean
  canForceOpen: boolean
  markerStatus: MarkerStatus
}

export type TourProgressItem = {
  id: string
  iconLabel: string
  title: string
  description: string
  solvedQuestions: number
  totalQuestions: number
}

function createCompletedQuestionSet(completedQuestionIds: string[]) {
  return new Set(completedQuestionIds)
}

export function getSolvedQuestionCount(
  location: QuizLocation,
  completedQuestionIds: string[]
) {
  const completedSet = createCompletedQuestionSet(completedQuestionIds)

  return location.questions.filter((question) =>
    completedSet.has(buildQuestionProgressId(location.id, question.id))
  ).length
}

export function isLocationCompleted(
  location: QuizLocation,
  completedQuestionIds: string[]
) {
  return (
    location.questions.length > 0 &&
    getSolvedQuestionCount(location, completedQuestionIds) === location.questions.length
  )
}

export function buildLocationStatuses(
  locations: QuizLocation[],
  completedQuestionIds: string[],
  userLocation: UserCoordinates | null
) {
  const completedSet = createCompletedQuestionSet(completedQuestionIds)

  return locations.map((location) => {
    const solvedQuestionCount = location.questions.filter((question) =>
      completedSet.has(buildQuestionProgressId(location.id, question.id))
    ).length
    const totalQuestionCount = location.questions.length
    const locationCompleted =
      totalQuestionCount > 0 && solvedQuestionCount === totalQuestionCount
    const citywide =
      typeof location.latitude !== 'number' || typeof location.longitude !== 'number'
    const distanceMeters =
      !citywide && userLocation
        ? getDistanceMeters(
            userLocation.latitude,
            userLocation.longitude,
            location.latitude as number,
            location.longitude as number
          )
        : null
    const unlocked =
      citywide ||
      locationCompleted ||
      (distanceMeters !== null && distanceMeters <= QUIZ_UNLOCK_DISTANCE_METERS)
    const canForceOpen =
      !citywide &&
      !locationCompleted &&
      distanceMeters !== null &&
      distanceMeters > QUIZ_UNLOCK_DISTANCE_METERS &&
      distanceMeters <= QUIZ_FORCE_OPEN_DISTANCE_METERS

    return {
      location,
      citywide,
      distanceMeters,
      solvedQuestionCount,
      totalQuestionCount,
      locationCompleted,
      unlocked,
      canForceOpen,
      markerStatus: locationCompleted
        ? 'completed'
        : unlocked
          ? 'unlocked'
          : canForceOpen
            ? 'nearby'
            : 'locked',
    } satisfies LocationStatus
  })
}

export function buildMapMarkers(
  locationStatuses: LocationStatus[],
  language: AppLanguage
) {
  return locationStatuses
    .filter((status) => !status.citywide)
    .map((status, index) => ({
      id: status.location.id,
      title: status.location.title[language],
      latitude: status.location.latitude as number,
      longitude: status.location.longitude as number,
      label: String(index + 1),
      status: status.markerStatus,
    }))
}

export function getOverallProgress(
  locations: QuizLocation[],
  completedQuestionIds: string[]
) {
  const completedSet = createCompletedQuestionSet(completedQuestionIds)

  const totalQuestions = locations.reduce(
    (sum, location) => sum + location.questions.length,
    0
  )
  const solvedQuestions = locations.reduce((sum, location) => {
    return (
      sum +
      location.questions.filter((question) =>
        completedSet.has(buildQuestionProgressId(location.id, question.id))
      ).length
    )
  }, 0)
  const solvedPlaces = locations.filter((location) =>
    location.questions.every((question) =>
      completedSet.has(buildQuestionProgressId(location.id, question.id))
    )
  ).length

  return {
    solvedQuestions,
    totalQuestions,
    solvedPlaces,
    totalPlaces: locations.length,
  }
}

export function getTourProgressItems(
  tours: TourDefinition[],
  allLocations: QuizLocation[],
  completedQuestionIds: string[],
  language: AppLanguage
) {
  const overallProgress = getOverallProgress(allLocations, completedQuestionIds)

  const tourItems = tours.map((tour) => {
    const allowedIds = new Set(tour.locationIds)
    const locationsForTour = allLocations.filter((location) =>
      allowedIds.has(location.id)
    )
    const progress = getOverallProgress(locationsForTour, completedQuestionIds)

    return {
      id: tour.id,
      iconLabel: tour.iconLabel,
      title: tour.title[language],
      description: tour.description[language],
      solvedQuestions: progress.solvedQuestions,
      totalQuestions: progress.totalQuestions,
    } satisfies TourProgressItem
  })

  return [
    {
      id: 'all',
      iconLabel: 'ALL',
      title: translate('allTours', language),
      description: translate('allToursDescription', language),
      solvedQuestions: overallProgress.solvedQuestions,
      totalQuestions: overallProgress.totalQuestions,
    },
    ...tourItems,
  ] satisfies TourProgressItem[]
}

export function getNearestNextLocation(locationStatuses: LocationStatus[]) {
  const candidates = locationStatuses
    .filter(
      (status) =>
        !status.citywide &&
        !status.locationCompleted &&
        typeof status.distanceMeters === 'number'
    )
    .sort(
      (left, right) =>
        (left.distanceMeters as number) - (right.distanceMeters as number)
    )

  return candidates[0] ?? null
}
