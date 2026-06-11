import { useEffect, useMemo, useState } from 'react'
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { AppLanguage, QuizEntry } from '../types'
import { formatDistance, translate } from '../i18n'

type Props = {
  visible: boolean
  language: AppLanguage
  quiz: QuizEntry | null
  completed: boolean
  distanceMeters: number | null
  isUnlocked: boolean
  canForceOpen: boolean
  onRequestClose: () => void
  onForceOpen: () => void
  onCorrectAnswer: (quizId: string) => void | Promise<void>
}

export default function QuizModal({
  visible,
  language,
  quiz,
  completed,
  distanceMeters,
  isUnlocked,
  canForceOpen,
  onRequestClose,
  onForceOpen,
  onCorrectAnswer,
}: Props) {
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle')

  useEffect(() => {
    setFeedback('idle')
  }, [quiz?.id, visible])

  const options = useMemo(() => {
    if (!quiz) {
      return []
    }

    return quiz.options[language]
  }, [language, quiz])

  if (!quiz) {
    return null
  }

  const solved = completed || feedback === 'success'

  const handleAnswer = async (answer: string) => {
    if (answer === quiz.correctAnswer[language]) {
      setFeedback('success')
      await onCorrectAnswer(quiz.id)
      return
    }

    setFeedback('error')
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onRequestClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.grabber} />
            <Text style={styles.title}>{quiz.title[language]}</Text>

            {distanceMeters !== null ? (
              <Text style={styles.meta}>
                {translate('distanceLabel', language)}: {formatDistance(distanceMeters, language)}
              </Text>
            ) : (
              <Text style={styles.meta}>{translate('markerCitywide', language)}</Text>
            )}

            {quiz.imageUri ? (
              <Image source={{ uri: quiz.imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {translate('imageMissing', language)}
                </Text>
              </View>
            )}

            {solved ? (
              <View style={styles.successCard}>
                <Text style={styles.successHeading}>
                  {translate('submitCorrect', language)}
                </Text>
                <Text style={styles.successText}>
                  {translate('successMessage', language)}
                </Text>
                <Text style={styles.correctAnswerText}>
                  {quiz.correctAnswer[language]}
                </Text>
              </View>
            ) : !isUnlocked && canForceOpen ? (
              <View style={styles.infoCard}>
                <Text style={styles.infoHeading}>
                  {translate('forceOpenHeading', language)}
                </Text>
                <Text style={styles.infoText}>
                  {translate('forceOpenBody', language)}
                </Text>
                <Pressable style={styles.primaryButton} onPress={onForceOpen}>
                  <Text style={styles.primaryButtonText}>
                    {translate('forceOpenButton', language)}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.questionBlock}>
                <Text style={styles.questionLabel}>
                  {translate('quizQuestion', language)}
                </Text>
                <Text style={styles.questionText}>{quiz.question[language]}</Text>

                <View style={styles.optionsWrap}>
                  {options.map((option) => (
                    <Pressable
                      key={option}
                      style={styles.optionButton}
                      onPress={() => {
                        void handleAnswer(option)
                      }}
                    >
                      <Text style={styles.optionButtonText}>{option}</Text>
                    </Pressable>
                  ))}
                </View>

                {feedback === 'error' ? (
                  <Text style={styles.errorText}>
                    {translate('submitWrong', language)}
                  </Text>
                ) : null}
              </View>
            )}

            {completed && feedback !== 'success' ? (
              <Text style={styles.meta}>{translate('solvedCard', language)}</Text>
            ) : null}

            <Pressable style={styles.secondaryButton} onPress={onRequestClose}>
              <Text style={styles.secondaryButtonText}>
                {translate('close', language)}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 8, 14, 0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: '#08131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 24,
  },
  content: {
    gap: 14,
  },
  grabber: {
    alignSelf: 'center',
    width: 52,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#365063',
    marginBottom: 4,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
  meta: {
    color: '#A7BBCB',
    fontSize: 13,
    lineHeight: 18,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#122635',
  },
  imagePlaceholder: {
    height: 120,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#365063',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10202D',
  },
  imagePlaceholderText: {
    color: '#A7BBCB',
    fontSize: 13,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#102535',
    borderRadius: 20,
    padding: 16,
    gap: 10,
  },
  infoHeading: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  infoText: {
    color: '#C7D6E2',
    fontSize: 14,
    lineHeight: 21,
  },
  questionBlock: {
    gap: 12,
  },
  questionLabel: {
    color: '#8AC7FF',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  questionText: {
    color: '#F8FAFC',
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
  },
  optionsWrap: {
    gap: 10,
  },
  optionButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#12364C',
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  optionButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  successCard: {
    backgroundColor: '#0F352A',
    borderRadius: 20,
    padding: 16,
    gap: 8,
  },
  successHeading: {
    color: '#E7FFF2',
    fontSize: 20,
    fontWeight: '800',
  },
  successText: {
    color: '#D9FBE8',
    fontSize: 14,
    lineHeight: 20,
  },
  correctAnswerText: {
    color: '#A7F3D0',
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 14,
    fontWeight: '700',
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: '#0EA5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#365063',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
  },
})
