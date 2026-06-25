import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { t } from '../utils/i18n';

export default function FreeQuestionsPanel({ questions, lang, completed, onSelect }) {
  const [visible, setVisible] = useState(false);

  const pending = questions.filter((q) => !completed.has(q.id));
  const done = questions.filter((q) => completed.has(q.id));

  return (
    <>
      {/* Floating button on map */}
      <TouchableOpacity style={styles.fab} onPress={() => setVisible(true)}>
        <Text style={styles.fabIcon}>🏛️</Text>
        <Text style={styles.fabLabel}>{t(lang, 'freeQuestions')}</Text>
        {pending.length > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pending.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.panel}>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{t(lang, 'freeQuestions')}</Text>
                <Text style={styles.subtitle}>{t(lang, 'freeQuestionsSubtitle')}</Text>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={[...pending, ...done]}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isDone = completed.has(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.item, isDone && styles.itemDone]}
                    onPress={() => {
                      setVisible(false);
                      onSelect(item);
                    }}
                    disabled={isDone}
                  >
                    <Text style={styles.itemIcon}>{isDone ? '✅' : '❓'}</Text>
                    <Text style={[styles.itemTitle, isDone && styles.itemTitleDone]}>
                      {item.title[lang] || item.title['sv']}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.empty}>{t(lang, 'noQuestions')}</Text>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: '#003366',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 80,
  },
  fabIcon: {
    fontSize: 22,
  },
  fabLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  closeBtn: { padding: 6 },
  closeBtnText: { fontSize: 18, color: '#666' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemDone: {
    opacity: 0.5,
  },
  itemIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  itemTitle: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  itemTitleDone: {
    textDecorationLine: 'line-through',
    color: '#aaa',
  },
  empty: {
    textAlign: 'center',
    color: '#aaa',
    marginTop: 20,
  },
});
