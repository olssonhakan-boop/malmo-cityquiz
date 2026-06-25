import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { t } from '../utils/i18n';

const { width } = Dimensions.get('window');

export default function QuizModal({ visible, question, lang, isOnLocation, onClose, onCorrect }) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  if (!question) return null;

  const options = question.options[lang] || question.options['sv'];
  const correctAnswer = question.correctAnswer[lang] || question.correctAnswer['sv'];
  const questionText = question.question[lang] || question.question['sv'];
  const title = question.title[lang] || question.title['sv'];
  const funFact = question.funFact?.[lang] || question.funFact?.['sv'];

  function handleAnswer(option) {
    if (answered) return;
    setSelected(option);
    setAnswered(true);
  }

  function handleClose() {
    const wasCorrect = selected === correctAnswer;
    setSelected(null);
    setAnswered(false);
    if (wasCorrect) {
      onCorrect(question.id);
    } else {
      onClose();
    }
  }

  const isCorrect = selected === correctAnswer;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.locationTitle}>{title}</Text>
            </View>

            {/* Image */}
            {question.image ? (
              <Image source={{ uri: question.image }} style={styles.image} resizeMode="cover" />
            ) : null}

            {/* GPS bonus badge */}
            {isOnLocation && (
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>{t(lang, 'gpsBonus')}</Text>
              </View>
            )}

            {/* Question */}
            <Text style={styles.question}>{questionText}</Text>

            {/* Answer options */}
            {options.map((option, idx) => {
              let style = styles.optionBtn;
              let textStyle = styles.optionText;
              if (answered) {
                if (option === correctAnswer) {
                  style = [styles.optionBtn, styles.optionCorrect];
                  textStyle = [styles.optionText, styles.optionTextLight];
                } else if (option === selected) {
                  style = [styles.optionBtn, styles.optionWrong];
                  textStyle = [styles.optionText, styles.optionTextLight];
                }
              } else if (option === selected) {
                style = [styles.optionBtn, styles.optionSelected];
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={style}
                  onPress={() => handleAnswer(option)}
                  disabled={answered}
                >
                  <Text style={textStyle}>{option}</Text>
                </TouchableOpacity>
              );
            })}

            {/* Feedback */}
            {answered && (
              <View style={[styles.feedback, isCorrect ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackText}>
                  {isCorrect ? t(lang, 'correct') : t(lang, 'wrong')}
                </Text>
                {!isCorrect && (
                  <Text style={styles.feedbackSub}>
                    {t(lang, 'correctAnswerWas')} {correctAnswer}
                  </Text>
                )}
              </View>
            )}

            {/* Fun fact — shown after answering */}
            {answered && funFact && (
              <View style={styles.funFactBox}>
                <Text style={styles.funFactLabel}>{t(lang, 'funFact')}</Text>
                <Text style={styles.funFactText}>{funFact}</Text>
              </View>
            )}

            {answered && (
              <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeButtonText}>{t(lang, 'close')}</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
    flex: 1,
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    fontSize: 18,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  question: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
    lineHeight: 22,
  },
  optionBtn: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    backgroundColor: '#fafafa',
  },
  optionSelected: {
    borderColor: '#003366',
    backgroundColor: '#e8f0fb',
  },
  optionCorrect: {
    borderColor: '#27ae60',
    backgroundColor: '#27ae60',
  },
  optionWrong: {
    borderColor: '#e74c3c',
    backgroundColor: '#e74c3c',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  optionTextLight: {
    color: '#fff',
    fontWeight: '600',
  },
  feedback: {
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    marginBottom: 12,
  },
  feedbackCorrect: {
    backgroundColor: '#eafaf1',
  },
  feedbackWrong: {
    backgroundColor: '#fdf0f0',
  },
  feedbackText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  feedbackSub: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  funFactBox: {
    backgroundColor: '#fff9e6',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
    padding: 14,
    marginTop: 8,
  },
  funFactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f39c12',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  funFactText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  gpsBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  gpsBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#27ae60',
  },
  closeButton: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
