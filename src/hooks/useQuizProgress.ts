import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { expandLegacyProgressIds } from '../utils/quizData'

const STORAGE_KEY = 'malmo-cityquiz-completed-question-ids'
const LEGACY_STORAGE_KEY = 'malmo-cityquiz-completed-ids'

function parseStoredIdList(rawValue: string | null) {
  if (!rawValue) {
    return []
  }

  try {
    const parsed = JSON.parse(rawValue)
    return Array.isArray(parsed)
      ? parsed.filter((value): value is string => typeof value === 'string')
      : []
  } catch {
    return []
  }
}

export default function useQuizProgress() {
  const [completedQuestionIds, setCompletedQuestionIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    async function loadProgress() {
      try {
        const [rawCurrent, rawLegacy] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY),
          AsyncStorage.getItem(LEGACY_STORAGE_KEY),
        ])

        const mergedIds = [
          ...parseStoredIdList(rawCurrent),
          ...parseStoredIdList(rawLegacy),
        ]
        const normalized = expandLegacyProgressIds(mergedIds)

        setCompletedQuestionIds(normalized)

        if (rawLegacy) {
          await AsyncStorage.removeItem(LEGACY_STORAGE_KEY)
        }
      } finally {
        setHydrated(true)
      }
    }

    loadProgress()
  }, [])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(completedQuestionIds)
    ).catch(() => undefined)
  }, [completedQuestionIds, hydrated])

  const markQuestionCompleted = useCallback(
    async (questionProgressId: string) => {
      setCompletedQuestionIds((current) => {
        if (current.includes(questionProgressId)) {
          return current
        }

        return [...current, questionProgressId]
      })
    },
    []
  )

  return {
    completedQuestionIds,
    markQuestionCompleted,
    hydrated,
  }
}
