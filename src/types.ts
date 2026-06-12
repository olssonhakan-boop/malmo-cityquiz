export type AppLanguage = 'sv' | 'en' | 'de'

export type LocalizedText = Record<AppLanguage, string>

export type RawLocalizedText = Partial<Record<AppLanguage, string>>

export type QuizOption = {
  id: string
  label: LocalizedText
}

export type LocationQuestion = {
  id: string
  prompt: LocalizedText
  options: QuizOption[]
  correctOptionId: string
  fact: LocalizedText
}

export type QuizLocation = {
  id: string
  title: LocalizedText
  summary: LocalizedText
  latitude: number | null
  longitude: number | null
  imageUri: string | null
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
