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

const BG_IMAGE = require('../assets/quizbg.jpg');
const GOLD = '#C8A840';
const CARD_BG = 'rgba(44,30,15,0.82)';

const ICON_KANDISAR = String.fromCodePoint(0xf0d3);
const ICON_HISTORIA = String.fromCodePoint(0xea3e);
const ICON_PLATSER  = String.fromCodePoint(0xf200);
// Faktiska statusar på kartan: kategorimarkör → pulserar (nearby) → grön check (avklarad)
const ICON_MARKER   = String.fromCodePoint(0xe0c8); // location_on — standard markör
const ICON_NEARBY   = String.fromCodePoint(0xe0c8); // samma men pulserar i appen
const ICON_DONE     = String.fromCodePoint(0xe86c); // check_circle — avklarad

export default function InfoScreen({lang, onStart}) {
  const {width, height} = useWindowDimensions();
  const s = makeStyles(width, height);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={BG_IMAGE} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />
        <SafeAreaView style={s.safe}>

          <Text style={s.title}>{t(lang, 'infoTitle')}</Text>
          <Text style={s.subtitle}>{t(lang, 'infoSubtitle')}</Text>

          {/* Kategori-ikoner */}
          <View style={s.card}>
            <View style={s.catRow}>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#5B4A9A'}]}>
                  <Text style={s.iconText}>{ICON_KANDISAR}</Text>
                </View>
                <Text style={s.catLabel}>{t(lang, 'infoCatKandisar')}</Text>
                <Text style={s.catSub}>{t(lang, 'infoCatKandisarSub')}</Text>
              </View>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#2D6A3F'}]}>
                  <Text style={s.iconText}>{ICON_HISTORIA}</Text>
                </View>
                <Text style={s.catLabel}>{t(lang, 'infoCatHistoria')}</Text>
                <Text style={s.catSub}>{t(lang, 'infoCatHistoriaSub')}</Text>
              </View>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#1A3A6B'}]}>
                  <Text style={s.iconText}>{ICON_PLATSER}</Text>
                </View>
                <Text style={s.catLabel}>{t(lang, 'infoCatPlatser')}</Text>
                <Text style={s.catSub}>{t(lang, 'infoCatPlatserSub')}</Text>
              </View>
            </View>
            <Text style={s.cardDesc}>{t(lang, 'infoCatDesc')}</Text>
          </View>

          {/* Markör-statusar — speglar faktisk kartlogik */}
          <View style={s.card}>
            <Text style={s.cardTitle}>{t(lang, 'infoProximityTitle')}</Text>
            <View style={s.markerFlow}>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: '#555'}]}>
                  <Text style={s.markerIcon}>{ICON_MARKER}</Text>
                </View>
                <Text style={s.markerLabel}>{t(lang, 'infoProximityFar')}</Text>
              </View>
              <Text style={s.arrow}>→</Text>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: '#E6C84A'}]}>
                  <Text style={s.markerIcon}>{ICON_NEARBY}</Text>
                </View>
                <Text style={[s.markerLabel, {color: GOLD}]}>{t(lang, 'infoProximityNear')}</Text>
              </View>
              <Text style={s.arrow}>→</Text>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: '#27AE60'}]}>
                  <Text style={s.markerIcon}>{ICON_DONE}</Text>
                </View>
                <Text style={[s.markerLabel, {color: '#4CD964', fontWeight: '700'}]}>{t(lang, 'infoProximityDone')}</Text>
              </View>
            </View>
            <Text style={s.cardDesc}>
              {t(lang, 'infoProximityDescBold') ? (
                <>
                  {lang === 'sv' ? 'Svara rätt på plats och få ' : lang === 'en' ? 'Answer correctly on location and earn ' : 'Beantworte Fragen vor Ort und erhalte '}
                  <Text style={s.highlight}>{t(lang, 'infoProximityDescBold')}</Text>
                  {lang === 'sv' ? ' — det lönar sig att röra på benen!' : lang === 'en' ? ' — it pays to get moving!' : ' — es lohnt sich, loszugehen!'}
                </>
              ) : null}
            </Text>
          </View>

          {/* Poäng + tips */}
          <View style={s.bottomRow}>
            <View style={[s.card, s.pointsCard]}>
              <Text style={s.pointsBig}><Text style={s.pointsGold}>10</Text> p</Text>
              <Text style={s.pointsSmall}>{t(lang, 'infoPointsRight')}</Text>
              <Text style={s.pointsBig}><Text style={s.pointsGold}>30</Text> p</Text>
              <Text style={s.pointsSmall}>{t(lang, 'infoPointsPlace')}</Text>
            </View>
            <View style={[s.card, s.tipsCard]}>
              <Text style={s.tipsText}>{t(lang, 'infoTipsText')}</Text>
            </View>
          </View>

          {/* CTA */}
          <View style={s.btnRow}>
            <TouchableOpacity style={s.goldBtn} onPress={onStart} activeOpacity={0.85}>
              <View style={s.goldBtnHighlight} />
              <Text style={s.goldBtnText}>{t(lang, 'infoStartBtn')}</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function makeStyles(width, height) {
  const wp = pct => width * (pct / 100);
  const hp = pct => height * (pct / 100);
  const fs = size => Math.round(size * (width / 390));

  return StyleSheet.create({
    root: {flex: 1},
    bg: {flex: 1},
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8,4,0,0.60)',
    },
    safe: {
      flex: 1,
      paddingHorizontal: wp(5),
      justifyContent: 'center',
    },

    title: {
      fontSize: fs(24),
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginBottom: hp(0.5),
    },
    subtitle: {
      fontSize: fs(14),
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      marginBottom: hp(2.5),
    },

    card: {
      backgroundColor: CARD_BG,
      borderRadius: wp(4),
      padding: wp(4),
      marginBottom: hp(1.5),
    },
    cardTitle: {
      fontSize: fs(13),
      fontWeight: '700',
      color: GOLD,
      marginBottom: hp(1),
    },
    cardDesc: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.85)',
      lineHeight: fs(12) * 1.55,
      marginTop: hp(1),
    },
    highlight: {
      color: GOLD,
      fontWeight: '700',
    },

    catRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    catItem: {
      alignItems: 'center',
      gap: hp(0.6),
    },
    catIcon: {
      width: wp(12),
      height: wp(12),
      borderRadius: wp(6),
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconText: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(22),
      color: '#fff',
    },
    catLabel: {
      fontSize: fs(12),
      color: '#fff',
      fontWeight: '700',
    },
    catSub: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.70)',
      textAlign: 'center',
      lineHeight: fs(12) * 1.4,
    },

    markerFlow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(1.5),
    },
    markerStep: {
      alignItems: 'center',
      gap: hp(0.5),
      flex: 1,
    },
    markerDot: {
      width: wp(11),
      height: wp(11),
      borderRadius: wp(5.5),
      alignItems: 'center',
      justifyContent: 'center',
    },
    markerIcon: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(18),
      color: '#fff',
    },
    markerLabel: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.75)',
      fontWeight: '600',
      textAlign: 'center',
    },
    arrow: {
      fontSize: fs(16),
      color: 'rgba(255,255,255,0.40)',
      marginBottom: hp(1.5),
    },

    bottomRow: {
      flexDirection: 'row',
      gap: wp(3),
      marginBottom: hp(1.5),
    },
    pointsCard: {
      flex: 0,
      width: wp(24),
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 0,
    },
    tipsCard: {
      flex: 1,
      justifyContent: 'center',
      borderLeftWidth: 3,
      borderLeftColor: GOLD,
      marginBottom: 0,
    },
    pointsBig: {
      fontSize: fs(13),
      color: '#fff',
      fontWeight: '600',
    },
    pointsGold: {
      fontSize: fs(22),
      fontWeight: '800',
      color: GOLD,
    },
    pointsSmall: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.70)',
      marginBottom: hp(0.5),
    },
    tipsText: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.85)',
      lineHeight: fs(12) * 1.6,
      fontStyle: 'italic',
    },

    btnRow: {
      alignItems: 'center',
      marginTop: hp(1),
    },
    goldBtn: {
      backgroundColor: GOLD,
      borderRadius: 50,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(12),
      elevation: 8,
      overflow: 'hidden',
      borderBottomWidth: 4,
      borderBottomColor: 'rgba(0,0,0,0.30)',
    },
    goldBtnHighlight: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '45%',
      backgroundColor: 'rgba(255,255,255,0.25)',
      borderRadius: 50,
    },
    goldBtnText: {
      fontSize: fs(15),
      fontWeight: '700',
      color: '#1a0f00',
      letterSpacing: 0.3,
    },
  });
}
