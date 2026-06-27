import quizLocationsJson from '../../data/quizLocations.json'
import toursJson from '../../data/tours.json'
import {
  FindDetailQuestion,
  LocalizedText,
  LocationQuestion,
  QuizImageTarget,
  QuizLocation,
  QuizOption,
  QuizQuestionType,
  RawLocalizedText,
  SortOrderQuestion,
  TourDefinition,
  TrueFalseQuestion,
} from '../types'

type RawQuizOption = {
  id?: string
  label?: RawLocalizedText
}

type RawImageTarget = {
  id?: string
  xPercent?: number
  yPercent?: number
  radiusPercent?: number
}

type RawQuestion = {
  id?: string
  type?: QuizQuestionType
  prompt?: RawLocalizedText
  fact?: RawLocalizedText
  instruction?: RawLocalizedText
  imageUri?: string | null
  imageAssetId?: string | null
  options?: RawQuizOption[]
  correctOptionId?: string
  correctBoolean?: boolean
  items?: RawQuizOption[]
  correctOrderIds?: string[]
  detailTargets?: RawImageTarget[]
  correctTargetId?: string
}

type RawQuizLocation = {
  id?: string
  title?: RawLocalizedText
  summary?: RawLocalizedText
  latitude?: number | null
  longitude?: number | null
  imageUri?: string | null
  imageAssetId?: string | null
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

function getDefaultInstruction(type: QuizQuestionType) {
  switch (type) {
    case 'true-false':
      return 'Markera om påståendet är sant eller falskt.'
    case 'sort-order':
      return 'Tryck på alternativen i den ordning du vill lägga dem.'
    case 'find-detail':
      return 'Tryck direkt på bilden där du tror att detaljen finns.'
    case 'multiple-choice':
    default:
      return ''
  }
}

function normalizeOptions(
  rawOptions: RawQuizOption[] = [],
  fallbackPrefix: string
) {
  return rawOptions.map((option, index) => ({
    id: option.id?.trim() || `${fallbackPrefix}-${index + 1}`,
    label: normalizeLocalizedText(option.label, `Option ${index + 1}`),
  }))
}

function normalizeImageTargets(rawTargets: RawImageTarget[] = []) {
  return rawTargets.map((target, index) => ({
    id: target.id?.trim() || `target-${index + 1}`,
    xPercent:
      typeof target.xPercent === 'number' && target.xPercent >= 0
        ? target.xPercent
        : 50,
    yPercent:
      typeof target.yPercent === 'number' && target.yPercent >= 0
        ? target.yPercent
        : 50,
    radiusPercent:
      typeof target.radiusPercent === 'number' && target.radiusPercent > 0
        ? target.radiusPercent
        : 10,
  } satisfies QuizImageTarget))
}

function normalizeQuestion(rawQuestion: RawQuestion, index: number) {
  const type = rawQuestion.type ?? 'multiple-choice'
  const baseQuestion = {
    id: rawQuestion.id?.trim() || `question-${index + 1}`,
    type,
    prompt: normalizeLocalizedText(
      rawQuestion.prompt,
      `Question ${index + 1}`
    ),
    fact: normalizeLocalizedText(rawQuestion.fact, ''),
    instruction: normalizeLocalizedText(
      rawQuestion.instruction,
      getDefaultInstruction(type)
    ),
    imageUri: rawQuestion.imageUri?.trim() || null,
    imageAssetId: rawQuestion.imageAssetId?.trim() || null,
  } as const

  if (type === 'true-false') {
    return {
      ...baseQuestion,
      type,
      correctBoolean: rawQuestion.correctBoolean !== false,
    } satisfies TrueFalseQuestion
  }

  if (type === 'sort-order') {
    const items = normalizeOptions(rawQuestion.items, 'item')
    const validOrderIds = (rawQuestion.correctOrderIds ?? []).filter((itemId) =>
      items.some((item) => item.id === itemId)
    )

    return {
      ...baseQuestion,
      type,
      items,
      correctOrderIds:
        validOrderIds.length === items.length
          ? validOrderIds
          : items.map((item) => item.id),
    } satisfies SortOrderQuestion
  }

  if (type === 'find-detail') {
    const detailTargets = normalizeImageTargets(rawQuestion.detailTargets)

    return {
      ...baseQuestion,
      type,
      detailTargets,
      correctTargetId:
        detailTargets.find((target) => target.id === rawQuestion.correctTargetId)
          ?.id ??
        detailTargets[0]?.id ??
        'target-1',
    } satisfies FindDetailQuestion
  }

  const options = normalizeOptions(rawQuestion.options, 'option')

  return {
    ...baseQuestion,
    type: 'multiple-choice',
    options,
    correctOptionId:
      options.find((option) => option.id === rawQuestion.correctOptionId)?.id ??
      options[0]?.id ??
      `option-${index + 1}`,
  } satisfies LocationQuestion
}

function normalizeLocation(rawLocation: RawQuizLocation, index: number) {
  return {
    id: rawLocation.id?.trim() || `location-${index + 1}`,
    title: normalizeLocalizedText(rawLocation.title, `Location ${index + 1}`),
    summary: normalizeLocalizedText(rawLocation.summary, ''),
    latitude:
      typeof rawLocation.latitude === 'number' ? rawLocation.latitude : null,
    longitude:
      typeof rawLocation.longitude === 'number' ? rawLocation.longitude : null,
    imageUri: rawLocation.imageUri?.trim() || null,
    imageAssetId: rawLocation.imageAssetId?.trim() || null,
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

      if (question.type === 'multiple-choice') {
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
      }

      if (question.type === 'sort-order') {
        if (question.items.length < 2) {
          console.warn(
            `[content] Question "${scopedQuestionId}" should have at least two sortable items.`
          )
        }

        if (question.correctOrderIds.length !== question.items.length) {
          console.warn(
            `[content] Question "${scopedQuestionId}" has an invalid sort order definition.`
          )
        }
      }

      if (question.type === 'find-detail') {
        if (!question.imageAssetId && !question.imageUri) {
          console.warn(
            `[content] Question "${scopedQuestionId}" should provide an image for find-detail mode.`
          )
        }

        if (question.detailTargets.length === 0) {
          console.warn(
            `[content] Question "${scopedQuestionId}" should define at least one detail target.`
          )
        }
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
  return location.questions.map((question) =>
    buildQuestionProgressId(location.id, question.id)
  )
}

export function buildQuestionProgressId(locationId: string, questionId: string) {
  return `${locationId}::${questionId}`
}

export function getAllQuestionProgressIds() {
  return quizLocations.flatMap((location) => getLocationQuestionIds(location))
}

export function expandLegacyProgressIds(progressIds: string[]) {
  const questionIdSet = new Set(getAllQuestionProgressIds())
  const locationMap = new Map(
    quizLocations.map((location) => [location.id, location])
  )
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
