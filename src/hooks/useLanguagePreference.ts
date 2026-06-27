import { useCallback, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppLanguage } from '../types'

const STORAGE_KEY = 'malmo-cityquiz-language'

export default function useLanguagePreference() {
  const [language, setLanguageState] = useState<AppLanguage>('sv')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    async function loadPreference() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved === 'sv' || saved === 'en' || saved === 'de') {
          setLanguageState(saved)
        }
      } finally {
        setHydrated(true)
      }
    }

    loadPreference()
  }, [])

  const setLanguage = useCallback(async (nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage)
    await AsyncStorage.setItem(STORAGE_KEY, nextLanguage)
  }, [])

  return {
    language,
    setLanguage,
    hydrated,
  }
}
