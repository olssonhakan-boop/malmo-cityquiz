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

// ─── Flash-overlay ────────────────────────────────────────────────────────────
function useFlash() {
  const opacity   = useRef(new Animated.Value(0)).current;
  const colorRef  = useRef('#fff');
  function flash(color) {
    colorRef.current = color;
    opacity.setValue(0.3);
    Animated.timing(opacity, {toValue: 0, duration: 500, useNativeDriver: true}).start();
  }
  return {opacity, colorRef, flash};
}

// ─── Svarsknapp (bara synlig INNAN svar) ─────────────────────────────────────
function OptionBtn({label, onPress, disabled}) {
  return (
    <TouchableOpacity
      style={styles.optionBtn}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.72}>
      <Text style={styles.optionText} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Flervalsfråga ────────────────────────────────────────────────────────────
function MultipleChoice({question, lang, onCorrect, onWrong}) {
  const [selected, setSelected] = useState(null);
  const answered   = selected !== null;
  const correctId  = question.correctOptionId;

  function handlePress(id) {
    if (answered) return;
    setSelected(id);
    const correctOpt  = question.options.find(o => o.id === correctId);
    const correctText = loc(correctOpt?.label, lang);
    id === correctId ? onCorrect(correctText) : onWrong(correctText);
  }

  if (answered) return null;

  return (
    <>
      {question.options.map(opt => (
        <OptionBtn
          key={opt.id}
          label={loc(opt.label, lang)}
          onPress={() => handlePress(opt.id)}
          disabled={false}
        />
      ))}
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
    const correctText = question.correctBoolean
      ? t(lang, 'trueFalseTrue')
      : t(lang, 'trueFalseFalse');
    value === question.correctBoolean ? onCorrect(correctText) : onWrong(correctText);
  }

  if (answered) return null;

  return (
    <View style={styles.tfRow}>
      {[true, false].map(val => (
        <TouchableOpacity
          key={String(val)}
          style={styles.tfBtn}
          onPress={() => handlePress(val)}
          activeOpacity={0.72}>
          <Text style={styles.tfText}>
            {val ? t(lang, 'trueFalseTrue') : t(lang, 'trueFalseFalse')}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Sortera ──────────────────────────────────────────────────────────────────
function SortOrder({question, lang, onCorrect, onWrong}) {
  const shuffled    = useMemo(() => shuffledItems(question.id, question.items), [question.id, question.items]);
  const [picked,    setPicked]    = useState([]);
  const [confirmed, setConfirmed] = useState(false);

  function handlePick(itemId) {
    if (confirmed || picked.includes(itemId)) return;
    const next = [...picked, itemId];
    setPicked(next);
    if (next.length === question.items.length) {
      setConfirmed(true);
      const correct = next.every((id, i) => id === question.correctOrderIds[i]);
      correct ? onCorrect('') : onWrong('');
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
        const idx   = picked.indexOf(item.id);
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

// ─── Resultat-sektion (efter svar, ej sortera) ────────────────────────────────
function ResultArea({feedback, correctAnswer, points, streak, iconScale, scoreScale}) {
  const isCorrect = feedback === 'correct';
  return (
    <View style={styles.resultArea}>

      {/* Stor ikon-cirkel */}
      <Animated.View style={[
        styles.resultCircle,
        isCorrect ? styles.resultCircleOk : styles.resultCircleErr,
        {transform: [{scale: iconScale}]},
      ]}>
        <Text style={styles.resultCircleText}>{isCorrect ? '✓' : '✗'}</Text>
      </Animated.View>

      {/* Rätt/Fel-text */}
      <Text style={[styles.resultLabel, {color: isCorrect ? GREEN : RED}]}>
        {isCorrect ? 'Rätt svar!' : 'Fel svar'}
      </Text>

      {/* Poäng-stämpel (rätt svar) */}
      {isCorrect && (
        <Animated.View style={[styles.scoreWrap, {transform: [{scale: scoreScale}]}]}>
          <Text style={styles.scoreNum}>+{points}</Text>
          <Text style={styles.scoreLabel}>POÄNG</Text>
        </Animated.View>
      )}

      {/* Streak-badge */}
      {isCorrect && streak >= 2 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak} rätt i rad</Text>
        </View>
      )}

      {/* Rätt svar (visas bara vid fel svar) */}
      {!isCorrect && correctAnswer ? (
        <View style={styles.correctPillWrap}>
          <Text style={styles.correctPillLabel}>Rätt svar var:</Text>
          <View style={styles.correctPill}>
            <Text style={styles.correctPillText}>✓  {correctAnswer}</Text>
          </View>
        </View>
      ) : null}

    </View>
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
  const [qIndex,        setQIndex]        = useState(0);
  const [feedback,      setFeedback]      = useState('idle');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [streak,        setStreak]        = useState(0);
  const [key,           setKey]           = useState(0);

  const {opacity, colorRef, flash} = useFlash();

  // Animationsvärden
  const iconScale   = useRef(new Animated.Value(0)).current;
  const scoreScale  = useRef(new Animated.Value(0)).current;
  const factOpacity = useRef(new Animated.Value(0)).current;
  const factSlide   = useRef(new Animated.Value(28)).current;

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
    setCorrectAnswer('');
    setStreak(0);
    setKey(k => k + 1);
    resetAnims();
  }, [visible, location?.id]);

  if (!location) return null;
  const question = location.questions[qIndex];
  if (!question) return null;

  const progressId = makeProgressId(location.id, question.id);
  const totalQ     = location.questions.length;
  const answered   = feedback !== 'idle';
  const allDone    = unanswered.length === 0 ||
                     (feedback === 'correct' && unanswered.length === 1);
  const points     = isOnLocation ? 30 : 10;

  // ─── Animationer ──────────────────────────────────────────────────────────
  function resetAnims() {
    iconScale.setValue(0);
    scoreScale.setValue(0);
    factOpacity.setValue(0);
    factSlide.setValue(28);
  }

  function startResultAnims() {
    // 1. Ikon poppar in med fjäder
    Animated.spring(iconScale, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
    // 2. Poäng stampar in (bara vid rätt svar)
    setTimeout(() => {
      Animated.spring(scoreScale, {
        toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
      }).start();
    }, 220);
    // 3. Faktaruta glider upp
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(factOpacity, {toValue: 1, duration: 320, useNativeDriver: true}),
        Animated.spring(factSlide,   {toValue: 0, friction: 8,   useNativeDriver: true}),
      ]).start();
    }, 480);
  }

  // ─── Händelser ────────────────────────────────────────────────────────────
  function handleCorrect(correctText) {
    flash(GREEN);
    setFeedback('correct');
    setCorrectAnswer(correctText || '');
    setStreak(s => s + 1);
    onCompleteQuestion(progressId);
    startResultAnims();
  }

  function handleWrong(correctText) {
    flash(RED);
    setFeedback('wrong');
    setCorrectAnswer(correctText || '');
    setStreak(0);
    startResultAnims();
  }

  function handleNext() {
    resetAnims();
    const nextIdx = unanswered.find(i => i > qIndex) ?? unanswered[0];
    if (nextIdx !== undefined && nextIdx !== qIndex) {
      setQIndex(nextIdx);
      setFeedback('idle');
      setCorrectAnswer('');
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
            {isOnLocation && !answered && (
              <View style={styles.gpsBadge}>
                <View style={styles.gpsPill}>
                  <Text style={styles.gpsPillText}>GPS</Text>
                </View>
                <Text style={styles.gpsText}>Du är på platsen  ·  3× poäng</Text>
              </View>
            )}

            {/* ── Fråga ── */}
            <Text style={styles.question}>{questionText}</Text>

            {/* ── Svarsalternativ (döljs när answered, utom SortOrder) ── */}
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

            {/* ── Resultat-kort (MC + TF efter svar) ── */}
            {answered && question.type !== 'sort-order' && (
              <ResultArea
                feedback={feedback}
                correctAnswer={correctAnswer}
                points={points}
                streak={streak}
                iconScale={iconScale}
                scoreScale={scoreScale}
              />
            )}

            {/* ── Visste du att (alltid vid svar, rätt och fel) ── */}
            {answered && fact ? (
              <Animated.View
                style={[
                  styles.funFact,
                  {opacity: factOpacity, transform: [{translateY: factSlide}]},
                ]}>
                <Text style={styles.funFactLabel}>{t(lang, 'funFact')}</Text>
                <Text style={styles.funFactText}>{fact}</Text>
              </Animated.View>
            ) : null}

            {/* ── Nästa / Stäng ── */}
            {answered && (
              <TouchableOpacity
                style={styles.nextBtn}
                activeOpacity={0.85}
                onPress={allDone ? onClose : handleNext}>
                <View style={styles.nextBtnHighlight} />
                <Text style={styles.nextBtnText}>
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
    marginBottom: 14,
    lineHeight: 22,
  },

  // ── Svarsknapp ───────────────────────────────────────────────────────────────
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  optionText: {fontSize: 14, color: DARK, fontWeight: '500', flex: 1},

  // ── Ja / Nej ─────────────────────────────────────────────────────────────────
  tfRow: {flexDirection: 'row', gap: 10, marginBottom: 8},
  tfBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: 14,
    paddingVertical: 22,
    backgroundColor: '#fff',
  },
  tfText: {fontSize: 17, fontWeight: '800', color: DARK},

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
  sortPicked:   {borderColor: GOLD, backgroundColor: '#FFF8E1'},
  sortCorrect:  {borderColor: GREEN, backgroundColor: GREEN},
  sortWrong:    {borderColor: RED,   backgroundColor: RED},
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

  // ── Resultat-kort — eget kort med djup ───────────────────────────────────────
  resultArea: {
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E8D99A',
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    marginBottom: 14,
    elevation: 4,
    shadowColor: '#8A6A00',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  resultCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  resultCircleOk:   {backgroundColor: GREEN},
  resultCircleErr:  {backgroundColor: RED},
  resultCircleText: {fontSize: 34, color: '#fff', fontWeight: '900', lineHeight: 40},
  resultLabel: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
    letterSpacing: -0.3,
  },

  // Poäng-stämpel
  scoreWrap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  scoreNum: {
    fontSize: 58,
    fontWeight: '900',
    color: GOLD,
    lineHeight: 62,
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 2.5,
    marginTop: -4,
  },

  // Streak
  streakBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1.5,
    borderColor: GOLD,
    marginBottom: 4,
    elevation: 2,
  },
  streakText: {fontSize: 13, fontWeight: '700', color: '#7A5A00'},

  // Rätt svar-pill (vid fel)
  correctPillWrap: {
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  correctPillLabel: {fontSize: 11, color: MUTED, fontWeight: '600'},
  correctPill: {
    backgroundColor: '#E8F8ED',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderWidth: 1.5,
    borderColor: GREEN,
    elevation: 2,
  },
  correctPillText: {fontSize: 14, fontWeight: '700', color: GREEN},

  // ── Visste du att — faktakort med djup ───────────────────────────────────────
  funFact: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: GOLD,
    elevation: 3,
    shadowColor: '#8A6A00',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  funFactLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  funFactText: {fontSize: 13, color: DARK, lineHeight: 19},

  // ── Nästa/Stäng — enligt designdokumentet ────────────────────────────────────
  nextBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: 15,
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 8,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.30)',
  },
  nextBtnHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 22,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 50,
  },
  nextBtnText: {
    color: '#1a0f00',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
