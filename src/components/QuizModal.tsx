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
import { AppLanguage, QuizLocation } from '../types'
import { buildQuestionProgressId } from '../utils/quizData'
import { formatDistance, translate } from '../i18n'

type Props = {
  visible: boolean
  language: AppLanguage
  location: QuizLocation | null
  completedQuestionIds: string[]
  distanceMeters: number | null
  isUnlocked: boolean
  canForceOpen: boolean
  onRequestClose: () => void
  onForceOpen: () => void
  onCompleteQuestion: (questionProgressId: string) => void | Promise<void>
}

export default function QuizModal({
  visible,
  language,
  location,
  completedQuestionIds,
  distanceMeters,
  isUnlocked,
  canForceOpen,
  onRequestClose,
  onForceOpen,
  onCompleteQuestion,
}: Props) {
  const [feedback, setFeedback] = useState<'idle' | 'success' | 'error'>('idle')
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const unansweredQuestionIndexes = useMemo(() => {
    if (!location) {
      return []
    }

    return location.questions
      .map((question, index) => ({
        index,
        completed: completedQuestionIds.includes(
          buildQuestionProgressId(location.id, question.id)
        ),
      }))
      .filter((entry) => !entry.completed)
      .map((entry) => entry.index)
  }, [completedQuestionIds, location])

  useEffect(() => {
    setFeedback('idle')
    setSelectedOptionId(null)

    if (!location) {
      setCurrentQuestionIndex(0)
      return
    }

    setCurrentQuestionIndex(unansweredQuestionIndexes[0] ?? 0)
  }, [location?.id, unansweredQuestionIndexes, visible])

  if (!location) {
    return null
  }

  const currentQuestion =
    location.questions[currentQuestionIndex] ?? location.questions[0]
  const questionProgressId = buildQuestionProgressId(location.id, currentQuestion.id)
  const locationCompleted = unansweredQuestionIndexes.length === 0
  const solvedCurrentQuestion =
    completedQuestionIds.includes(questionProgressId) || feedback === 'success'
  const currentQuestionNumber = currentQuestionIndex + 1
  const nextUnansweredIndex = unansweredQuestionIndexes.find(
    (index) => index > currentQuestionIndex
  )

  const handleAnswer = async (optionId: string) => {
    setSelectedOptionId(optionId)

    if (optionId === currentQuestion.correctOptionId) {
      setFeedback('success')
      await onCompleteQuestion(questionProgressId)
      return
    }

    setFeedback('error')
  }

  const goToNextQuestion = () => {
    if (typeof nextUnansweredIndex === 'number') {
      setCurrentQuestionIndex(nextUnansweredIndex)
      setFeedback('idle')
      setSelectedOptionId(null)
      return
    }

    onRequestClose()
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
            <Text style={styles.title}>{location.title[language]}</Text>
            <Text style={styles.summary}>{location.summary[language]}</Text>

            {distanceMeters !== null ? (
              <Text style={styles.meta}>
                {translate('distanceLabel', language)}: {formatDistance(distanceMeters, language)}
              </Text>
            ) : (
              <Text style={styles.meta}>{translate('markerCitywide', language)}</Text>
            )}

            {location.imageUri ? (
              <Image source={{ uri: location.imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>
                  {translate('imageMissing', language)}
                </Text>
              </View>
            )}

            {locationCompleted && feedback !== 'success' ? (
              <View style={styles.successCard}>
                <Text style={styles.successHeading}>
                  {translate('completed', language)}
                </Text>
                <Text style={styles.successText}>
                  {translate('locationComplete', language)}
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
            ) : solvedCurrentQuestion ? (
              <View style={styles.successCard}>
                <Text style={styles.successHeading}>
                  {translate('submitCorrect', language)}
                </Text>
                <Text style={styles.successText}>
                  {translate('successMessage', language)}
                </Text>
                <Text style={styles.factLabel}>
                  {translate('didYouKnow', language)}
                </Text>
                <Text style={styles.factText}>{currentQuestion.fact[language]}</Text>
                <Pressable style={styles.primaryButton} onPress={goToNextQuestion}>
                  <Text style={styles.primaryButtonText}>
                    {typeof nextUnansweredIndex === 'number'
                      ? translate('nextQuestion', language)
                      : translate('finishLocation', language)}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.questionBlock}>
                <Text style={styles.questionLabel}>
                  {translate('questionCounter', language)} {currentQuestionNumber}/
                  {location.questions.length}
                </Text>
                <Text style={styles.questionText}>
                  {currentQuestion.prompt[language]}
                </Text>

                <View style={styles.optionsWrap}>
                  {currentQuestion.options.map((option) => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.optionButton,
                        selectedOptionId === option.id &&
                          feedback === 'error' &&
                          styles.optionButtonWrong,
                      ]}
                      onPress={() => {
                        void handleAnswer(option.id)
                      }}
                    >
                      <Text style={styles.optionButtonText}>
                        {option.label[language]}
                      </Text>
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
    maxHeight: '88%',
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
  summary: {
    color: '#C6D4E0',
    fontSize: 14,
    lineHeight: 20,
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
  optionButtonWrong: {
    backgroundColor: '#5B2130',
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
  factLabel: {
    color: '#A7F3D0',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 4,
  },
  factText: {
    color: '#E7FFF2',
    fontSize: 14,
    lineHeight: 21,
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
    marginTop: 4,
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
