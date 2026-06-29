import {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATIONS_URL =
  'https://raw.githubusercontent.com/olssonhakan-boop/malmo-cityquiz/main/quizLocations.json';
const CACHE_KEY = 'malmo_locations_cache';
const CACHE_TTL = 1000 * 60 * 60; // 1 timme

const LOCAL_LOCATIONS = require('../../quizLocations.json');

export function useLocations() {
  const [locations, setLocations] = useState(LOCAL_LOCATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    // DEV: använd alltid bundlad JSON under testning
    setLocations(LOCAL_LOCATIONS);
    setLoading(false);
  };

  const fetchAndCache = async () => {
    const res = await fetch(LOCATIONS_URL);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    setLocations(data);
    await AsyncStorage.setItem(
      CACHE_KEY,
      JSON.stringify({data, timestamp: Date.now()}),
    );
  };

  useEffect(() => {
    load();
  }, []);

  return {locations, loading, error, reload: load};
}

export function makeProgressId(locationId, questionId) {
  return `${locationId}:${questionId}`;
}

export function isLocationComplete(location, completedIds) {
  return location.questions.every(q =>
    completedIds.has(makeProgressId(location.id, q.id)),
  );
}

export function locationProgress(location, completedIds) {
  const done = location.questions.filter(q =>
    completedIds.has(makeProgressId(location.id, q.id)),
  ).length;
  return {done, total: location.questions.length};
}
