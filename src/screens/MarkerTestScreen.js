import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';

const COMPLETED_ICON = String.fromCodePoint(0xe86c);
const COMPLETED_COLOR = '#2E7D32';
const MARKER_SIZE = 32;
const ICON_SIZE = MARKER_SIZE * 0.55;

const CATEGORIES = [
  {id: 'kultur',     icon: String.fromCodePoint(0xea66), color: '#7B1FA2'},
  {id: 'konst',      icon: String.fromCodePoint(0xe40a), color: '#E91E63'},
  {id: 'personer',   icon: String.fromCodePoint(0xf0d3), color: '#00BCD4'},
  {id: 'mat',        icon: String.fromCodePoint(0xe56c), color: '#FFB300'},
  {id: 'natur',      icon: String.fromCodePoint(0xea63), color: '#2E7D32'},
  {id: 'musik',      icon: String.fromCodePoint(0xe405), color: '#1976D2'},
  {id: 'historia',   icon: String.fromCodePoint(0xeab1), color: '#8D6E63'},
  {id: 'händelser',  icon: String.fromCodePoint(0xebff), color: '#E65100'},
  {id: 'arkitektur', icon: String.fromCodePoint(0xf200), color: '#1565C0'},
  {id: 'kuriosa',    icon: String.fromCodePoint(0xf04c), color: '#F57C00'},
];

function MarkerDot({category, status}) {
  const config =
    status === 'completed'
      ? {icon: COMPLETED_ICON, color: COMPLETED_COLOR}
      : category;

  return (
    <View
      style={{
        width: MARKER_SIZE,
        height: MARKER_SIZE,
        borderRadius: MARKER_SIZE / 2,
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
          fontSize: ICON_SIZE,
          color: '#fff',
          lineHeight: ICON_SIZE * 1.1,
        }}>
        {config.icon}
      </Text>
    </View>
  );
}

export default function MarkerTestScreen() {
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Kartmarkörer — alla kategorier</Text>

      <View style={styles.row}>
        <View style={styles.catCol} />
        <View style={styles.statusCol}><Text style={styles.statusLabel}>Standard</Text></View>
        <View style={styles.statusCol}><Text style={styles.statusLabel}>På plats!</Text></View>
        <View style={styles.statusCol}><Text style={styles.statusLabel}>Avklarad</Text></View>
      </View>

      {CATEGORIES.map(cat => (
        <View key={cat.id} style={styles.row}>
          <View style={styles.catCol}>
            <Text style={styles.catLabel}>{cat.id}</Text>
          </View>
          <View style={styles.statusCol}>
            <MarkerDot category={cat} status="standard" />
          </View>
          <View style={styles.statusCol}>
            <MarkerDot category={cat} status="bonus" />
          </View>
          <View style={styles.statusCol}>
            <MarkerDot category={cat} status="completed" />
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#e8e0d0'},
  content: {padding: 16, paddingTop: 48},
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C1E0F',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  catCol: {width: 90},
  catLabel: {fontSize: 12, fontWeight: '600', color: '#2C1E0F'},
  statusCol: {flex: 1, alignItems: 'center'},
  statusLabel: {fontSize: 10, fontWeight: '700', color: '#555', textAlign: 'center'},
});
