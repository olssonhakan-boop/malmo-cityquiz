import quizLocationsJson from '../../data/quizLocations.json'
import toursJson from '../../data/tours.json'
import {
  LocalizedText,
  QuizLocation,
  QuizOption,
  RawLocalizedText,
  TourDefinition,
} from '../types'

type RawQuizOption = {
  id?: string
  label?: RawLocalizedText
}

type RawQuestion = {
  id?: string
  prompt?: RawLocalizedText
  options?: RawQuizOption[]
  correctOptionId?: string
  fact?: RawLocalizedText
}

type RawQuizLocation = {
  id?: string
  title?: RawLocalizedText
  summary?: RawLocalizedText
  latitude?: number | null
  longitude?: number | null
  imageUri?: string | null
  questions?: RawQuestion[]
}

type RawTourDefinition = {
  id?: string
  title?: RawLocalizedText
  description?: RawLocalizedText
  iconLabel?: string
  locationIds?: string[]
}

export const CITY_CENTER = {
  latitude: 55.605,
  longitude: 13.0038,
}

const supportedLanguages = ['sv', 'en', 'de'] as const

function getFallbackText(rawText: RawLocalizedText | undefined) {
  const candidates = [rawText?.sv, rawText?.en, rawText?.de].filter(
    (value): value is string =>
      typeof value === 'string' && value.trim().length > 0
  )

  return candidates[0] ?? ''
}

function normalizeLocalizedText(
  rawText: RawLocalizedText | undefined,
  fallbackLabel: string
) {
  const fallbackText = getFallbackText(rawText) || fallbackLabel

  return {
    sv: rawText?.sv?.trim() || fallbackText,
    en: rawText?.en?.trim() || fallbackText,
    de: rawText?.de?.trim() || fallbackText,
  } satisfies LocalizedText
}

function normalizeOptions(rawOptions: RawQuizOption[] = []) {
  return rawOptions.map((option, index) => ({
    id: option.id?.trim() || `option-${index + 1}`,
    label: normalizeLocalizedText(option.label, `Option ${index + 1}`),
  }))
}

function normalizeQuestion(rawQuestion: RawQuestion, index: number) {
  const options = normalizeOptions(rawQuestion.options)

  return {
    id: rawQuestion.id?.trim() || `question-${index + 1}`,
    prompt: normalizeLocalizedText(
      rawQuestion.prompt,
      `Question ${index + 1}`
    ),
    options,
    correctOptionId:
      options.find((option) => option.id === rawQuestion.correctOptionId)?.id ??
      options[0]?.id ??
      `option-${index + 1}`,
    fact: normalizeLocalizedText(rawQuestion.fact, ''),
  }
}

function normalizeLocation(rawLocation: RawQuizLocation, index: number) {
  return {
    id: rawLocation.id?.trim() || `location-${index + 1}`,
    title: normalizeLocalizedText(rawLocation.title, `Location ${index + 1}`),
    summary: normalizeLocalizedText(rawLocation.summary, ''),
    latitude: typeof rawLocation.latitude === 'number' ? rawLocation.latitude : null,
    longitude:
      typeof rawLocation.longitude === 'number' ? rawLocation.longitude : null,
    imageUri: rawLocation.imageUri?.trim() || null,
    questions: (rawLocation.questions ?? []).map(normalizeQuestion),
  } satisfies QuizLocation
}

function normalizeTour(rawTour: RawTourDefinition, index: number) {
  return {
    id: rawTour.id?.trim() || `tour-${index + 1}`,
    title: normalizeLocalizedText(rawTour.title, `Tour ${index + 1}`),
    description: normalizeLocalizedText(rawTour.description, ''),
    iconLabel: rawTour.iconLabel?.trim() || `T${index + 1}`,
    locationIds: Array.isArray(rawTour.locationIds) ? rawTour.locationIds : [],
  } satisfies TourDefinition
}

