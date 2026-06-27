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

const BG_IMAGE = require('../assets/quizbg.jpg');
const GOLD = '#C8A840';
const CARD_BG = 'rgba(44,30,15,0.78)';

const ICON_KANDISAR = String.fromCodePoint(0xf0d3);
const ICON_HISTORIA = String.fromCodePoint(0xea3e); // history_edu
const ICON_PLATSER  = String.fromCodePoint(0xf200); // foundation
const ICON_PIN      = String.fromCodePoint(0xe0c8);
const ICON_WALK     = String.fromCodePoint(0xe536);
const ICON_STAR     = String.fromCodePoint(0xe838);

export default function InfoScreen({lang, categories, onStart}) {
  const {width, height} = useWindowDimensions();
  const s = makeStyles(width, height);

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={BG_IMAGE} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />
        <SafeAreaView style={s.safe}>

          <Text style={s.title}>Redo att utforska Malmö?</Text>
          <Text style={s.subtitle}>Så här fungerar det</Text>

          {/* Kategori-ikoner */}
          <View style={s.card}>
            <View style={s.catRow}>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#5B4A9A'}]}>
                  <Text style={s.iconText}>{ICON_KANDISAR}</Text>
                </View>
                <Text style={s.catLabel}>Kändisar</Text>
                <Text style={s.catSub}>Malmöbor som{'\n'}satt avtryck</Text>
              </View>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#2D6A3F'}]}>
                  <Text style={s.iconText}>{ICON_HISTORIA}</Text>
                </View>
                <Text style={s.catLabel}>Historia</Text>
                <Text style={s.catSub}>Händelser som{'\n'}format staden</Text>
              </View>
              <View style={s.catItem}>
                <View style={[s.catIcon, {backgroundColor: '#1A3A6B'}]}>
                  <Text style={s.iconText}>{ICON_PLATSER}</Text>
                </View>
                <Text style={s.catLabel}>Platser</Text>
                <Text style={s.catSub}>Landmärken{'\n'}& arkitektur</Text>
              </View>
            </View>
            <Text style={s.cardDesc}>
              Varje ikon på kartan är en plats med en historia — gå dit och ta reda på den.
            </Text>
          </View>

          {/* Markör-progression */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Ju närmare du går — desto mer händer</Text>
            <View style={s.markerFlow}>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: '#666'}]}>
                  <Text style={s.markerIcon}>{ICON_PIN}</Text>
                </View>
                <Text style={s.markerLabel}>Långt borta</Text>
              </View>
              <Text style={s.arrow}>→</Text>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: '#E6C84A'}]}>
                  <Text style={s.markerIcon}>{ICON_WALK}</Text>
                </View>
                <Text style={s.markerLabel}>Nära</Text>
              </View>
              <Text style={s.arrow}>→</Text>
              <View style={s.markerStep}>
                <View style={[s.markerDot, {backgroundColor: GOLD}]}>
                  <Text style={s.markerIcon}>{ICON_STAR}</Text>
                </View>
                <Text style={[s.markerLabel, {color: GOLD, fontWeight: '700'}]}>På plats!</Text>
              </View>
            </View>
            <Text style={s.cardDesc}>
              Ju närmere du går, desto mer händer.{' '}
              Svara rätt på plats och få{' '}
              <Text style={s.highlight}>3× poäng</Text>
              {' '}— det lönar sig verkligen att röra på benen!
            </Text>
          </View>

          {/* Poäng + tips i en rad */}
          <View style={s.bottomRow}>
            <View style={[s.card, s.pointsCard]}>
              <Text style={s.pointsBig}><Text style={s.pointsGold}>10</Text> p</Text>
              <Text style={s.pointsSmall}>per rätt svar</Text>
              <Text style={s.pointsBig}><Text style={s.pointsGold}>30</Text> p</Text>
              <Text style={s.pointsSmall}>på plats</Text>
            </View>
            <View style={[s.card, s.tipsCard]}>
              <Text style={s.tipsText}>
                Ser du en siffra på kartan? Flera platser ligger nära varandra — zooma in för att se dem separat. Varje plats berättar något nytt om Malmö!
              </Text>
            </View>
          </View>

          {/* CTA */}
          <View style={s.btnRow}>
            <TouchableOpacity style={s.goldBtn} onPress={onStart} activeOpacity={0.85}>
              <View style={s.goldBtnHighlight} />
              <Text style={s.goldBtnText}>Sätt igång! →</Text>
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
      backgroundColor: 'rgba(8,4,0,0.55)',
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
      color: 'rgba(255,255,255,0.55)',
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
      color: 'rgba(255,255,255,0.75)',
      lineHeight: fs(12) * 1.55,
      marginTop: hp(1),
    },
    highlight: {
      color: GOLD,
      fontWeight: '700',
    },

    // Kategorier
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
      color: 'rgba(255,255,255,0.75)',
      fontWeight: '600',
    },

    // Markör-flöde
    markerFlow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
    },
    markerStep: {
      alignItems: 'center',
      gap: hp(0.5),
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
      color: 'rgba(255,255,255,0.65)',
      fontWeight: '600',
    },
    arrow: {
      fontSize: fs(18),
      color: 'rgba(255,255,255,0.35)',
      marginBottom: hp(1.5),
    },

    // Poäng + tips rad
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
    catSub: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.5)',
      textAlign: 'center',
      lineHeight: fs(12) * 1.4,
      marginTop: 2,
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
      color: 'rgba(255,255,255,0.5)',
      marginBottom: hp(0.5),
    },
    tipsText: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.8)',
      lineHeight: fs(12) * 1.6,
      fontStyle: 'italic',
    },

    // Knapp
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
