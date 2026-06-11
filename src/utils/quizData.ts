import quizLocationsJson from '../../data/quizLocations.json'
import { AppLanguage, QuizEntry } from '../types'

export const CITY_CENTER = {
  latitude: 55.605,
  longitude: 13.0038,
}

export const quizEntries = quizLocationsJson as QuizEntry[]

export function getMapQuizEntries() {
  return quizEntries.filter(
    (quiz) =>
      typeof quiz.latitude === 'number' && typeof quiz.longitude === 'number'
  )
}

export function getCitywideQuizzes() {
  return quizEntries.filter(
    (quiz) => quiz.latitude === null || quiz.longitude === null
  )
}

export function getQuizTitle(quiz: QuizEntry, language: AppLanguage) {
  return quiz.title[language]
}
