import React, {useEffect, useRef, useState} from 'react';
import {Text} from 'react-native';
import {Marker} from 'react-native-maps';
import {useCategories} from '../hooks/useCategories';

const COMPLETED_ICON = String.fromCodePoint(0xe86c); // check_circle
const COMPLETED_COLOR = '#455A64';
const STATUS_WEIGHT = {far: 100, nearby: 400, bonus: 700, completed: 400};

export default function QuizMarker({coordinate, category, status, onPress}) {
  const {getCategoryConfig} = useCategories();
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const prevKey = useRef(`${status}-${category}`);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const newKey = `${status}-${category}`;
    if (newKey !== prevKey.current) {
      prevKey.current = newKey;
      setTracksViewChanges(true);
      const timer = setTimeout(() => setTracksViewChanges(false), 500);
      return () => clearTimeout(timer);
    }
  }, [status, category]);

  const config =
    status === 'completed'
      ? {icon: COMPLETED_ICON, color: COMPLETED_COLOR}
      : getCategoryConfig(category);

  const weight = STATUS_WEIGHT[status] ?? 100;

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{x: 0.5, y: 0.5}}
      tracksViewChanges={tracksViewChanges}>
      <Text
        style={{
          fontFamily: 'Material Symbols Outlined',
          fontSize: 36,
          color: config.color,
          fontVariationSettings: `'FILL' 1, 'wght' ${weight}, 'GRAD' 0, 'opsz' 40`,
          textShadowColor: 'rgba(255,255,255,0.9)',
          textShadowOffset: {width: 0, height: 0},
          textShadowRadius: 4,
        }}>
        {config.icon}
      </Text>
    </Marker>
  );
}
