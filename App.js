import React, {useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import HomeScreen from './src/screens/HomeScreen';
import SelectScreen from './src/screens/SelectScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import InfoScreen from './src/screens/InfoScreen';
import MapScreen from './src/screens/MapScreen';
import SofaScreen from './src/screens/SofaScreen';
import {initSounds} from './src/utils/sound';

const SOUND_KEY  = 'malmo_sound_enabled';
const HAPTIC_KEY = 'malmo_haptic_enabled';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [quizMode, setQuizMode] = useState(null); // 'map' | 'sofa'
  const [lang, setLang] = useState('sv');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  useEffect(() => {
    initSounds();
    AsyncStorage.multiGet([SOUND_KEY, HAPTIC_KEY]).then(pairs => {
      const sound  = pairs[0][1];
      const haptic = pairs[1][1];
      if (sound  !== null) setSoundEnabled(sound   === 'true');
      if (haptic !== null) setHapticEnabled(haptic === 'true');
    }).catch(() => {});
  }, []);

  function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    AsyncStorage.setItem(SOUND_KEY, String(next));
  }

  function toggleHaptic() {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    AsyncStorage.setItem(HAPTIC_KEY, String(next));
  }

  function handleSelectStart({mode, categories}) {
    setQuizMode(mode);
    setSelectedCategories(categories);
    if (mode === 'map') setScreen('category');
    else setScreen('sofa');
  }

  function handleCategoryStart({categories}) {
    setSelectedCategories(categories);
    setScreen('info');
  }

  if (screen === 'home') {
    return (
      <HomeScreen
        lang={lang}
        onLangChange={setLang}
        onStart={() => setScreen('select')}
        soundEnabled={soundEnabled}
        hapticEnabled={hapticEnabled}
        onToggleSound={toggleSound}
      />
    );
  }

  if (screen === 'select') {
    return (
      <SelectScreen
        lang={lang}
        onLangChange={setLang}
        onStart={handleSelectStart}
        onGoBack={() => setScreen('home')}
        soundEnabled={soundEnabled}
        onToggleSound={toggleSound}
        hapticEnabled={hapticEnabled}
        onToggleHaptic={toggleHaptic}
      />
    );
  }

  if (screen === 'category') {
    return (
      <CategoryScreen
        lang={lang}
        onStart={handleCategoryStart}
        soundEnabled={soundEnabled}
        hapticEnabled={hapticEnabled}
      />
    );
  }

  if (screen === 'info') {
    return (
      <InfoScreen
        lang={lang}
        categories={selectedCategories}
        onStart={() => setScreen('map')}
        soundEnabled={soundEnabled}
      />
    );
  }

  if (screen === 'map') {
    return (
      <MapScreen
        lang={lang}
        onLangChange={setLang}
        selectedCategories={selectedCategories}
        onGoHome={() => setScreen('home')}
        onGoInfo={() => setScreen('info')}
        soundEnabled={soundEnabled}
      />
    );
  }

  if (screen === 'sofa') {
    return (
      <SofaScreen
        lang={lang}
        onGoHome={() => setScreen('home')}
        soundEnabled={soundEnabled}
        hapticEnabled={hapticEnabled}
      />
    );
  }

  return <HomeScreen
    lang={lang}
    onLangChange={setLang}
    onStart={() => setScreen('select')}
    soundEnabled={soundEnabled}
    hapticEnabled={hapticEnabled}
    onToggleSound={toggleSound}
  />;
}
