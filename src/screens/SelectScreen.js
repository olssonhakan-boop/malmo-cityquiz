import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ImageBackground,
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
} from 'react-native';
import {t, categoryLabel} from '../utils/i18n';
import {useCategories} from '../hooks/useCategories';

const BG_IMAGE = require('../assets/category.jpg');

const ICON_MAP  = String.fromCodePoint(0xe55b); // map
const ICON_SOFA = String.fromCodePoint(0xe16b); // weekend

const ALL_CATEGORIES = [
  'historia', 'kultur', 'arkitektur', 'kuriosa',
  'konst', 'personer', 'mat', 'natur', 'musik', 'händelser',
];

const CARD_BG = 'rgba(44,30,15,0.78)';
const GOLD    = '#C8A840';

export default function SelectScreen({lang, onStart}) {
  const {width, height} = useWindowDimensions();
  const s = makeStyles(width, height);
  const {getCategoryConfig} = useCategories();

  const [showCats, setShowCats] = useState(false);
  const [selectedCats, setSelectedCats] = useState([]);

  function toggleCategory(cat) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    );
  }

  function toggleAll() {
    setSelectedCats(prev =>
      prev.length === ALL_CATEGORIES.length ? [] : [...ALL_CATEGORIES],
    );
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <ImageBackground source={BG_IMAGE} style={s.bg} resizeMode="cover">
        <View style={s.overlay} />
        <SafeAreaView style={s.safe}>
          <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

            <Text style={s.title}>{t(lang, 'selectTitle')}</Text>

            {/* --- Kort 1: Quiz på stan --- */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.icon}>{ICON_MAP}</Text>
                <View style={s.cardTexts}>
                  <Text style={s.cardTitle}>{t(lang, 'mode1Title')}</Text>
                  <Text style={s.cardSub}>{t(lang, 'mode1Sub')}</Text>
                </View>
              </View>
              <Text style={s.cardDesc}>{t(lang, 'mode1Desc')}</Text>

              <TouchableOpacity
                style={s.goldBtn}
                onPress={() => onStart({mode: 'map', categories: []})}
                activeOpacity={0.85}>
                <Text style={s.goldBtnText}>{t(lang, 'mode1Btn')}</Text>
                <Text style={s.goldBtnArrow}>→</Text>
              </TouchableOpacity>
            </View>

            {/* --- Kort 2: Quiz i soffan --- */}
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.icon}>{ICON_SOFA}</Text>
                <View style={s.cardTexts}>
                  <Text style={s.cardTitle}>{t(lang, 'mode2Title')}</Text>
                  <Text style={s.cardSub}>{t(lang, 'mode2Sub')}</Text>
                </View>
              </View>
              <Text style={s.cardDesc}>{t(lang, 'mode2Desc')}</Text>
              <TouchableOpacity
                style={s.goldBtn}
                onPress={() => onStart({mode: 'sofa', categories: []})}
                activeOpacity={0.85}>
                <Text style={s.goldBtnText}>{t(lang, 'mode2Btn')}</Text>
                <Text style={s.goldBtnArrow}>→</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

function makeStyles(width, height) {
  const wp = pct => width * (pct / 100);
  const hp = pct => height * (pct / 100);
  const fs = size => Math.round(size * (width / 390));
  const pad = wp(5);

  return StyleSheet.create({
    root: {flex: 1},
    bg: {flex: 1},
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(8,4,0,0.45)',
    },
    safe: {flex: 1},
    scroll: {
      paddingHorizontal: pad,
      paddingTop: hp(11),
      paddingBottom: hp(6),
    },

    title: {
      fontSize: fs(24),
      fontWeight: '800',
      color: '#fff',
      textAlign: 'center',
      marginBottom: hp(6),
      letterSpacing: 0.2,
    },

    card: {
      backgroundColor: CARD_BG,
      borderRadius: wp(4),
      padding: wp(5),
      marginBottom: hp(8),
      elevation: 8,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      marginBottom: hp(1),
    },
    icon: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(32),
      color: GOLD,
    },
    cardTexts: {flex: 1},
    cardTitle: {
      fontSize: fs(18),
      fontWeight: '800',
      color: '#fff',
    },
    cardSub: {
      fontSize: fs(13),
      color: 'rgba(255,255,255,0.65)',
      marginTop: 2,
    },
    cardDesc: {
      fontSize: fs(14),
      color: 'rgba(255,255,255,0.8)',
      lineHeight: fs(14) * 1.6,
      marginBottom: hp(2),
      paddingLeft: wp(11),
    },

    // Guldknapp
    goldBtn: {
      backgroundColor: GOLD,
      borderRadius: 50,
      paddingVertical: hp(1.6),
      paddingHorizontal: wp(6),
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: wp(2),
      elevation: 4,
    },
    goldBtnText: {
      fontSize: fs(15),
      fontWeight: '700',
      color: '#1a0f00',
      letterSpacing: 0.3,
    },
    goldBtnArrow: {
      fontSize: fs(18),
      fontWeight: '700',
      color: '#1a0f00',
    },

    // Kategorier
    catSection: {
      marginTop: hp(0.5),
    },
    catHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(1.2),
    },
    catTitle: {
      fontSize: fs(12),
      fontWeight: '700',
      color: 'rgba(255,255,255,0.6)',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    catToggle: {
      fontSize: fs(13),
      color: GOLD,
      fontWeight: '600',
    },
    catGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: wp(2),
      marginBottom: hp(2),
    },
    catChip: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderRadius: 20,
      paddingVertical: hp(0.6),
      paddingHorizontal: wp(3),
      gap: wp(1.5),
    },
    catChipIcon: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(14),
      color: 'rgba(255,255,255,0.8)',
    },
    catChipLabel: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.8)',
      fontWeight: '500',
    },
    catChipLabelSel: {color: '#fff', fontWeight: '700'},
    catHint: {
      fontSize: fs(12),
      color: 'rgba(255,255,255,0.45)',
      marginBottom: hp(1.5),
      textAlign: 'center',
      fontStyle: 'italic',
    },
  });
}
