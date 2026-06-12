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
import {
  AppLanguage,
  FindDetailQuestion,
  LocationQuestion,
  QuizOption,
  QuizLocation,
  SortOrderQuestion,
} from '../types'
import { buildQuestionProgressId } from '../utils/quizData'
import { resolveQuizImageSource } from '../utils/quizImageAssets'
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

function hashString(value: string) {
  let hash = 0

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }

  return hash
}

function getDeterministicSortItems(question: SortOrderQuestion) {
  return [...question.items].sort((left, right) => {
    const leftHash = hashString(`${question.id}:${left.id}`)
    const rightHash = hashString(`${question.id}:${right.id}`)

    if (leftHash === rightHash) {
      return left.id.localeCompare(right.id)
    }

    return leftHash - rightHash
  })
}

function getQuestionImageSource(
  location: QuizLocation,
  question: LocationQuestion
) {
  return resolveQuizImageSource(
    question.imageAssetId ?? location.imageAssetId,
    question.imageUri ?? location.imageUri
  )
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
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([])
  const [lastTapPoint, setLastTapPoint] = useState<{
    xPercent: number
    yPercent: number
  } | null>(null)
  const [interactiveImageSize, setInteractiveImageSize] = useState({
    width: 0,
    height: 0,
  })

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

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  useEffect(() => {
    setFeedback('idle')
    setSelectedOptionId(null)
    setSelectedOrderIds([])
    setLastTapPoint(null)

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
  const questionProgressId = buildQuestionProgressId(
    location.id,
    currentQuestion.id
  )
  const questionImageSource = getQuestionImageSource(location, currentQuestion)
  const locationCompleted = unansweredQuestionIndexes.length === 0
  const solvedCurrentQuestion =
    completedQuestionIds.includes(questionProgressId) || feedback === 'success'
  const currentQuestionNumber = currentQuestionIndex + 1
  const nextUnansweredIndex = unansweredQuestionIndexes.find(
    (index) => index > currentQuestionIndex
  )

  const handleCorrectAnswer = async () => {
    setFeedback('success')
    await onCompleteQuestion(questionProgressId)
  }

  const handleWrongAnswer = () => {
    setFeedback('error')
  }

  const handleMultipleChoiceAnswer = async (optionId: string) => {
    setSelectedOptionId(optionId)

    if (
      currentQuestion.type === 'multiple-choice' &&
      optionId === currentQuestion.correctOptionId
    ) {
      await handleCorrectAnswer()
      return
    }

    handleWrongAnswer()
  }

  const handleBooleanAnswer = async (value: boolean) => {
    setSelectedOptionId(value ? 'true' : 'false')

    if (
      currentQuestion.type === 'true-false' &&
      value === currentQuestion.correctBoolean
    ) {
      await handleCorrectAnswer()
      return
    }

    handleWrongAnswer()
  }

  const handleAddSortItem = (itemId: string) => {
    setFeedback('idle')
    setSelectedOrderIds((current) =>
      current.includes(itemId) ? current : [...current, itemId]
    )
  }

  const handleUndoSort = () => {
    setFeedback('idle')
    setSelectedOrderIds((current) => current.slice(0, -1))
  }

  const handleClearSort = () => {
    setFeedback('idle')
    setSelectedOrderIds([])
  }

  const handleCheckSortOrder = async () => {
    if (currentQuestion.type !== 'sort-order') {
      return
    }

    const isCorrect =
      selectedOrderIds.length === currentQuestion.correctOrderIds.length &&
      selectedOrderIds.every(
        (itemId, index) => itemId === currentQuestion.correctOrderIds[index]
      )

    if (isCorrect) {
      await handleCorrectAnswer()
      return
    }

    handleWrongAnswer()
  }

  const handleDetailTap = async (question: FindDetailQuestion, x: number, y: number) => {
    if (interactiveImageSize.width <= 0 || interactiveImageSize.height <= 0) {
      return
    }

    const xPercent = (x / interactiveImageSize.width) * 100
    const yPercent = (y / interactiveImageSize.height) * 100
    setLastTapPoint({ xPercent, yPercent })

    const matchingTarget = question.detailTargets.find((target) => {
      const distance = Math.sqrt(
        Math.pow(xPercent - target.xPercent, 2) +
          Math.pow(yPercent - target.yPercent, 2)
      )

      return distance <= target.radiusPercent
    })

    if (matchingTarget?.id === question.correctTargetId) {
      await handleCorrectAnswer()
      return
    }

    handleWrongAnswer()
  }

  const goToNextQuestion = () => {
    if (typeof nextUnansweredIndex === 'number') {
      setCurrentQuestionIndex(nextUnansweredIndex)
      setFeedback('idle')
      setSelectedOptionId(null)
      setSelectedOrderIds([])
      setLastTapPoint(null)
      return
    }

    onRequestClose()
  }

  const renderQuestionMedia = () => {
    if (!questionImageSource) {
      return (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderText}>
            {translate('imageMissing', language)}
          </Text>
        </View>
      )
    }

    if (currentQuestion.type === 'find-detail') {
      return (
        <View
          style={styles.interactiveImageWrap}
          onLayout={(event) => {
            setInteractiveImageSize({
              width: event.nativeEvent.layout.width,
              height: event.nativeEvent.layout.height,
            })
          }}
          onStartShouldSetResponder={() => true}
          onResponderRelease={(event) => {
            void handleDetailTap(
              currentQuestion,
              event.nativeEvent.locationX,
              event.nativeEvent.locationY
            )
          }}
        >
          <Image source={questionImageSource} style={styles.interactiveImage} />
          {lastTapPoint ? (
            <View
              pointerEvents="none"
              style={[
                styles.tapMarker,
                {
                  left: `${lastTapPoint.xPercent}%`,
                  top: `${lastTapPoint.yPercent}%`,
                },
              ]}
            />
          ) : null}
        </View>
      )
    }

    return <Image source={questionImageSource} style={styles.image} />
  }

  const renderMultipleChoiceQuestion = () => {
    if (currentQuestion.type !== 'multiple-choice') {
      return null
    }

    return (
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
              void handleMultipleChoiceAnswer(option.id)
            }}
          >
            <Text style={styles.optionButtonText}>{option.label[language]}</Text>
          </Pressable>
        ))}
      </View>
    )
  }

  const renderTrueFalseQuestion = () => {
    if (currentQuestion.type !== 'true-false') {
      return null
    }

    return (
      <View style={styles.optionsWrap}>
        <Pressable
          style={[
            styles.optionButton,
            selectedOptionId === 'true' &&
              feedback === 'error' &&
              styles.optionButtonWrong,
          ]}
          onPress={() => {
            void handleBooleanAnswer(true)
          }}
        >
          <Text style={styles.optionButtonText}>
            {translate('trueLabel', language)}
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.optionButton,
            selectedOptionId === 'false' &&
              feedback === 'error' &&
              styles.optionButtonWrong,
          ]}
          onPress={() => {
            void handleBooleanAnswer(false)
          }}
        >
          <Text style={styles.optionButtonText}>
            {translate('falseLabel', language)}
          </Text>
        </Pressable>
      </View>
    )
  }

  const renderSortOrderQuestion = () => {
    if (currentQuestion.type !== 'sort-order') {
      return null
    }

    const sortedItems = getDeterministicSortItems(currentQuestion)
    const selectedItems = currentQuestion.correctOrderIds
      .map((itemId) => currentQuestion.items.find((item) => item.id === itemId))
      .filter((item): item is QuizOption => Boolean(item))
    const chosenItems = selectedOrderIds
      .map((itemId) => currentQuestion.items.find((item) => item.id === itemId))
      .filter((item): item is QuizOption => Boolean(item))
    const availableItems = sortedItems.filter(
      (item) => !selectedOrderIds.includes(item.id)
    )

    return (
      <View style={styles.sortWrap}>
        <View style={styles.sortSequenceCard}>
          <Text style={styles.sortHeading}>
            {translate('selectedOrder', language)}
          </Text>
          {chosenItems.length > 0 ? (
            <View style={styles.sortSequenceWrap}>
              {chosenItems.map((item, index) => (
                <View key={item.id} style={styles.sortSequenceItem}>
                  <Text style={styles.sortSequenceIndex}>{index + 1}</Text>
                  <Text style={styles.sortSequenceText}>
                    {item.label[language]}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.sortPlaceholder}>
              {translate('sortPlaceholder', language)}
            </Text>
          )}
        </View>

        <View style={styles.sortActionRow}>
          <Pressable style={styles.inlineActionButton} onPress={handleUndoSort}>
            <Text style={styles.inlineActionButtonText}>
              {translate('sortUndo', language)}
            </Text>
          </Pressable>
          <Pressable style={styles.inlineActionButton} onPress={handleClearSort}>
            <Text style={styles.inlineActionButtonText}>
              {translate('sortClear', language)}
            </Text>
          </Pressable>
        </View>

        <View style={styles.optionsWrap}>
          {availableItems.map((item) => (
            <Pressable
              key={item.id}
              style={styles.optionButton}
              onPress={() => handleAddSortItem(item.id)}
            >
              <Text style={styles.optionButtonText}>{item.label[language]}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            selectedOrderIds.length !== selectedItems.length &&
              styles.primaryButtonDisabled,
          ]}
          onPress={() => {
            void handleCheckSortOrder()
          }}
          disabled={selectedOrderIds.length !== selectedItems.length}
        >
          <Text style={styles.primaryButtonText}>
            {translate('checkOrder', language)}
          </Text>
        </Pressable>
      </View>
    )
  }

  const renderFindDetailQuestion = () => {
    if (currentQuestion.type !== 'find-detail') {
      return null
    }

    return (
      <View style={styles.findDetailWrap}>
        <Text style={styles.findDetailHint}>
          {translate('findDetailHint', language)}
        </Text>
      </View>
    )
  }

  const renderQuestionInteraction = () => {
    if (currentQuestion.type === 'multiple-choice') {
      return renderMultipleChoiceQuestion()
    }

    if (currentQuestion.type === 'true-false') {
      return renderTrueFalseQuestion()
    }

    if (currentQuestion.type === 'sort-order') {
      return renderSortOrderQuestion()
    }

    return renderFindDetailQuestion()
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
                {translate('distanceLabel', language)}:{' '}
                {formatDistance(distanceMeters, language)}
              </Text>
            ) : (
              <Text style={styles.meta}>
                {translate('markerCitywide', language)}
              </Text>
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
                <Text style={styles.factText}>
                  {currentQuestion.fact[language]}
                </Text>
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
                <Text style={styles.instructionText}>
                  {currentQuestion.instruction[language]}
                </Text>

                {renderQuestionMedia()}
                {renderQuestionInteraction()}

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
  interactiveImageWrap: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#122635',
  },
  interactiveImage: {
    width: '100%',
    height: '100%',
  },
  tapMarker: {
    position: 'absolute',
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#F8FAFC',
    backgroundColor: 'rgba(14,165,233,0.28)',
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
  instructionText: {
    color: '#A7BBCB',
    fontSize: 13,
    lineHeight: 19,
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
  sortWrap: {
    gap: 12,
  },
  sortSequenceCard: {
    backgroundColor: '#102535',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  sortHeading: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sortSequenceWrap: {
    gap: 8,
  },
  sortSequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sortSequenceIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    textAlign: 'center',
    textAlignVertical: 'center',
    lineHeight: 24,
    color: '#0B1722',
    backgroundColor: '#F8FAFC',
    fontSize: 12,
    fontWeight: '800',
  },
  sortSequenceText: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  sortPlaceholder: {
    color: '#A7BBCB',
    fontSize: 13,
    lineHeight: 18,
  },
  sortActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inlineActionButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#365063',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  inlineActionButtonText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '700',
  },
  findDetailWrap: {
    gap: 6,
  },
  findDetailHint: {
    color: '#B7C6D2',
    fontSize: 13,
    lineHeight: 18,
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
    paddingHorizontal: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
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
