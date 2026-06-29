import React, {useState, useEffect, useRef, useMemo} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ImageBackground,
  Image,
  Dimensions,
} from 'react-native';

const RESULT_BG = require('../../assets/images/malmo4.jpg');

import QUESTION_IMAGES from '../utils/questionImages';
import {t} from '../utils/i18n';
import {makeProgressId} from '../hooks/useLocations';
import {playClick, playCorrect, playWrong, playSuccess} from '../utils/sound';

const GOLD     = '#C8A840';
const DARK     = '#2C1E0F';
const GREEN    = '#27AE60';
const RED      = '#E74C3C';
const SHEET_BG = '#FDFAF5';
const BORDER   = '#DDD5C4';
const MUTED    = '#9E8E78';

// Dimensioner beräknas en gång vid app-start (portrait-only app)
const {width: SW, height: SH} = Dimensions.get('window');
const wp = pct => SW * (pct / 100);
const hp = pct => SH * (pct / 100);
const fs = size => Math.round(size * (SW / 390));

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
    const correctOpt   = question.options.find(o => o.id === correctId);
    const selectedOpt  = question.options.find(o => o.id === id);
    const correctText  = loc(correctOpt?.label, lang);
    const selectedText = loc(selectedOpt?.label, lang);
    id === correctId ? onCorrect(correctText) : onWrong(correctText, selectedText);
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
    const correctText  = question.correctBoolean ? t(lang, 'trueFalseTrue') : t(lang, 'trueFalseFalse');
    const selectedText = value ? t(lang, 'trueFalseTrue') : t(lang, 'trueFalseFalse');
    value === question.correctBoolean ? onCorrect(correctText) : onWrong(correctText, selectedText);
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
function ResultArea({feedback, correctAnswer, selectedAnswer, points, streak, iconScale, scoreScale, lang}) {
  const isCorrect = feedback === 'correct';
  return (
    <View style={styles.resultArea}>

      <Animated.View style={[
        styles.resultCircle,
        isCorrect ? styles.resultCircleOk : styles.resultCircleErr,
        {transform: [{scale: iconScale}]},
      ]}>
        <Text style={styles.resultCircleText}>{isCorrect ? '✓' : '✗'}</Text>
      </Animated.View>

      <Text style={[styles.resultLabel, {color: isCorrect ? GREEN : RED}]}>
        {isCorrect ? t(lang, 'sofaCorrect') : t(lang, 'sofaWrong')}
      </Text>

      {isCorrect && (
        <Animated.View style={[styles.scoreWrap, {transform: [{scale: scoreScale}]}]}>
          <Text style={styles.scoreNum}>+{points}</Text>
          <Text style={styles.scoreLabel}>{t(lang, 'score').toUpperCase()}</Text>
        </Animated.View>
      )}

      {isCorrect && streak >= 2 && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakText}>{streak} rätt i rad</Text>
        </View>
      )}

      {!isCorrect && (
        <View style={styles.answerSummary}>
          {selectedAnswer ? (
            <View style={styles.answerRow}>
              <Text style={styles.answerRowLabel}>Ditt val:</Text>
              <View style={styles.wrongPill}>
                <Text style={styles.wrongPillText}>✗  {selectedAnswer}</Text>
              </View>
            </View>
          ) : null}
          {correctAnswer ? (
            <View style={styles.answerRow}>
              <Text style={styles.answerRowLabel}>Rätt svar:</Text>
              <View style={styles.correctPill}>
                <Text style={styles.correctPillText}>✓  {correctAnswer}</Text>
              </View>
            </View>
          ) : null}
        </View>
      )}

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
  soundEnabled,
}) {
  const [qIndex,        setQIndex]        = useState(0);
  const [feedback,        setFeedback]        = useState('idle');
  const [correctAnswer,   setCorrectAnswer]   = useState('');
  const [selectedAnswer,  setSelectedAnswer]  = useState('');
  const [streak,        setStreak]        = useState(0);
  const [key,           setKey]           = useState(0);

  const {opacity, colorRef, flash} = useFlash();

  const iconScale   = useRef(new Animated.Value(0)).current;
  const scoreScale  = useRef(new Animated.Value(0)).current;
  const factOpacity = useRef(new Animated.Value(0)).current;
  const factSlide   = useRef(new Animated.Value(hp(3.5))).current;

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

  function resetAnims() {
    iconScale.setValue(0);
    scoreScale.setValue(0);
    factOpacity.setValue(0);
    factSlide.setValue(hp(3.5));
  }

  function startResultAnims() {
    Animated.spring(iconScale, {
      toValue: 1, friction: 5, tension: 80, useNativeDriver: true,
    }).start();
    setTimeout(() => {
      Animated.spring(scoreScale, {
        toValue: 1, friction: 5, tension: 60, useNativeDriver: true,
      }).start();
    }, 220);
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(factOpacity, {toValue: 1, duration: 320, useNativeDriver: true}),
        Animated.spring(factSlide,   {toValue: 0, friction: 8,   useNativeDriver: true}),
      ]).start();
    }, 480);
  }

  function handleCorrect(correctText) {
    flash(GREEN);
    setFeedback('correct');
    setCorrectAnswer(correctText || '');
    setStreak(s => s + 1);
    onCompleteQuestion(progressId);
    startResultAnims();
    playCorrect(soundEnabled);
  }

  function handleWrong(correctText, selectedText) {
    flash(RED);
    setFeedback('wrong');
    setCorrectAnswer(correctText || '');
    setSelectedAnswer(selectedText || '');
    setStreak(0);
    startResultAnims();
    playWrong(soundEnabled);
  }

  function handleNext() {
    playClick(soundEnabled);
    resetAnims();
    const nextIdx = unanswered.find(i => i > qIndex) ?? unanswered[0];
    if (nextIdx !== undefined && nextIdx !== qIndex) {
      setQIndex(nextIdx);
      setFeedback('idle');
      setCorrectAnswer('');
      setSelectedAnswer('');
      setKey(k => k + 1);
    } else {
      playSuccess(soundEnabled);
      onClose();
    }
  }

  const questionText = loc(question.prompt, lang);
  const fact         = loc(question.fact,   lang);
  const title        = loc(location.title,  lang);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>

        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFillObject, {backgroundColor: colorRef.current, opacity}]}
        />

        <ImageBackground
          source={RESULT_BG}
          style={styles.sheet}
          imageStyle={styles.sheetBgImage}>
          <View>

            {/* ── Header ── */}
            <View style={styles.header}>
              <Text style={[styles.title, styles.titleOnBg]} numberOfLines={2}>{title}</Text>
              <TouchableOpacity
                onPress={() => { playClick(soundEnabled); onClose(); }}
                style={[styles.headerCloseBtn, styles.headerCloseBtnOnBg]}
                hitSlop={{top: 12, right: 12, bottom: 12, left: 12}}>
                <Text style={[styles.headerCloseBtnText, styles.headerCloseBtnTextOnBg]}>✕</Text>
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
            <Text style={[styles.question, styles.questionOnBg]}>{questionText}</Text>

            {/* ── Frågebild (om tillgänglig) ── */}
            {!answered && question.questionImageLocal && QUESTION_IMAGES[question.questionImageLocal] && (
              <Image
                source={QUESTION_IMAGES[question.questionImageLocal]}
                style={styles.questionImage}
                resizeMode="cover"
              />
            )}

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

            {/* ── Resultat-kort ── */}
            {answered && question.type !== 'sort-order' && (
              <ResultArea
                feedback={feedback}
                correctAnswer={correctAnswer}
                selectedAnswer={selectedAnswer}
                points={points}
                streak={streak}
                iconScale={iconScale}
                scoreScale={scoreScale}
                lang={lang}
              />
            )}

            {/* ── Visste du att ── */}
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

            <View style={{height: hp(3.5)}} />
          </View>
        </ImageBackground>
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
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    paddingHorizontal: wp(5),
    paddingTop: hp(2.5),
    overflow: 'hidden',
  },
  sheetBgImage: {
    borderTopLeftRadius: wp(6),
    borderTopRightRadius: wp(6),
    resizeMode: 'cover',
  },
  titleOnBg: {color: '#fff'},
  questionOnBg: {color: 'rgba(255,255,255,0.90)'},

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: hp(1.2),
  },
  title: {
    fontSize: fs(18),
    fontWeight: '800',
    color: DARK,
    flex: 1,
    marginRight: wp(3),
    letterSpacing: -0.2,
  },
  headerCloseBtn: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCloseBtnText: {fontSize: fs(14), color: '#555', fontWeight: '400', lineHeight: fs(16)},
  headerCloseBtnOnBg: {backgroundColor: 'rgba(0,0,0,0.35)'},
  headerCloseBtnTextOnBg: {color: '#fff'},

  // ── Progress ─────────────────────────────────────────────────────────────────
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.7),
  },
  dots: {flexDirection: 'row', gap: wp(1.5)},
  dot:  {width: wp(2.3), height: wp(2.3), borderRadius: wp(1.5)},
  dotDone:   {backgroundColor: GREEN},
  dotActive: {backgroundColor: GOLD},
  dotEmpty:  {backgroundColor: '#DDD5C4'},
  progressText: {fontSize: fs(12), color: MUTED, fontWeight: '500'},

  // ── GPS-badge ────────────────────────────────────────────────────────────────
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
    backgroundColor: '#FFF8E1',
    borderRadius: wp(2.5),
    paddingVertical: hp(1),
    paddingHorizontal: wp(3),
    marginBottom: hp(1.5),
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  gpsPill: {
    backgroundColor: GOLD,
    borderRadius: wp(1.5),
    paddingHorizontal: wp(1.5),
    paddingVertical: hp(0.25),
  },
  gpsPillText: {fontSize: fs(10), fontWeight: '800', color: DARK, letterSpacing: 0.8},
  gpsText:     {fontSize: fs(13), color: '#7A5A00', fontWeight: '600'},

  // ── Fråga ────────────────────────────────────────────────────────────────────
  question: {
    fontSize: fs(15),
    fontWeight: '700',
    color: DARK,
    marginBottom: hp(1.7),
    lineHeight: fs(22),
  },

  // ── Frågebild ────────────────────────────────────────────────────────────────
  questionImage: {
    width: '100%',
    height: hp(22),
    borderRadius: wp(3),
    marginBottom: hp(1.7),
  },

  // ── Svarsknapp ───────────────────────────────────────────────────────────────
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: wp(3),
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(4),
    marginBottom: hp(1),
    backgroundColor: '#fff',
  },
  optionText: {fontSize: fs(14), color: DARK, fontWeight: '500', flex: 1},

  // ── Ja / Nej ─────────────────────────────────────────────────────────────────
  tfRow: {flexDirection: 'row', gap: wp(2.5), marginBottom: hp(1)},
  tfBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: wp(3.5),
    paddingVertical: hp(2.7),
    backgroundColor: '#fff',
  },
  tfText: {fontSize: fs(17), fontWeight: '800', color: DARK},

  // ── Sortera ──────────────────────────────────────────────────────────────────
  sortHint: {fontSize: fs(12), color: MUTED, marginBottom: hp(1.2)},
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: BORDER,
    borderRadius: wp(3),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(3),
    marginBottom: hp(1),
    backgroundColor: '#fff',
  },
  sortPicked:   {borderColor: GOLD, backgroundColor: '#FFF8E1'},
  sortCorrect:  {borderColor: GREEN, backgroundColor: GREEN},
  sortWrong:    {borderColor: RED,   backgroundColor: RED},
  sortNum: {
    width: wp(6.5),
    height: wp(6.5),
    borderRadius: wp(3.25),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  sortNumText:  {color: '#fff', fontSize: fs(12), fontWeight: '800'},
  sortItemText: {fontSize: fs(14), fontWeight: '500', flex: 1, color: DARK},

  // ── Resultat-kort ─────────────────────────────────────────────────────────────
  resultArea: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: wp(3.5),
    borderWidth: 1.5,
    borderColor: GOLD,
    paddingVertical: hp(3),
    paddingHorizontal: wp(4),
    marginBottom: hp(1.7),
  },
  resultCircle: {
    width: wp(18),
    height: wp(18),
    borderRadius: wp(9),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(1.5),
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.22,
    shadowRadius: 5,
  },
  resultCircleOk:   {backgroundColor: GREEN},
  resultCircleErr:  {backgroundColor: RED},
  resultCircleText: {fontSize: fs(34), color: '#fff', fontWeight: '900', lineHeight: fs(40)},
  resultLabel: {
    fontSize: fs(20),
    fontWeight: '800',
    marginBottom: hp(2),
    letterSpacing: -0.3,
  },

  scoreWrap: {
    alignItems: 'center',
    marginBottom: hp(1.7),
  },
  scoreNum: {
    fontSize: fs(58),
    fontWeight: '900',
    color: GOLD,
    lineHeight: fs(62),
    letterSpacing: -2,
  },
  scoreLabel: {
    fontSize: fs(11),
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 2.5,
    marginTop: -4,
  },

  streakBadge: {
    backgroundColor: '#fff',
    borderRadius: wp(5),
    paddingHorizontal: wp(4),
    paddingVertical: hp(0.75),
    borderWidth: 1.5,
    borderColor: GOLD,
    marginBottom: hp(0.5),
    elevation: 2,
  },
  streakText: {fontSize: fs(13), fontWeight: '700', color: '#7A5A00'},

  answerSummary: {
    alignSelf: 'stretch',
    gap: hp(1.2),
    marginTop: hp(1.2),
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(2.5),
  },
  answerRowLabel: {
    fontSize: fs(12),
    color: MUTED,
    fontWeight: '600',
    width: wp(21),
    textAlign: 'left',
  },
  wrongPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: wp(5),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.75),
    borderWidth: 2,
    borderColor: RED,
    flex: 1,
  },
  wrongPillText: {fontSize: fs(13), fontWeight: '700', color: RED},
  correctPill: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: wp(5),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.75),
    borderWidth: 2,
    borderColor: GREEN,
    flex: 1,
  },
  correctPillText: {fontSize: fs(13), fontWeight: '700', color: GREEN},

  // ── Visste du att ─────────────────────────────────────────────────────────────
  funFact: {
    backgroundColor: 'rgba(255,255,255,0.78)',
    borderRadius: wp(3.5),
    padding: wp(3.5),
    marginBottom: hp(1.7),
    borderWidth: 1.5,
    borderColor: GOLD,
    elevation: 3,
    shadowColor: '#8A6A00',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.10,
    shadowRadius: 4,
  },
  funFactLabel: {
    fontSize: fs(10),
    fontWeight: '800',
    color: GOLD,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: hp(0.75),
  },
  funFactText: {fontSize: fs(13), color: DARK, lineHeight: fs(19)},

  // ── Nästa/Stäng ───────────────────────────────────────────────────────────────
  nextBtn: {
    backgroundColor: GOLD,
    borderRadius: 50,
    paddingVertical: hp(1.85),
    paddingHorizontal: wp(12),
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 8,
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0,0,0,0.30)',
  },
  nextBtnHighlight: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: hp(2.7),
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 50,
  },
  nextBtnText: {
    color: '#1a0f00',
    fontSize: fs(15),
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
