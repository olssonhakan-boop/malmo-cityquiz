import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'

const STORAGE_KEY = 'malmo-cityquiz-completed-ids'

export default function useQuizProgress() {
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    async function loadProgress() {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY)
        const parsed = raw ? JSON.parse(raw) : []
        if (Array.isArray(parsed)) {
          setCompletedIds(parsed)
        }
      } finally {
        setHydrated(true)
      }
    }

    loadProgress()
  }, [])

  const markCompleted = useCallback(async (quizId: string) => {
    setCompletedIds((current) => {
      if (current.includes(quizId)) {
        return current
      }

      const next = [...current, quizId]
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined)
      return next
    })
  }, [])

  return {
    completedIds,
    markCompleted,
    hydrated,
  }
}
