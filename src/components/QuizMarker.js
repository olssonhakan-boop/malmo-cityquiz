import React, {useEffect, useRef, useState} from 'react';
import {View, Text, Animated, Easing} from 'react-native';
import {Marker} from 'react-native-maps';
import {useCategories} from '../hooks/useCategories';

const COMPLETED_ICON = String.fromCodePoint(0xe86c); // check_circle outlined
const COMPLETED_COLOR = '#2E7D32';

export default function QuizMarker({coordinate, category, status, size, onPress}) {
  const {getCategoryConfig} = useCategories();
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const prevKey = useRef(`${status}-${category}-${size}`);
  const scale = useRef(new Animated.Value(1)).current;
  const animation = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const newKey = `${status}-${category}-${size}`;
    if (newKey !== prevKey.current) {
      prevKey.current = newKey;
      setTracksViewChanges(true);
      const timer = setTimeout(() => setTracksViewChanges(false), 500);
      return () => clearTimeout(timer);
    }
  }, [status, category, size]);

  useEffect(() => {
    if (animation.current) {
      animation.current.stop();
      animation.current = null;
    }
    if (status === 'nearby') {
      setTracksViewChanges(true);
      animation.current = Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.22,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animation.current.start();
    } else {
      scale.setValue(1);
    }
    return () => {
      if (animation.current) {
        animation.current.stop();
      }
    };
  }, [status, scale]);

  const config =
    status === 'completed'
      ? {icon: COMPLETED_ICON, color: COMPLETED_COLOR}
      : getCategoryConfig(category);

  const iconSize = size * 0.55;

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{x: 0.5, y: 0.5}}
      tracksViewChanges={status === 'nearby' ? true : tracksViewChanges}>
      <Animated.View style={{transform: [{scale}]}}>
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.color,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#fff',
            elevation: 3,
          }}>
          <Text
            style={{
              fontFamily: 'MaterialSymbolsOutlined',
              fontSize: iconSize,
              color: '#fff',
              lineHeight: iconSize * 1.1,
            }}>
            {config.icon}
          </Text>
        </View>
      </Animated.View>
    </Marker>
  );
}
