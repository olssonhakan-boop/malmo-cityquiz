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

const GOLD     = '#C8A840';
const DARK     = '#2C1E0F';
const GREEN    = '#27AE60';
const RED      = '#E74C3C';
const SHEET_BG = '#FDFAF5';
const BORDER   = '#DDD5C4';
const MUTED    = '#9E8E78';

// ─── Hjälpfunktioner ──────────────────────────────────────────────────────────
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

// ─── Flash-animation ──────────────────────────────────────────────────────────
function useFlash() {
  const opacity = useRef(new Animated.Value(0)).current;
  const colorRef = useRef('#fff');
  function flash(color) {
    colorRef.current = color;
    opacity.setValue(0.35);
    Animated.timing(opacity, {toValue: 0, duration: 600, useNativeDriver: true}).start();
  }
  return {opacity, colorRef, flash};
}

// ─── Svarsknapp ───────────────────────────────────────────────────────────────
// state: 'idle' | 'correct' | 'wrong' | 'hidden'
function OptionBtn({label, state, onPress, disabled}) {
  if (state === 'hidden') return null;

  const isIdle    = state === 'idle';
  const isCorrect = state === 'correct';
  const isWrong   = state === 'wrong';

  return (
    <TouchableOpacity
      style={[
        styles.optionBtn,
        isCorrect && styles.optionCorrect,
        isWrong   && styles.optionWrong,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}>
      <Text
        style={[
          styles.optionText,
          (isCorrect || isWrong) && styles.optionTextLight,
        ]}
        numberOfLines={2}>
        {label}
      </Text>
      {isCorrect && <Text style={styles.optionCheck}>✓</Text>}
      {isWrong   && <Text style={styles.optionCheck}>✗</Text>}
    </TouchableOpacity>
  );
}

// ─── Flervalsfråga ────────────────────────────────────────────────────────────
function MultipleChoice({question, lang, onCorrect, onWrong}) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;
  const correctId = question.correctOptionId;

  function handlePress(id) {
    if (answered) return;
    setSelected(id);
    id === correctId ? onCorrect() : onWrong();
  }

  return (
    <>
      {question.options.map(opt => {
        let state = 'idle';
        if (answered) {
          if (opt.id === correctId)  state = 'correct';
          else if (opt.id === selected) state = 'wrong';
          else                          state = 'hidden';
        }
        return (
          <OptionBtn
            key={opt.id}
            label={loc(opt.label, lang)}
            state={state}
            onPress={() => handlePress(opt.id)}
            disabled={answered}
          />
        );
      })}
    </>
  );
}

