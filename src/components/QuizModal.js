import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
} from 'react-native';
import {t} from '../utils/i18n';
import {makeProgressId} from '../hooks/useLocations';

const GOLD   = '#C8A840';
const DARK   = '#2C1E0F';
const GREEN  = '#27AE60';
const RED    = '#E74C3C';
const SHEET_BG = '#FDFAF5';

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

// ─── Flash overlay (grön/röd) ─────────────────────────────────────────────────
function useFlash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorRef = useRef('#fff');

  function flash(color) {
    colorRef.current = color;
    opacity.setValue(0.35);
    Animated.timing(opacity, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }

  return {opacity, colorRef, flash};
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

        let containerStyle = styles.optionBtn;
        let textStyle = styles.optionText;
        let icon = null;

        if (answered) {
          if (isCorrect) {
            containerStyle = [styles.optionBtn, styles.optionCorrect];
            textStyle = [styles.optionText, styles.optionTextLight];
            icon = <Text style={styles.optionIcon}>✓</Text>;
          } else if (isSelected) {
            containerStyle = [styles.optionBtn, styles.optionWrong];
            textStyle = [styles.optionText, styles.optionTextLight];
            icon = <Text style={styles.optionIcon}>✗</Text>;
          } else {
            containerStyle = [styles.optionBtn, styles.optionDimmed];
          }
        }

        return (
          <TouchableOpacity
            key={opt.id}
            style={containerStyle}
            onPress={() => handlePress(opt.id)}
            activeOpacity={0.75}
            disabled={answered}>
            <Text style={textStyle}>{loc(opt.label, lang)}</Text>
            {icon}
          </TouchableOpacity>
        );
      })}
      {answered && selected !== question.correctOptionId && (
        <View style={styles.wrongHintRow}>
          <Text style={styles.wrongHintIcon}>💡</Text>
          <Text style={styles.wrongHint}>
            {t(lang, 'correctAnswerWas')} {correctLabel}
          </Text>
        </View>
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
        <Text style={styles.tfIcon}>👍</Text>
        <Text style={txtStyle(true)}>{t(lang, 'trueFalseTrue')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[btnStyle(false), {flex: 1, marginLeft: 8}]} onPress={() => handlePress(false)} disabled={answered}>
        <Text style={styles.tfIcon}>👎</Text>
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
    if (idx >= 0) return [styles.optionText, {color: DARK, fontWeight: '700'}];
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
  const [feedback, setFeedback] = useState('idle');
  const [key, setKey] = useState(0);
  const {opacity, colorRef, flash} = useFlash();

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
  const allDone = unanswered.length === 0 || (feedback === 'correct' && unanswered.length === 1);

  function handleCorrect() {
    flash(GREEN);
    setFeedback('correct');
    onCompleteQuestion(progressId);
  }

  function handleWrong() {
    flash(RED);
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
        {/* Flash-overlay */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFillObject,
            {backgroundColor: colorRef.current, opacity},
          ]}
        />

        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.locationTitle} numberOfLines={2}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{top:10,right:10,bottom:10,left:10}}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Progress dots */}
            <View style={styles.progressRow}>
              <View style={styles.progressDots}>
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
              <Text style={styles.progressText}>
                {t(lang, 'questionOf')
                  .replace('{n}', qIndex + 1)
                  .replace('{total}', totalQ)}
              </Text>
            </View>

            {/* GPS bonus badge */}
            {isOnLocation && (
              <View style={styles.gpsBadge}>
                <Text style={styles.gpsBadgeIcon}>⚡</Text>
                <View>
                  <Text style={styles.gpsBadgeTitle}>GPS-bonus!</Text>
                  <Text style={styles.gpsBadgeSub}>Rätt svar ger 3× poäng</Text>
                </View>
              </View>
            )}

            {/* Frågetext */}
            <Text style={styles.question}>{questionText}</Text>

            {/* Frågetyp */}
            {(feedback === 'idle' || question.type !== 'find-detail') && (
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
            )}

            {/* Feedback-rad */}
            {feedback !== 'idle' && (
              <View style={[styles.feedbackRow, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong]}>
                <Text style={styles.feedbackIcon}>
                  {feedback === 'correct' ? '✓' : '✗'}
                </Text>
                <Text style={styles.feedbackText}>
                  {feedback === 'correct' ? t(lang, 'correct') : t(lang, 'wrong')}
                </Text>
              </View>
            )}

            {/* Fun fact */}
            {feedback !== 'idle' && fact ? (
              <View style={styles.funFactBox}>
                <View style={styles.funFactHeader}>
                  <Text style={styles.funFactBulb}>💡</Text>
                  <Text style={styles.funFactLabel}>{t(lang, 'funFact')}</Text>
                </View>
                <Text style={styles.funFactText}>{fact}</Text>
              </View>
            ) : null}

            {/* Nästa/Klar-knapp */}
            {feedback !== 'idle' && (
              <TouchableOpacity
                style={styles.actionBtn}
                activeOpacity={0.85}
                onPress={allDone ? onClose : handleNext}>
                <View style={styles.actionBtnHighlight} />
                <Text style={styles.actionBtnText}>
                  {allDone ? t(lang, 'locationComplete') : t(lang, 'nextQuestion')}
                </Text>
              </TouchableOpacity>
            )}

            <View style={{height: 28}} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  locationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E8E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {fontSize: 14, color: '#666', fontWeight: '700'},

  // ── Progress ────────────────────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  progressDots: {flexDirection: 'row', gap: 6},
  progressDot: {width: 10, height: 10, borderRadius: 5},
  progressDotDone: {backgroundColor: GREEN},
  progressDotActive: {backgroundColor: GOLD},
  progressDotEmpty: {backgroundColor: '#DDD5C4'},
  progressText: {fontSize: 12, color: '#999', fontWeight: '500'},

  // ── GPS badge ───────────────────────────────────────────────────────────────
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: GOLD,
    gap: 10,
  },
  gpsBadgeIcon: {fontSize: 22},
  gpsBadgeTitle: {fontSize: 14, fontWeight: '800', color: '#7A5A00'},
  gpsBadgeSub: {fontSize: 12, color: '#A07820', marginTop: 1},

  // ── Fråga ───────────────────────────────────────────────────────────────────
  question: {
    fontSize: 17,
    fontWeight: '700',
    color: DARK,
    marginBottom: 18,
    lineHeight: 24,
  },

  // ── Alternativ-knappar ──────────────────────────────────────────────────────
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#DDD5C4',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  optionDimmed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: '#EEE8DA',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: '#F9F6F0',
  },
  optionCorrect: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: GREEN,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: GREEN,
  },
  optionWrong: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderColor: RED,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginBottom: 10,
    backgroundColor: RED,
  },
  optionText: {fontSize: 15, color: '#333', fontWeight: '500', flex: 1},
  optionTextLight: {color: '#fff', fontWeight: '700'},
  optionIcon: {fontSize: 18, color: '#fff', fontWeight: '700', marginLeft: 8},
  wrongHintRow: {flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 12},
  wrongHintIcon: {fontSize: 15},
  wrongHint: {fontSize: 13, color: RED, flex: 1, fontWeight: '600'},

  // ── Ja/Nej ──────────────────────────────────────────────────────────────────
  tfRow: {flexDirection: 'row', marginBottom: 12},
  tfBtn: {
    borderWidth: 2,
    borderColor: '#DDD5C4',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  tfSelected: {
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 12,
    backgroundColor: '#FFF8E1',
    alignItems: 'center',
  },
  tfIcon: {fontSize: 28, marginBottom: 6},
  tfText: {fontSize: 16, fontWeight: '700', color: DARK},

  // ── Sort order ──────────────────────────────────────────────────────────────
  sortHint: {fontSize: 13, color: '#999', marginBottom: 10},
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDD5C4',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sortPicked: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: GOLD,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    backgroundColor: '#FFF8E1',
  },
  sortNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: DARK,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sortNumberText: {color: '#fff', fontSize: 13, fontWeight: '700'},

  // ── Feedback ────────────────────────────────────────────────────────────────
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 14,
    gap: 10,
  },
  feedbackCorrect: {backgroundColor: '#E8F8EF', borderWidth: 1.5, borderColor: GREEN},
  feedbackWrong: {backgroundColor: '#FDECEA', borderWidth: 1.5, borderColor: RED},
  feedbackIcon: {fontSize: 20, fontWeight: '700'},
  feedbackText: {fontSize: 16, fontWeight: '800', color: DARK},

  // ── Fun fact ────────────────────────────────────────────────────────────────
  funFactBox: {
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  funFactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  funFactBulb: {fontSize: 20},
  funFactLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#7A5A00',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  funFactText: {fontSize: 15, color: '#4A3800', lineHeight: 22},

  // ── Nästa-knapp ─────────────────────────────────────────────────────────────
  actionBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 18,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 4,
    borderBottomColor: '#8A6A00',
    position: 'relative',
  },
  actionBtnHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 50,
  },
  actionBtnText: {
    color: DARK,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  unsupported: {color: '#aaa', fontSize: 14, textAlign: 'center', marginVertical: 20},
});
