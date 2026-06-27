import { StyleSheet, Text, View } from 'react-native'
import { AppLanguage } from '../types'
import { translate } from '../i18n'

type Props = {
  language: AppLanguage
}

function LegendPill({
  color,
  label,
}: {
  color: string
  label: string
}) {
  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  )
}

export default function MapLegend({ language }: Props) {
  return (
    <View style={styles.card}>
      <LegendPill color="#d64545" label={translate('markerLocked', language)} />
      <LegendPill color="#f59e0b" label={translate('markerNearby', language)} />
      <LegendPill color="#2563eb" label={translate('markerUnlocked', language)} />
      <LegendPill color="#16a34a" label={translate('markerCompleted', language)} />
      <LegendPill color="#7c3aed" label={translate('markerCitywide', language)} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: 'rgba(7, 18, 27, 0.92)',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: '#102433',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
})
