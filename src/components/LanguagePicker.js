import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { LANGUAGES, t } from '../utils/i18n';

export default function LanguagePicker({ lang, onSelect }) {
  const [visible, setVisible] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <>
      <TouchableOpacity style={styles.btn} onPress={() => setVisible(true)}>
        <Text style={styles.flag}>{current.flag}</Text>
        <Text style={styles.code}>{current.code.toUpperCase()}</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <TouchableOpacity style={styles.overlay} onPress={() => setVisible(false)} activeOpacity={1}>
          <View style={styles.menu}>
            <Text style={styles.menuTitle}>{t(lang, 'language')}</Text>
            {LANGUAGES.map((l) => (
              <TouchableOpacity
                key={l.code}
                style={[styles.menuItem, l.code === lang && styles.menuItemActive]}
                onPress={() => {
                  onSelect(l.code);
                  setVisible(false);
                }}
              >
                <Text style={styles.menuFlag}>{l.flag}</Text>
                <Text style={[styles.menuLabel, l.code === lang && styles.menuLabelActive]}>
                  {l.label}
                </Text>
                {l.code === lang && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    gap: 4,
  },
  flag: { fontSize: 18 },
  code: { fontSize: 13, fontWeight: '700', color: '#003366' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 8,
    minWidth: 160,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  menuTitle: {
    fontSize: 12,
    color: '#aaa',
    textTransform: 'uppercase',
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: '#f0f5ff',
  },
  menuFlag: { fontSize: 20 },
  menuLabel: { fontSize: 15, color: '#333', flex: 1 },
  menuLabelActive: { color: '#003366', fontWeight: '600' },
  checkmark: { color: '#003366', fontWeight: '700' },
});
