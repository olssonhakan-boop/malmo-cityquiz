import React, {useState} from 'react';
import {StatusBar} from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import MapScreen from './src/screens/MapScreen';

export default function App() {
  const [screen, setScreen] = useState('home');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [lang, setLang] = useState('sv');

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#003366" />
      {screen === 'home' ? (
        <HomeScreen
          lang={lang}
          onLangChange={setLang}
          selectedCategories={selectedCategories}
          onCategoriesChange={setSelectedCategories}
          onStart={() => setScreen('map')}
        />
      ) : (
        <MapScreen
          lang={lang}
          onLangChange={setLang}
          selectedCategories={selectedCategories}
          onGoHome={() => setScreen('home')}
        />
      )}
    </>
  );
}