// ─── Ja / Nej ─────────────────────────────────────────────────────────────────
function TrueFalse({question, lang, onCorrect, onWrong}) {
  const [selected, setSelected] = useState(null);
  const answered = selected !== null;

  function handlePress(value) {
    if (answered) return;
    setSelected(value);
    value === question.correctBoolean ? onCorrect() : onWrong();
  }

  return (
    <View style={styles.tfRow}>
      {[true, false].map(val => {
        const isCorrect = answered && val === question.correctBoolean;
        const isWrong   = answered && val === selected && val !== question.correctBoolean;
        return (
          <TouchableOpacity
            key={String(val)}
            style={[
              styles.tfBtn,
              isCorrect && styles.optionCorrect,
              isWrong   && styles.optionWrong,
            ]}
            onPress={() => handlePress(val)}
            disabled={answered}
            activeOpacity={0.72}>
            <Text style={[styles.tfText, (isCorrect || isWrong) && {color: '#fff'}]}>
              {val ? t(lang, 'trueFalseTrue') : t(lang, 'trueFalseFalse')}
            </Text>
            {isCorrect && <Text style={styles.optionCheck}>✓</Text>}
            {isWrong   && <Text style={styles.optionCheck}>✗</Text>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Sortera ──────────────────────────────────────────────────────────────────
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
      correct ? onCorrect() : onWrong();
    }
  }

  function numColor(itemId) {
    if (!confirmed) return picked.includes(itemId) ? GOLD : '#BEB4A4';
    const idx = picked.indexOf(itemId);
    return question.correctOrderIds[idx] === itemId ? GREEN : RED;
  }

  function itemState(itemId) {
    if (!confirmed) return picked.includes(itemId) ? 'picked' : 'idle';
    const idx = picked.indexOf(itemId);
    return question.correctOrderIds[idx] === itemId ? 'correct' : 'wrong';
  }

  return (
    <>
      <Text style={styles.sortHint}>{t(lang, 'sortOrderHint')}</Text>
      {shuffled.map((item, i) => {
        const state = itemState(item.id);
        const idx = picked.indexOf(item.id);
        return (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.sortBtn,
              state === 'picked'  && styles.sortPicked,
              state === 'correct' && styles.sortCorrect,
              state === 'wrong'   && styles.sortWrong,
            ]}
            onPress={() => handlePick(item.id)}
            disabled={idx >= 0 || confirmed}
            activeOpacity={0.72}>
            <View style={[styles.sortNum, {backgroundColor: numColor(item.id)}]}>
              <Text style={styles.sortNumText}>{idx >= 0 ? idx + 1 : i + 1}</Text>
            </View>
            <Text
              style={[
                styles.sortItemText,
                (state === 'correct' || state === 'wrong') && {color: '#fff'},
              ]}
              numberOfLines={2}>
              {loc(item.label, lang)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </>
  );
}

// ─── Huvudmodal ───────────────────────────────────────────────────────────────
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
  const totalQ     = location.questions.length;
  const allDone    = unanswered.length === 0 ||
                     (feedback === 'correct' && unanswered.length === 1);
  const answered   = feedback !== 'idle';

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
  const fact         = loc(question.fact,   lang);
  const title        = loc(location.title,  lang);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>

        {/* Flash-overlay */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, {backgroundColor: colorRef.current, opacity}]}
        />

        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={styles.title} numberOfLines={2}>{title}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{top: 12, right: 12, bottom: 12, left: 12}}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* ── Progress ── */}
            <View style={styles.progressRow}>
              <View style={styles.dots}>
                {location.questions.map((q, i) => (
                  <View
                    key={q.id}
                    style={[
                      styles.dot,
                      completedIds.has(makeProgressId(location.id, q.id))
                        ? styles.dotDone
                        : i === qIndex
                        ? styles.dotActive
                        : styles.dotEmpty,
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

            {/* ── GPS-bonus ── */}
            {isOnLocation && (
              <View style={styles.gpsBadge}>
                <View style={styles.gpsPill}>
                  <Text style={styles.gpsPillText}>GPS</Text>
                </View>
                <Text style={styles.gpsText}>Du är på platsen  ·  3× poäng</Text>
              </View>
            )}

            {/* ── Fråga ── */}
            <Text style={styles.question}>{questionText}</Text>

            {/* ── Svarsalternativ ── */}
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
            </View>

            {/* ── Feedback ── */}
            {answered && (
              <View
                style={[
                  styles.feedbackRow,
                  feedback === 'correct' ? styles.feedbackOk : styles.feedbackErr,
                ]}>
                <Text style={[
                  styles.feedbackIcon,
                  {color: feedback === 'correct' ? GREEN : RED},
                ]}>
                  {feedback === 'correct' ? '✓' : '✗'}
                </Text>
                <Text style={[
                  styles.feedbackText,
                  {color: feedback === 'correct' ? GREEN : RED},
                ]}>
                  {feedback === 'correct' ? t(lang, 'correct') : t(lang, 'wrong')}
                </Text>
                <Text style={[
                  styles.feedbackPoints,
                  {color: feedback === 'correct' ? (isOnLocation ? GOLD : GREEN) : '#BBB'},
                ]}>
                  {feedback === 'correct' ? (isOnLocation ? '+3p' : '+1p') : ''}
                </Text>
              </View>
            )}

            {/* ── Visste du att ── */}
            {answered && fact ? (
              <View style={styles.funFact}>
                <Text style={styles.funFactLabel}>{t(lang, 'funFact')}</Text>
                <Text style={styles.funFactText}>{fact}</Text>
              </View>
            ) : null}

            {/* ── Nästa / Stäng ── */}
            {answered && (
              <TouchableOpacity
                style={styles.nextBtn}
                activeOpacity={0.85}
                onPress={allDone ? onClose : handleNext}>
                <View style={styles.nextBtnSheen} />
                <Text style={styles.nextBtnText}>
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

// ─── Stilar ───────────────────────────────────────────────────────────────────
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
    maxHeight: '82%',
    paddingHorizontal: 20,
    paddingTop: 20,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: DARK,
    flex: 1,
    marginRight: 12,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#E8E0D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {fontSize: 13, color: '#777', fontWeight: '700'},

  // ── Progress ─────────────────────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dots: {flexDirection: 'row', gap: 6},
  dot:  {width: 9, height: 9, borderRadius: 5},
  dotDone:   {backgroundColor: GREEN},
  dotActive: {backgroundColor: GOLD},
  dotEmpty:  {backgroundColor: '#DDD5C4'},
  progressText: {fontSize: 12, color: MUTED, fontWeight: '500'},

  // ── GPS-badge ────────────────────────────────────────────────────────────────
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  gpsPill: {
    backgroundColor: GOLD,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  gpsPillText: {fontSize: 10, fontWeight: '800', color: DARK, letterSpacing: 0.8},
  gpsText:     {fontSize: 13, color: '#7A5A00', fontWeight: '600'},

  // ── Fråga ────────────────────────────────────────────────────────────────────
  question: {
    fontSize: 15,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
    lineHeight: 22,
  },

  // ── Svarsknapp (flerval) ─────────────────────────────────────────────────────
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionCorrect: {borderColor: GREEN, backgroundColor: GREEN},
  optionWrong:   {borderColor: RED,   backgroundColor: RED},
  optionText:      {fontSize: 14, color: DARK, fontWeight: '500', flex: 1},
  optionTextLight: {color: '#fff', fontWeight: '700'},
  optionCheck:     {fontSize: 16, color: '#fff', fontWeight: '800', marginLeft: 8},

  // ── Ja / Nej ─────────────────────────────────────────────────────────────────
  tfRow: {flexDirection: 'row', gap: 8, marginBottom: 8},
  tfBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  tfText: {fontSize: 16, fontWeight: '800', color: DARK},

  // ── Sortera ──────────────────────────────────────────────────────────────────
  sortHint: {fontSize: 12, color: MUTED, marginBottom: 10},
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sortPicked:  {borderColor: GOLD, backgroundColor: '#FFF8E1'},
  sortCorrect: {borderColor: GREEN, backgroundColor: GREEN},
  sortWrong:   {borderColor: RED,   backgroundColor: RED},
  sortNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sortNumText:  {color: '#fff', fontSize: 12, fontWeight: '800'},
  sortItemText: {fontSize: 14, fontWeight: '500', flex: 1, color: DARK},

  // ── Feedback ─────────────────────────────────────────────────────────────────
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
    marginBottom: 10,
    gap: 8,
  },
  feedbackOk:  {backgroundColor: '#E8F8ED', borderWidth: 1.5, borderColor: GREEN},
  feedbackErr: {backgroundColor: '#FDECEA', borderWidth: 1.5, borderColor: RED},
  feedbackIcon:   {fontSize: 15, fontWeight: '800'},
  feedbackText:   {fontSize: 14, fontWeight: '700', flex: 1},
  feedbackPoints: {fontSize: 13, fontWeight: '700'},

  // ── Visste du att ─────────────────────────────────────────────────────────────
  funFact: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  funFactLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  funFactText: {fontSize: 13, color: DARK, lineHeight: 18},

  // ── Nästa-knapp ───────────────────────────────────────────────────────────────
  nextBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderBottomWidth: 3,
    borderBottomColor: '#8A6A00',
    position: 'relative',
  },
  nextBtnSheen: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '45%',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 50,
  },
  nextBtnText: {
    color: DARK,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
