import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {t} from '../utils/i18n';
import {playClick} from '../utils/sound';

const GOLD  = '#C8A840';
const DARK  = '#2C1E0F';
const MUTED = 'rgba(255,255,255,0.55)';

const LANGS = [
  {code: 'sv', label: 'Svenska'},
  {code: 'en', label: 'English'},
  {code: 'de', label: 'Deutsch'},
];

export default function SettingsModal({
  visible,
  onClose,
  lang,
  onLangChange,
  soundEnabled,
  onToggleSound,
  hapticEnabled,
  onToggleHaptic,
}) {
  const {width, height} = useWindowDimensions();
  const s = makeStyles(width, height);

  function handleResetProgress() {
    Alert.alert(
      t(lang, 'settingsResetTitle'),
      t(lang, 'settingsResetConfirm'),
      [
        {text: t(lang, 'cancel'), style: 'cancel'},
        {
          text: t(lang, 'settingsResetBtn'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'malmo_progress',
              'malmo_score',
              'malmo-cityquiz-completed-question-ids',
              'malmo-cityquiz-completed-ids',
            ]);
            onClose();
          },
        },
      ],
    );
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>

          {/* Header */}
          <View style={s.header}>
            <Text style={s.title}>{t(lang, 'settingsTitle')}</Text>
            <TouchableOpacity
              onPress={() => { playClick(soundEnabled); onClose(); }}
              hitSlop={{top: 12, right: 12, bottom: 12, left: 12}}>
              <Text style={s.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Språk */}
          <Text style={s.sectionLabel}>{t(lang, 'settingsLanguage')}</Text>
          <View style={s.langRow}>
            {LANGS.map(l => (
              <TouchableOpacity
                key={l.code}
                style={[s.langBtn, lang === l.code && s.langBtnActive]}
                onPress={() => { playClick(soundEnabled); onLangChange(l.code); }}
                activeOpacity={0.8}>
                <Text style={[s.langBtnText, lang === l.code && s.langBtnTextActive]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.divider} />

          {/* Ljud */}
          <TouchableOpacity
            style={s.row}
            onPress={() => { playClick(soundEnabled); onToggleSound(); }}
            activeOpacity={0.8}>
            <Text style={s.rowIcon}>{String.fromCodePoint(0xe050)}</Text>
            <Text style={s.rowLabel}>{t(lang, 'settingsSound')}</Text>
            <View style={[s.toggle, soundEnabled && s.toggleOn]}>
              <View style={[s.toggleKnob, soundEnabled && s.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          {/* Haptik */}
          <TouchableOpacity
            style={s.row}
            onPress={() => { playClick(soundEnabled); onToggleHaptic(); }}
            activeOpacity={0.8}>
            <Text style={s.rowIcon}>{String.fromCodePoint(0xe544)}</Text>
            <Text style={s.rowLabel}>{t(lang, 'settingsHaptic')}</Text>
            <View style={[s.toggle, hapticEnabled && s.toggleOn]}>
              <View style={[s.toggleKnob, hapticEnabled && s.toggleKnobOn]} />
            </View>
          </TouchableOpacity>

          <View style={s.divider} />

          {/* Återställ progress */}
          <TouchableOpacity style={s.resetBtn} onPress={handleResetProgress} activeOpacity={0.8}>
            <Text style={s.resetIcon}>{String.fromCodePoint(0xe863)}</Text>
            <Text style={s.resetText}>{t(lang, 'settingsReset')}</Text>
          </TouchableOpacity>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function makeStyles(width, height) {
  const wp = pct => width * (pct / 100);
  const hp = pct => height * (pct / 100);
  const fs = size => Math.round(size * (width / 390));

  const TOGGLE_W = wp(12);
  const TOGGLE_H = hp(3.4);
  const KNOB_SIZE = wp(5.5);

  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: wp(6),
    },
    sheet: {
      backgroundColor: '#1A1008',
      borderRadius: wp(5),
      padding: wp(6),
      width: '100%',
      borderWidth: 1.5,
      borderColor: 'rgba(200,168,64,0.3)',
      elevation: 20,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: hp(2.5),
    },
    title: {
      fontSize: fs(18),
      fontWeight: '800',
      color: '#fff',
      letterSpacing: -0.2,
    },
    closeBtn: {
      fontSize: fs(16),
      color: MUTED,
      fontWeight: '400',
    },

    sectionLabel: {
      fontSize: fs(12),
      fontWeight: '700',
      color: MUTED,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: hp(1.2),
    },
    langRow: {
      flexDirection: 'row',
      gap: wp(2),
      marginBottom: hp(2.5),
    },
    langBtn: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: 'rgba(255,255,255,0.2)',
      borderRadius: wp(2.5),
      paddingVertical: hp(1.2),
      alignItems: 'center',
    },
    langBtnActive: {
      borderColor: GOLD,
      backgroundColor: 'rgba(200,168,64,0.15)',
    },
    langBtnText: {
      fontSize: fs(13),
      fontWeight: '600',
      color: MUTED,
    },
    langBtnTextActive: {
      color: GOLD,
      fontWeight: '800',
    },

    divider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.08)',
      marginVertical: hp(2),
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: hp(1.5),
      gap: wp(3),
    },
    rowIcon: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(22),
      color: GOLD,
      width: wp(7),
    },
    rowLabel: {
      flex: 1,
      fontSize: fs(15),
      fontWeight: '600',
      color: '#fff',
    },
    toggle: {
      width: TOGGLE_W,
      height: TOGGLE_H,
      borderRadius: TOGGLE_H / 2,
      backgroundColor: 'rgba(255,255,255,0.15)',
      justifyContent: 'center',
      paddingHorizontal: wp(0.75),
    },
    toggleOn: {
      backgroundColor: GOLD,
    },
    toggleKnob: {
      width: KNOB_SIZE,
      height: KNOB_SIZE,
      borderRadius: KNOB_SIZE / 2,
      backgroundColor: 'rgba(255,255,255,0.5)',
    },
    toggleKnobOn: {
      backgroundColor: DARK,
      alignSelf: 'flex-end',
    },

    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: wp(3),
      paddingVertical: hp(1.5),
    },
    resetIcon: {
      fontFamily: 'MaterialSymbolsOutlined',
      fontSize: fs(22),
      color: '#E74C3C',
      width: wp(7),
    },
    resetText: {
      fontSize: fs(15),
      fontWeight: '600',
      color: '#E74C3C',
    },
  });
}
