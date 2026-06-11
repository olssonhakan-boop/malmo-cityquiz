export type AppLanguage = 'sv' | 'en' | 'de'

export type LocalizedText = Record<AppLanguage, string>

export type LocalizedOptions = Record<AppLanguage, string[]>

export type QuizEntry = {
  id: string
  title: LocalizedText
  latitude: number | null
  longitude: number | null
  imageUri: string | null
  question: LocalizedText
  options: LocalizedOptions
  correctAnswer: LocalizedText
}

export type UserCoordinates = {
  latitude: number
  longitude: number
}
