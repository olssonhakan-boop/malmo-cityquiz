import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { AppLanguage } from '../types'

type TourItem = {
  id: string
  iconLabel: string
  title: string
  description: string
  solvedQuestions: number
  totalQuestions: number
}

type Props = {
  language: AppLanguage
  selectedTourId: string
  tours: TourItem[]
  onChange: (tourId: string) => void
}

export default function TourPicker({
  selectedTourId,
  tours,
  onChange,
}: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tours.map((tour) => {
        const active = tour.id === selectedTourId
        return (
          <Pressable
            key={tour.id}
            style={[styles.card, active && styles.cardActive]}
            onPress={() => onChange(tour.id)}
          >
            <View style={[styles.iconPill, active && styles.iconPillActive]}>
              <Text style={styles.iconText}>{tour.iconLabel}</Text>
            </View>
            <Text style={styles.title}>{tour.title}</Text>
            <Text style={styles.body}>{tour.description}</Text>
            <Text style={styles.progress}>
              {tour.solvedQuestions}/{tour.totalQuestions}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: 10,
    paddingRight: 4,
  },
  card: {
    width: 210,
    borderRadius: 20,
    backgroundColor: 'rgba(7, 18, 27, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    gap: 8,
  },
  cardActive: {
    borderColor: '#7DD3FC',
    backgroundColor: '#102B3B',
  },
  iconPill: {
    alignSelf: 'flex-start',
    minWidth: 36,
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: '#254E68',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPillActive: {
    backgroundColor: '#0EA5E9',
  },
  iconText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  body: {
    color: '#B7C6D2',
    fontSize: 12,
    lineHeight: 18,
    minHeight: 54,
  },
  progress: {
    color: '#A5F3FC',
    fontSize: 12,
    fontWeight: '700',
  },
})
