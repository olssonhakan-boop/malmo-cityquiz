import React, {useState} from 'react';
import HomeScreen from './src/screens/HomeScreen';
import SelectScreen from './src/screens/SelectScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import InfoScreen from './src/screens/InfoScreen';
import MapScreen from './src/screens/MapScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [quizMode, setQuizMode] = useState(null); // 'map' | 'sofa'
  const [lang, setLang] = useState('sv');

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
      />
    );
  }

  if (screen === 'select') {
    return (
      <SelectScreen
        lang={lang}
        onStart={handleSelectStart}
      />
    );
  }

  if (screen === 'category') {
    return (
      <CategoryScreen
        lang={lang}
        onStart={handleCategoryStart}
      />
    );
  }

  if (screen === 'info') {
    return (
      <InfoScreen
        lang={lang}
        categories={selectedCategories}
        onStart={() => setScreen('map')}
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
      />
    );
  }

  // screen === 'sofa' — kommer byggas ut senare
  return (
    <MapScreen
      lang={lang}
      onLangChange={setLang}
      selectedCategories={[]}
      sofaMode={true}
      onGoHome={() => setScreen('home')}
    />
  );
}
