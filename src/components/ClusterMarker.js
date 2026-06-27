import React, {useEffect, useRef, useState} from 'react';
import {View, Text} from 'react-native';
import {Marker} from 'react-native-maps';

const GOLD = '#C8A840';
const GOLD_DARK = '#7A5A00';

const COUNTER_CODEPOINTS = {
  0: 0xf785, 1: 0xf784, 2: 0xf783, 3: 0xf782, 4: 0xf781,
  5: 0xf780, 6: 0xf77f, 7: 0xf77e, 8: 0xf77d, 9: 0xf77c,
};

function getCounterIcon(count) {
  const n = count > 9 ? 9 : count;
  return String.fromCodePoint(COUNTER_CODEPOINTS[n]);
}

export default function ClusterMarker({coordinate, count, size, onPress}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const prevKey = useRef(`${count}-${size}`);

  useEffect(() => {
    const timer = setTimeout(() => setTracksViewChanges(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const newKey = `${count}-${size}`;
    if (newKey !== prevKey.current) {
      prevKey.current = newKey;
      setTracksViewChanges(true);
      const timer = setTimeout(() => setTracksViewChanges(false), 500);
      return () => clearTimeout(timer);
    }
  }, [count, size]);

  const iconSize = size * 0.55;

  return (
    <Marker
      coordinate={coordinate}
      onPress={onPress}
      anchor={{x: 0.5, y: 0.5}}
      tracksViewChanges={tracksViewChanges}>
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: GOLD,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 2,
          borderColor: '#fff',
          elevation: 5,
        }}>
        <Text
          style={{
            fontFamily: 'MaterialSymbolsOutlined',
            fontSize: iconSize,
            color: '#1a0f00',
            lineHeight: iconSize * 1.1,
          }}>
          {getCounterIcon(count)}
        </Text>
        {count > 9 && (
          <Text
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              fontSize: size * 0.22,
              fontWeight: '800',
              color: '#fff',
              backgroundColor: GOLD_DARK,
              borderRadius: 4,
              paddingHorizontal: 2,
              lineHeight: size * 0.28,
            }}>
            +
          </Text>
        )}
      </View>
    </Marker>
  );
}
