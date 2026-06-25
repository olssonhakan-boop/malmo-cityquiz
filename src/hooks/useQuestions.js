import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this URL to your GitHub raw questions.json URL after uploading
// Example: 'https://raw.githubusercontent.com/olssonhakan-boop/malmo-cityquiz/main/questions.json'
const QUESTIONS_URL = 'https://raw.githubusercontent.com/olssonhakan-boop/malmo-cityquiz/main/questions.json';
const CACHE_KEY = 'malmo_questions_cache';
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

// Fallback: local questions used if network is unavailable and no cache exists
const LOCAL_QUESTIONS = require('../../questions.json');

export function useQuestions() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try to read from cache first
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          setQuestions(data);
          setLoading(false);
          // Refresh in background
          fetchAndCache().catch(() => {});
          return;
        }
      }
      // Cache expired or missing — fetch fresh
      await fetchAndCache();
    } catch (err) {
      // Network error — use cache or local fallback
      const cached = await AsyncStorage.getItem(CACHE_KEY).catch(() => null);
      if (cached) {
        setQuestions(JSON.parse(cached).data);
      } else {
        setQuestions(LOCAL_QUESTIONS);
      }
      setError('offline');
    } finally {
      setLoading(false);
    }
  };

  const fetchAndCache = async () => {
    const res = await fetch(QUESTIONS_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    setQuestions(data);
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  };

  useEffect(() => {
    load();
  }, []);

  return { questions, loading, error, reload: load };
}
