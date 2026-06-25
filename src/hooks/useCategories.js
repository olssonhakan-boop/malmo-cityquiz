import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES_URL = 'https://raw.githubusercontent.com/olssonhakan-boop/malmo-cityquiz/main/categories.json';
const CACHE_KEY = 'malmo_categories_cache';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 timmar

const LOCAL_CATEGORIES = require('../../categories.json');

const FALLBACK_COLOR = '#607D8B';
const FALLBACK_CODEPOINT = 'e0b0'; // location_on

function parseCategories(raw) {
  const result = {};
  for (const [key, val] of Object.entries(raw)) {
    result[key] = {
      icon: String.fromCodePoint(parseInt(val.codepoint, 16)),
      color: val.color,
    };
  }
  return result;
}

export function useCategories() {
  const [categories, setCategories] = useState(() => parseCategories(LOCAL_CATEGORIES));

  useEffect(() => {
    async function load() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const {data, timestamp} = JSON.parse(cached);
          if (Date.now() - timestamp < CACHE_TTL) {
            setCategories(parseCategories(data));
            fetchAndCache().catch(() => {});
            return;
          }
        }
        await fetchAndCache();
      } catch {
        // Använd cache eller lokal fallback — redan satt i initialstate
      }
    }

    async function fetchAndCache() {
      const res = await fetch(CATEGORIES_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      setCategories(parseCategories(data));
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({data, timestamp: Date.now()}),
      );
    }

    load();
  }, []);

  function getCategoryConfig(category) {
    return (
      categories[category] ?? {
        icon: String.fromCodePoint(parseInt(FALLBACK_CODEPOINT, 16)),
        color: FALLBACK_COLOR,
      }
    );
  }

  return {getCategoryConfig};
}
