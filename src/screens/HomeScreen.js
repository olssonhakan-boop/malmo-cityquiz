import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import {t} from '../utils/i18n';
import LanguagePicker from '../components/LanguagePicker';
import {StatusBar as RNStatusBar} from 'react-native';
import {playClick} from '../utils/sound';

const HERO_IMAGE = require('../assets/homequiz.png');

export default function HomeScreen({lang, onLangChange, onStart, soundEnabled, hapticEnabled}) {
  const {width, height} = useWindowDimensions();

  // Alla mått beräknas från faktisk skärmstorlek
  const s = makeStyles(width, height);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <ImageBackground source={HERO_IMAGE} style={s.bg} resizeMode="cover">
        <View style={s.topGradient} />
        <SafeAreaView style={s.safe}>

          <View style={s.header}>
            <Text style={s.title}>{t(lang, 'homeTitle')}</Text>
            <Text style={s.subtitle}>{t(lang, 'homeSubtitle')}</Text>
          </View>

          <View style={s.langWrapper}>
            <LanguagePicker lang={lang} onSelect={onLangChange} />
          </View>

          <View style={s.btnWrapper}>
            <TouchableOpacity style={s.startBtn} onPress={() => { playClick(soundEnabled, hapticEnabled); onStart(); }} activeOpacity={0.85}>
              <View style={s.startBtnHighlight} />
              <Text style={s.startBtnText}>{t(lang, 'homeStartBtn')}</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function makeStyles(width, height) {
  const hp = pct => height * (pct / 100); // procentandel av höjden
  const wp = pct => width * (pct / 100);  // procentandel av bredden

  // Fontstorlekar skalas mot en referensskärm på 390px bred (iPhone 14 / Pixel 7)
  const fontScale = width / 390;
  const fs = size => Math.round(size * fontScale);

  const pad = wp(6); // 6% av bredden som standardpadding

  return StyleSheet.create({
    root: {flex: 1},
    bg: {flex: 1},
    safe: {flex: 1},
    topGradient: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: hp(28),
      backgroundColor: 'rgba(0,0,0,0.45)',
    },

    header: {
      position: 'absolute',
      top: (RNStatusBar.currentHeight || 40) + hp(3),
      left: pad,
      right: pad,
      alignItems: 'center',
    },
    title: {
      fontSize: fs(36),
      fontWeight: '900',
      color: '#fff',
      letterSpacing: -0.5,
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.6)',
      textShadowOffset: {width: 0, height: 2},
      textShadowRadius: 8,
    },
    subtitle: {
      fontSize: fs(17),
      fontWeight: '500',
      color: 'rgba(255,255,255,0.95)',
      marginTop: hp(1),
      textAlign: 'center',
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: {width: 0, height: 1},
      textShadowRadius: 6,
    },

    langWrapper: {
      position: 'absolute',
      top: hp(18),
      right: pad,
    },

    btnWrapper: {
      position: 'absolute',
      top: hp(24),
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    startBtn: {
      backgroundColor: '#1a1a2e',
      borderRadius: wp(4),
      paddingVertical: hp(2),
      paddingHorizontal: wp(12),
      alignItems: 'center',
      overflow: 'hidden',
      elevation: 12,
      borderBottomWidth: 3,
      borderBottomColor: '#000',
      borderLeftWidth: 1,
      borderLeftColor: 'rgba(0,0,0,0.4)',
      borderRightWidth: 1,
      borderRightColor: 'rgba(0,0,0,0.4)',
    },
    startBtnHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '45%',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderTopLeftRadius: wp(4),
      borderTopRightRadius: wp(4),
    },
    startBtnText: {
      fontSize: fs(18),
      fontWeight: '700',
      color: '#fff',
      letterSpacing: 0.3,
    },
  });
}
