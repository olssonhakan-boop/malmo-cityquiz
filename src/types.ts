export type AppLanguage = 'sv' | 'en' | 'de'

export type LocalizedText = Record<AppLanguage, string>

export type RawLocalizedText = Partial<Record<AppLanguage, string>>

export type QuizQuestionType =
  | 'multiple-choice'
  | 'true-false'
  | 'sort-order'
  | 'find-detail'

export type QuizOption = {
  id: string
  label: LocalizedText
}

export type QuizImageTarget = {
  id: string
  xPercent: number
  yPercent: number
  radiusPercent: number
}

type BaseLocationQuestion = {
  id: string
  type: QuizQuestionType
  prompt: LocalizedText
  fact: LocalizedText
  instruction: LocalizedText
  imageUri: string | null
  imageAssetId: string | null
}

export type MultipleChoiceQuestion = BaseLocationQuestion & {
  type: 'multiple-choice'
  options: QuizOption[]
  correctOptionId: string
}

export type TrueFalseQuestion = BaseLocationQuestion & {
  type: 'true-false'
  correctBoolean: boolean
}

export type SortOrderQuestion = BaseLocationQuestion & {
  type: 'sort-order'
  items: QuizOption[]
  correctOrderIds: string[]
}

export type FindDetailQuestion = BaseLocationQuestion & {
  type: 'find-detail'
  imageAssetId: string | null
  imageUri: string | null
  detailTargets: QuizImageTarget[]
  correctTargetId: string
}

export type LocationQuestion =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | SortOrderQuestion
  | FindDetailQuestion

export type QuizLocation = {
  id: string
  title: LocalizedText
  summary: LocalizedText
  latitude: number | null
  longitude: number | null
  imageUri: string | null
  imageAssetId: string | null
  questions: LocationQuestion[]
}

export type TourDefinition = {
  id: string
  title: LocalizedText
  description: LocalizedText
  iconLabel: string
  locationIds: string[]
}

export type UserCoordinates = {
  latitude: number
  longitude: number
}