function validateLocations(locations: QuizLocation[]) {
  const locationIds = new Set<string>()
  const questionIds = new Set<string>()

  locations.forEach((location) => {
    if (locationIds.has(location.id)) {
      console.warn(`[content] Duplicate location id "${location.id}".`)
    }
    locationIds.add(location.id)

    if (location.questions.length === 0) {
      console.warn(`[content] Location "${location.id}" has no questions.`)
    }

    location.questions.forEach((question) => {
      const scopedQuestionId = `${location.id}:${question.id}`
      if (questionIds.has(scopedQuestionId)) {
        console.warn(`[content] Duplicate question id "${scopedQuestionId}".`)
      }
      questionIds.add(scopedQuestionId)

      if (question.options.length < 2) {
        console.warn(
          `[content] Question "${scopedQuestionId}" should have at least two options.`
        )
      }

      if (
        !question.options.some((option) => option.id === question.correctOptionId)
      ) {
        console.warn(
          `[content] Question "${scopedQuestionId}" has an invalid correctOptionId.`
        )
      }
    })
  })
}

function validateTours(locations: QuizLocation[], tours: TourDefinition[]) {
  const locationIds = new Set(locations.map((location) => location.id))
  const tourIds = new Set<string>()

  tours.forEach((tour) => {
    if (tourIds.has(tour.id)) {
      console.warn(`[content] Duplicate tour id "${tour.id}".`)
    }
    tourIds.add(tour.id)

    if (tour.locationIds.length === 0) {
      console.warn(`[content] Tour "${tour.id}" has no linked locations.`)
    }

    tour.locationIds.forEach((locationId) => {
      if (!locationIds.has(locationId)) {
        console.warn(
          `[content] Tour "${tour.id}" references missing location "${locationId}".`
        )
      }
    })
  })
}

export const quizLocations = (quizLocationsJson as RawQuizLocation[]).map(
  normalizeLocation
)

export const tourDefinitions = (toursJson as RawTourDefinition[]).map(
  normalizeTour
)

validateLocations(quizLocations)
validateTours(quizLocations, tourDefinitions)

export function isCitywideLocation(location: QuizLocation) {
  return location.latitude === null || location.longitude === null
}

export function getMapLocations(locations = quizLocations) {
  return locations.filter((location) => !isCitywideLocation(location))
}

export function getCitywideLocations(locations = quizLocations) {
  return locations.filter((location) => isCitywideLocation(location))
}

export function getLocationQuestionIds(location: QuizLocation) {
  return location.questions.map((question) => buildQuestionProgressId(location.id, question.id))
}

export function buildQuestionProgressId(locationId: string, questionId: string) {
  return `${locationId}::${questionId}`
}

export function getAllQuestionProgressIds() {
  return quizLocations.flatMap((location) => getLocationQuestionIds(location))
}

export function expandLegacyProgressIds(progressIds: string[]) {
  const questionIdSet = new Set(getAllQuestionProgressIds())
  const locationMap = new Map(quizLocations.map((location) => [location.id, location]))
  const expanded = new Set<string>()

  progressIds.forEach((id) => {
    if (questionIdSet.has(id)) {
      expanded.add(id)
      return
    }

    const matchingLocation = locationMap.get(id)
    if (matchingLocation) {
      getLocationQuestionIds(matchingLocation).forEach((questionId) =>
        expanded.add(questionId)
      )
    }
  })

  return [...expanded]
}

export function getTourById(tourId: string) {
  return tourDefinitions.find((tour) => tour.id === tourId) ?? null
}

export function filterLocationsByTour(tourId: string | null) {
  if (!tourId || tourId === 'all') {
    return quizLocations
  }

  const selectedTour = getTourById(tourId)
  if (!selectedTour) {
    return quizLocations
  }

  const allowedIds = new Set(selectedTour.locationIds)
  return quizLocations.filter((location) => allowedIds.has(location.id))
}
