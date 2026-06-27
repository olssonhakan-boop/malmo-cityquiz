import React, {useState, useEffect, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {t} from '../utils/i18n';
import {makeProgressId} from '../hooks/useLocations';

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function shuffledItems(questionId, items) {
  return [...items].sort((a, b) => {
    const ha = hashString(`${questionId}:${a.id}`);
    const hb = hashString(`${questionId}:${b.id}`);
    return ha === hb ? a.id.localeCompare(b.id) : ha - hb;
  });
}

function loc(obj, lang) {
  if (!obj) return '';
  return obj[lang] || obj.sv || '';
}

// ─── Multiple choice ──────────────────────────────────────────────────────────
function MultipleChoice({question, lang, onCorrect, onWrong}) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  function handlePress(optionId) {
    if (answered) return;
    setSelected(optionId);
    setAnswered(true);
    if (optionId === question.correctOptionId) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  const correctLabel = loc(
    question.options.find(o => o.id === question.correctOptionId)?.label,
    lang,
  );

  return (
    <>
      {question.options.map(opt => {
        const isCorrect = opt.id === question.correctOptionId;
        const isSelected = opt.id === selected;
        let style = styles.optionBtn;
        let textStyle = styles.optionText;
        if (answered) {
          if (isCorrect) {
            style = [styles.optionBtn, styles.optionCorrect];
            textStyle = [styles.optionText, styles.optionTextLight];
          } else if (isSelected) {
            style = [styles.optionBtn, styles.optionWrong];
            textStyle = [styles.optionText, styles.optionTextLight];
          }
        } else if (isSelected) {
          style = [styles.optionBtn, styles.optionSelected];
        }
        return (
          <TouchableOpacity
            key={opt.id}
            style={style}
            onPress={() => handlePress(opt.id)}
            disabled={answered}>
            <Text style={textStyle}>{loc(opt.label, lang)}</Text>
          </TouchableOpacity>
        );
      })}
      {answered && selected !== question.correctOptionId && (
        <Text style={styles.wrongHint}>
          {t(lang, 'correctAnswerWas')} {correctLabel}
        </Text>
      )}
    </>
  );
}

// ─── True / False ─────────────────────────────────────────────────────────────
function TrueFalse({question, lang, onCorrect, onWrong}) {
  const [selected, setSelected] = useState(null);
  const [answered, setAnswered] = useState(false);

  function handlePress(value) {
    if (answered) return;
    setSelected(value);
    setAnswered(true);
    if (value === question.correctBoolean) {
      onCorrect();
    } else {
      onWrong();
    }
  }

  function btnStyle(value) {
    if (!answered) return selected === value ? styles.tfSelected : styles.tfBtn;
    if (value === question.correctBoolean) return [styles.tfBtn, styles.optionCorrect];
    if (value === selected) return [styles.tfBtn, styles.optionWrong];
    return styles.tfBtn;
  }

  function txtStyle(value) {
    if (answered && (value === question.correctBoolean || value === selected)) {
      return [styles.tfText, styles.optionTextLight];
    }
    return styles.tfText;
  }

  return (
    <View style={styles.tfRow}>
      <TouchableOpacity style={[btnStyle(true), {flex: 1, marginRight: 8}]} onPress={() => handlePress(true)} disabled={answered}>
        <Text style={txtStyle(true)}>{t(lang, 'trueFalseTrue')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[btnStyle(false), {flex: 1, marginLeft: 8}]} onPress={() => handlePress(false)} disabled={answered}>
        <Text style={txtStyle(false)}>{t(lang, 'trueFalseFalse')}</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Sort order ───────────────────────────────────────────────────────────────
function SortOrder({question, lang, onCorrect, onWrong}) {
  const shuffled = useMemo(
    () => shuffledItems(question.id, question.items),
    [question.id, question.items],
  );
  const [picked, setPicked] = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  function handlePick(itemId) {
    if (confirmed || picked.includes(itemId)) return;
    const next = [...picked, itemId];
    setPicked(next);
    if (next.length === question.items.length) {
      setConfirmed(true);
      const correct = next.every((id, i) => id === question.correctOrderIds[i]);
      if (correct) onCorrect();
      else onWrong();
    }
  }

  function itemStyle(itemId) {
    const idx = picked.indexOf(itemId);
    if (!confirmed) return idx >= 0 ? styles.sortPicked : styles.sortBtn;
    const correct = question.correctOrderIds[idx] === itemId;
    return [styles.sortBtn, correct ? styles.optionCorrect : styles.optionWrong];
  }

  function itemTextStyle(itemId) {
    const idx = picked.indexOf(itemId);
    if (confirmed) return [styles.optionText, styles.optionTextLight];
    if (idx >= 0) return [styles.optionText, {color: '#003366', fontWeight: '700'}];
    return styles.optionText;
  }

  return (
    <>
      <Text style={styles.sortHint}>{t(lang, 'sortOrderHint')}</Text>
      {shuffled.map((item, i) => {
        const idx = picked.indexOf(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={itemStyle(item.id)}
            onPress={() => handlePick(item.id)}
            disabled={idx >= 0 || confirmed}>
            <View style={styles.sortNumber}>
              <Text style={styles.sortNumberText}>{idx >= 0 ? idx + 1 : i + 1}</Text>
            </View>
            <Text style={itemTextStyle(item.id)}>{loc(item.label, lang)}</Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────
export default function QuizModal({
  visible,
  location,
  lang,
  completedIds,
  isOnLocation,
  onClose,
  onCompleteQuestion,
}) {
  const [qIndex, setQIndex] = useState(0);
  const [feedback, setFeedback] = useState('idle'); // 'idle' | 'correct' | 'wrong'
  const [key, setKey] = useState(0); // force re-mount of question component

  const unanswered = useMemo(() => {
    if (!location) return [];
    return location.questions
      .map((q, i) => i)
      .filter(i => !completedIds.has(makeProgressId(location.id, location.questions[i].id)));
  }, [location, completedIds]);

  useEffect(() => {
    if (!visible || !location) return;
    const first = unanswered[0] ?? 0;
    setQIndex(first);
    setFeedback('idle');
    setKey(k => k + 1);
  }, [visible, location?.id]);

  if (!location) return null;

  const question = location.questions[qIndex];
  if (!question) return null;

  const progressId = makeProgressId(location.id, question.id);
  const totalQ = location.questions.length;
  const doneCount = totalQ - unanswered.length;
  const allDone = unanswered.length === 0 || (feedback === 'correct' && unanswered.length === 1);

  function handleCorrect() {
    setFeedback('correct');
    onCompleteQuestion(progressId);
  }

  function handleWrong() {
    setFeedback('wrong');
  }

  function handleNext() {
    const nextIdx = unanswered.find(i => i > qIndex) ?? unanswered[0];
    if (nextIdx !== undefined && nextIdx !== qIndex) {
      setQIndex(nextIdx);
      setFeedback('idle');
      setKey(k => k + 1);
    } else {
      onClose();
    }
  }

  const questionText = loc(question.prompt, lang);
  const fact = loc(question.fact, lang);
  const title = loc(location.title, lang);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.locationTitle} numberOfLines={2}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Progress */}
            <View style={styles.progressRow}>
              <Text style={styles.progressText}>
                {t(lang, 'questionOf')
                  .replace('{n}', qIndex + 1)
                  .replace('{total}', totalQ)}
              </Text>
              <View style={styles.progressBar}>
                {location.questions.map((q, i) => (
                  <View
                    key={q.id}
                    style={[
                      styles.progressDot,
                      completedIds.has(makeProgressId(location.id, q.id))
                        ? styles.progressDotDone
                        : i === qIndex
                        ? styles.progressDotActive
                        : styles.progressDotEmpty,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* GPS bonus badge */}
            {isOnLocation && (
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeText}>{t(lang, 'gpsBonus')}</Text>
              </View>
            )}

            {/* Type badge */}
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {question.type === 'multiple-choice' && t(lang, 'typeMultipleChoice')}
                {question.type === 'true-false' && t(lang, 'typeTrueFalse')}
                {question.type === 'sort-order' && t(lang, 'typeSortOrder')}
                {question.type === 'find-detail' && t(lang, 'typeFindDetail')}
              </Text>
            </View>

            {/* Question text */}
            <Text style={styles.question}>{questionText}</Text>

            {/* Question type UI */}
            {feedback === 'idle' || question.type === 'multiple-choice' || question.type === 'true-false' || question.type === 'sort-order' ? (
              <View key={key}>
                {question.type === 'multiple-choice' && (
                  <MultipleChoice
                    question={question}
                    lang={lang}
                    onCorrect={handleCorrect}
                    onWrong={handleWrong}
                  />
                )}
                {question.type === 'true-false' && (
                  <TrueFalse
                    question={question}
                    lang={lang}
                    onCorrect={handleCorrect}
                    onWrong={handleWrong}
                  />
                )}
                {question.type === 'sort-order' && (
                  <SortOrder
                    question={question}
                    lang={lang}
                    onCorrect={handleCorrect}
                    onWrong={handleWrong}
                  />
                )}
                {question.type === 'find-detail' && (
                  <Text style={styles.unsupported}>{t(lang, 'findDetailUnsupported')}</Text>
                )}
              </View>
            ) : null}

            {/* Feedback */}
            {feedback !== 'idle' && (
              <View style={[styles.feedback, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackText}>
                  {feedback === 'correct' ? t(lang, 'correct') : t(lang, 'wrong')}
                </Text>
              </View>
            )}

            {/* Fun fact */}
            {feedback !== 'idle' && fact ? (
              <View style={styles.funFactBox}>
                <Text style={styles.funFactLabel}>{t(lang, 'funFact')}</Text>
                <Text style={styles.funFactText}>{fact}</Text>
              </View>
            ) : null}

            {/* Action button */}
            {feedback !== 'idle' && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={allDone ? onClose : handleNext}>
                <Text style={styles.actionBtnText}>
                  {allDone ? t(lang, 'locationComplete') : t(lang, 'nextQuestion')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{height: 24}} />
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
    maxHeight: '88%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#003366',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {padding: 4},
  closeBtnText: {fontSize: 18, color: '#666'},
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  progressText: {fontSize: 12, color: '#888'},
  progressBar: {flexDirection: 'row', gap: 4},
  progressDot: {width: 10, height: 10, borderRadius: 5},
  progressDotDone: {backgroundColor: '#27ae60'},
  progressDotActive: {backgroundColor: '#003366'},
  progressDotEmpty: {backgroundColor: '#ddd'},
  gpsBadge: {
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#27ae60',
  },
  gpsBadgeText: {fontSize: 14, fontWeight: '700', color: '#27ae60'},
  typeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f4ff',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 12,
  },
  typeBadgeText: {fontSize: 11, color: '#003366', fontWeight: '600'},
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
  optionSelected: {borderColor: '#003366', backgroundColor: '#e8f0fb'},
  optionCorrect: {borderColor: '#27ae60', backgroundColor: '#27ae60'},
  optionWrong: {borderColor: '#e74c3c', backgroundColor: '#e74c3c'},
  optionText: {fontSize: 15, color: '#333'},
  optionTextLight: {color: '#fff', fontWeight: '600'},
  wrongHint: {fontSize: 13, color: '#e74c3c', marginBottom: 8},
  tfRow: {flexDirection: 'row', marginBottom: 12},
  tfBtn: {
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 18,
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  tfSelected: {
    borderWidth: 2,
    borderColor: '#003366',
    borderRadius: 10,
    padding: 18,
    backgroundColor: '#e8f0fb',
    alignItems: 'center',
  },
  tfText: {fontSize: 16, fontWeight: '700', color: '#333'},
  sortHint: {fontSize: 13, color: '#888', marginBottom: 10},
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  sortPicked: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#003366',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    backgroundColor: '#e8f0fb',
  },
  sortNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#003366',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sortNumberText: {color: '#fff', fontSize: 12, fontWeight: '700'},
  unsupported: {color: '#aaa', fontSize: 14, textAlign: 'center', marginVertical: 20},
  feedback: {borderRadius: 10, padding: 14, marginTop: 4, marginBottom: 12},
  feedbackCorrect: {backgroundColor: '#eafaf1'},
  feedbackWrong: {backgroundColor: '#fdf0f0'},
  feedbackText: {fontSize: 16, fontWeight: '700', color: '#111'},
  funFactBox: {
    backgroundColor: '#fff9e6',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
  },
  funFactLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f39c12',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  funFactText: {fontSize: 14, color: '#555', lineHeight: 20},
  actionBtn: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  actionBtnText: {color: '#fff', fontSize: 16, fontWeight: '700'},
});
