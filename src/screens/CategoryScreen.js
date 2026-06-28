import React, {useState} from 'react';
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

const BG_IMAGE = require('../assets/category.jpg');

const CATEGORIES = [
  {id: 'kandisar', labelKey: 'catKandisar', image: require('../assets/kandisar.jpg')},
  {id: 'historia', labelKey: 'catHistoria', image: require('../assets/historia.jpg')},
  {id: 'platser',  labelKey: 'catPlatser',  image: require('../assets/platser.jpg')},
];

const GOLD = '#C8A840';
const CARD_BG = 'rgba(44,30,15,0.78)';

export default function CategoryScreen({lang, onStart}) {
  const {width, height} = useWindowDimensions();
  const s = makeStyles(width, height);

  const [selected, setSelected] = useState([]);

  function toggle(id) {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id],
    );
  }

  function handleStart() {
    onStart({
      mode: 'map',
      categories: selected.length > 0 ? selected : CATEGORIES.map(c => c.id),
    });
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={BG_IMAGE} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />
        <SafeAreaView style={s.safe}>

          <Text style={s.title}>{t(lang, 'categoryTitle')}</Text>
          <Text style={s.hint}>{t(lang, 'categoryHint')}</Text>

          <View style={s.grid}>
            {CATEGORIES.map(cat => {
              const isSel = selected.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[s.card, isSel && s.cardSelected]}
                  onPress={() => toggle(cat.id)}
                  activeOpacity={0.85}>
                  <ImageBackground
                    source={cat.image}
                    style={s.cardBg}
                    resizeMode="cover"
                    imageStyle={s.cardImage}>
                    <View style={s.cardDimOverlay} />
                    <View style={s.cardContent}>
                      <View style={s.labelBadge}>
                        <Text style={s.cardLabel}>{t(lang, cat.labelKey)}</Text>
                      </View>
                    </View>
                    {/* Cirkel uppe till höger: tom ram om ej vald, ifylld med bock om vald */}
                    <View style={[s.checkBadge, isSel && s.checkBadgeSel]}>
                      {isSel && <Text style={s.checkIcon}>✓</Text>}
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.btnRow}>
            <TouchableOpacity style={s.goldBtn} onPress={handleStart} activeOpacity={0.85}>
              <View style={s.goldBtnHighlight} />
              <Text style={s.goldBtnText}>{t(lang, 'selectStartBtn')}</Text>
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

  const CARD_H = hp(18);

  return StyleSheet.create({
    root: {flex: 1},
    bg: {flex: 1},
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8,4,0,0.50)',
    },
    safe: {flex: 1, paddingHorizontal: wp(5)},

    title: {
      fontSize: fs(22),
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginTop: hp(11),
      marginBottom: hp(0.5),
    },
    hint: {
      fontSize: fs(13),
      color: 'rgba(255,255,255,0.6)',
      textAlign: 'center',
      marginBottom: hp(3),
    },

    grid: {
      gap: hp(2),
    },

    card: {
      height: CARD_H,
      borderRadius: wp(3),
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
      elevation: 6,
    },
    cardSelected: {
      borderColor: GOLD,
    },
    cardBg: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    cardImage: {
      borderRadius: wp(3),
    },
    cardDimOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cardContent: {
      padding: wp(3),
    },
    labelBadge: {
      backgroundColor: CARD_BG,
      alignSelf: 'flex-start',
      borderRadius: wp(2),
      paddingVertical: 4,
      paddingHorizontal: wp(3),
    },
    cardLabel: {
      fontSize: fs(15),
      fontWeight: '800',
      color: '#fff',
    },
    checkBadge: {
      position: 'absolute',
      top: wp(2.5),
      right: wp(2.5),
      width: wp(7),
      height: wp(7),
      borderRadius: wp(3.5),
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkBadgeSel: {
      backgroundColor: GOLD,
      borderColor: GOLD,
    },
    checkIcon: {
      fontSize: fs(14),
      fontWeight: '900',
      color: '#1a0f00',
    },

    btnRow: {
      alignItems: 'center',
      marginTop: hp(4),
    },
    goldBtn: {
      backgroundColor: GOLD,
      borderRadius: 50,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(10),
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
