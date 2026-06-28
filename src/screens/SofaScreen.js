import React, {useState, useRef, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  Image,
  Animated,
  SafeAreaView,
  Dimensions,
} from 'react-native';

import Svg, {Circle} from 'react-native-svg';
import {useQuestions} from '../hooks/useQuestions';
import {categoryLabel, t} from '../utils/i18n';

const BG       = require('../../assets/images/malmo5.jpg');
const POPUP_BG = require('../../assets/images/gronbg.jpg');

const GOLD  = '#C8A840';
const DARK  = '#2C1E0F';
const GREEN = '#27AE60';
const RED   = '#E74C3C';

function loc(obj, lang) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[lang] || obj.sv || '';
}

function shuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Cirkulär progress-ring ───────────────────────────────────────────────────
const RING_SIZE = 88;
const RING_STROKE = 9;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRC = 2 * Math.PI * RING_R;

function ProgressRing({current, total}) {
  const progress = total > 0 ? current / total : 0;
  const dash = progress * RING_CIRC;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(scale, {toValue: 1.15, duration: 120, useNativeDriver: true}),
      Animated.spring(scale, {toValue: 1, friction: 5, useNativeDriver: true}),
    ]).start();
  }, [current]);

  return (
    <Animated.View style={[styles.ringWrap, {transform: [{scale}]}]}>
      <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
        {/* Bakgrundscirkel */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke="rgba(255,255,255,0.15)" strokeWidth={RING_STROKE} fill="none"
        />
        {/* Skugga-båge (offset för djup) */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke="rgba(0,0,0,0.18)" strokeWidth={RING_STROKE + 2} fill="none"
          strokeDasharray={`${dash} ${RING_CIRC}`}
          strokeLinecap="round"
          rotation="-89"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
        {/* Progress-båge */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke={GOLD} strokeWidth={RING_STROKE} fill="none"
          strokeDasharray={`${dash} ${RING_CIRC}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
        {/* Highlight-båge (vit reflex uppe) */}
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_R}
          stroke="rgba(255,255,255,0.30)" strokeWidth={3} fill="none"
          strokeDasharray={`${Math.min(dash, 18)} ${RING_CIRC}`}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <Text style={styles.ringNum}>{current}</Text>
    </Animated.View>
  );
}

// ─── Poängstapel ─────────────────────────────────────────────────────────────
function ScoreBar({count, total, color, align}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const maxWidth = 80;

  useEffect(() => {
    const target = total > 0 ? (count / total) * maxWidth : 0;
    Animated.spring(widthAnim, {toValue: target, friction: 6, useNativeDriver: false}).start();
  }, [count, total]);

  return (
    <View style={[styles.barWrap, align === 'right' && styles.barWrapRight]}>
      <Text style={[styles.barCount, {color}]}>{count}</Text>
      <View style={styles.barTrack}>
        <Animated.View style={[styles.barFill, {backgroundColor: color, width: widthAnim}]} />
      </View>
    </View>
  );
}

// ─── Svarsknapp med press-animation ──────────────────────────────────────────
function AnswerBtn({label, onPress, state}) {
  const scale = useRef(new Animated.Value(1)).current;

  function handlePressIn() {
    Animated.spring(scale, {toValue: 0.96, friction: 8, useNativeDriver: true}).start();
  }
  function handlePressOut() {
    Animated.spring(scale, {toValue: 1, friction: 6, useNativeDriver: true}).start();
  }

  const bgColor = state === 'correct' ? 'rgba(39,174,96,0.15)'
                : state === 'wrong'   ? 'rgba(231,76,60,0.15)'
                : '#fff';
  const textColor = state === 'correct' ? GREEN
                  : state === 'wrong'   ? RED
                  : DARK;
  const borderColor = state === 'correct' ? GREEN
                    : state === 'wrong'   ? RED
                    : 'rgba(200,168,64,0.30)';

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity
        style={[styles.optBtn, {backgroundColor: bgColor, borderColor}]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={state !== 'idle'}>
        <Text style={[styles.optText, {color: textColor}]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Huvudskärm ───────────────────────────────────────────────────────────────
export default function SofaScreen({lang, onGoHome}) {
  const {questions, loading} = useQuestions();
  const [sessionSeed, setSessionSeed] = useState(() => Date.now());
  const [idx, setIdx]           = useState(0);
  const [selected, setSelected] = useState(null);
  const [pending,  setPending]  = useState(null);
  const [correct, setCorrect]   = useState(0);
  const [wrong, setWrong]       = useState(0);
  const [finished, setFinished] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});

  const iconScale  = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0)).current;
  const popupSlide = useRef(new Animated.Value(500)).current;

  const shuffled = useMemo(() => shuffle(questions, sessionSeed).slice(0, 20), [questions, sessionSeed]);
  const total    = shuffled.length;
  const q        = shuffled[idx];
  const answered = selected !== null;

  const options = useMemo(() => {
    if (!q) return [];
    const opts = q.options?.[lang] || q.options?.sv || [];
    return shuffle(opts, idx * 999);
  }, [q, lang, idx]);

  function animateResult() {
    iconScale.setValue(0);
    scoreScale.setValue(0);
    popupSlide.setValue(500);
    Animated.spring(iconScale, {toValue: 1, friction: 5, tension: 80, useNativeDriver: true}).start();
    setTimeout(() => {
      Animated.spring(scoreScale, {toValue: 1, friction: 5, tension: 60, useNativeDriver: true}).start();
      Animated.spring(popupSlide, {toValue: 0, friction: 8, tension: 50, useNativeDriver: true}).start();
    }, 300);
  }

  function handleAnswer(opt) {
    if (answered || pending) return;
    setPending(opt);
    setTimeout(() => {
      const correctAns = loc(q.correctAnswer, lang);
      const isCorrect  = opt === correctAns;
      const cat = q.category || 'Övrigt';
      setSelected(opt);
      setPending(null);
      if (isCorrect) setCorrect(c => c + 1);
      else           setWrong(w => w + 1);
      setCategoryStats(prev => ({
        ...prev,
        [cat]: {
          correct: (prev[cat]?.correct || 0) + (isCorrect ? 1 : 0),
          total:   (prev[cat]?.total   || 0) + 1,
        },
      }));
      animateResult();
    }, 420);
  }

  function handleNext() {
    if (idx + 1 >= total) { setFinished(true); return; }
    setIdx(i => i + 1);
    setSelected(null);
  }

  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!finished) return;
    setDisplayScore(0);
    let current = 0;
    const step = () => {
      current += 1;
      setDisplayScore(current);
      if (current < correct) setTimeout(step, 120);
    };
    if (correct > 0) setTimeout(step, 400);
  }, [finished, correct]);

  function handlePlayAgain() {
    setSessionSeed(Date.now());
    setIdx(0);
    setSelected(null);
    setPending(null);
    setCorrect(0);
    setWrong(0);
    setFinished(false);
    setCategoryStats({});
    setDisplayScore(0);
  }

  if (loading) {
    return (
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <View style={styles.center}><Text style={styles.loadingText}>{t(lang, 'loadingQuestions')}</Text></View>
      </ImageBackground>
    );
  }

  if (finished) {
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const catEntries = Object.entries(categoryStats).sort((a, b) => a[0].localeCompare(b[0]));
    return (
      <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
        <SafeAreaView style={[styles.safeArea, {paddingTop: 32}]}>

          {/* ── Poängcirkel ── */}
          <View style={styles.scoreBubble}>
            <View style={styles.scoreBubbleInner}>
              <Text style={styles.scoreBubbleLabel}>{t(lang, 'sofaYourResult')}</Text>
              <Text style={styles.scoreBubbleNum}>{displayScore}</Text>
              <Text style={styles.scoreBubbleOf}>{t(lang, 'sofaOfPoints').replace('{total}', total)}</Text>
            </View>
          </View>

          {/* ── Statistik-kort ── */}
          <View style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statCell}>
                <Text style={[styles.statNum, {color: GREEN}]}>{correct}</Text>
                <Text style={styles.statLbl}>{t(lang, 'sofaRight')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statNum, {color: RED}]}>{wrong}</Text>
                <Text style={styles.statLbl}>{t(lang, 'sofaWrongCount')}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCell}>
                <Text style={[styles.statNum, {color: GOLD}]}>{pct}%</Text>
                <Text style={styles.statLbl}>{t(lang, 'sofaRightShare')}</Text>
              </View>
            </View>
          </View>

          {/* ── Kategori-breakdown ── */}
          {catEntries.length > 0 && (
            <View style={styles.catCard}>
              <Text style={styles.catTitle}>{t(lang, 'sofaCategoryResult')}</Text>
              {catEntries.map(([cat, s]) => (
                <View key={cat} style={styles.catRow}>
                  <Text style={styles.catName}>{cat}</Text>
                  <Text style={[styles.catScore,
                    {color: s.correct === s.total ? GREEN : s.correct === 0 ? RED : GOLD}]}>
                    {s.correct}/{s.total}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Knappar ── */}
          <TouchableOpacity style={styles.nextBtn} onPress={handlePlayAgain} activeOpacity={0.85}>
            <View style={styles.nextHighlight} />
            <Text style={styles.nextText}>{t(lang, 'sofaPlayAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={onGoHome} activeOpacity={0.85}>
            <Text style={styles.homeBtnText}>{t(lang, 'sofaBackToStart')}</Text>
          </TouchableOpacity>

        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!q) return null;
  const correctAns = loc(q.correctAnswer, lang);
  const isCorrect  = selected === correctAns;
  const fact       = loc(q.funFact, lang);

  return (
    <ImageBackground source={BG} style={styles.bg} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>

        {/* ── Hem-knapp (absolut, stör inte layouten) ── */}
        <TouchableOpacity style={styles.homeIcon} onPress={onGoHome}>
          <Text style={styles.homeIconText}>⌂</Text>
        </TouchableOpacity>

        {/* ── Toprad: stapel rätt | ring | stapel fel ── */}
        <View style={styles.topRow}>
          <ScoreBar count={correct} total={total} color={GREEN} align="left" />
          <View style={styles.ringArea}>
            <ProgressRing current={idx + 1} total={total} />
            <Text style={styles.ringLabel}>{t(lang, 'questionOf').replace('{n}', idx + 1).replace('{total}', total)}</Text>
          </View>
          <ScoreBar count={wrong} total={total} color={RED} align="right" />
        </View>

        {/* ── Frågeskärm ── */}
        <View style={styles.content}>
          <View style={styles.questionCard}>
            <View style={styles.questionMeta}>
              {q.category ? (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{categoryLabel(lang, q.category)}</Text>
                </View>
              ) : null}
              <Text style={styles.locationLabel}>{loc(q.title, lang)}</Text>
            </View>
            <Text style={styles.questionText}>{loc(q.question, lang)}</Text>
          </View>

          {!answered && (
            <View style={styles.options}>
              {options.map((opt, i) => {
                const correctAns = loc(q.correctAnswer, lang);
                const state = pending === opt ? (opt === correctAns ? 'correct' : 'wrong')
                            : pending !== null ? 'idle'
                            : 'idle';
                return (
                  <AnswerBtn key={i} label={opt} state={state} onPress={() => handleAnswer(opt)} />
                );
              })}
            </View>
          )}
        </View>

        {/* ── Popup-overlay (glider upp när svar ges) ── */}
        {answered && (
          <Animated.View style={[styles.popupOverlay, {transform: [{translateY: popupSlide}]}]}>
            <ImageBackground source={POPUP_BG} style={styles.popupBg} imageStyle={styles.popupBgImg} resizeMode="cover">

              {/* Frågan */}
              <View style={styles.factCard}>
                <Text style={styles.popupQuestion}>{loc(q.question, lang)}</Text>
              </View>

              {/* Rätt/Fel-etikett */}
              <Text style={[styles.popupLabel, {color: isCorrect ? '#7EE8A2' : '#FF8080'}]}>
                {isCorrect ? `✓  ${t(lang, 'sofaCorrect')}` : `✗  ${t(lang, 'sofaWrong')}`}
              </Text>

              {/* Rätt svar: poäng */}
              {isCorrect && (
                <Animated.View style={[styles.scoreWrap, {transform: [{scale: scoreScale}]}]}>
                  <Text style={styles.scoreNum}>+1</Text>
                  <Text style={styles.scoreLbl}>{t(lang, 'score').toUpperCase()}</Text>
                </Animated.View>
              )}

              {/* Fel svar: pills */}
              {!isCorrect && (
                <View style={styles.answerRows}>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLbl}>{t(lang, 'sofaYourAnswer')}</Text>
                    <View style={styles.wrongPill}><Text style={styles.wrongPillText}>✗  {selected}</Text></View>
                  </View>
                  <View style={styles.answerRow}>
                    <Text style={styles.answerLbl}>{t(lang, 'sofaRightAnswer')}</Text>
                    <View style={styles.correctPill}><Text style={styles.correctPillText}>✓  {correctAns}</Text></View>
                  </View>
                </View>
              )}

              {/* Visste du att */}
              {fact ? (
                <View style={styles.factCard}>
                  <Text style={styles.factLabel}>{t(lang, 'sofaDidYouKnow')}</Text>
                  <Text style={styles.factText}>{fact}</Text>
                </View>
              ) : null}

              {/* Nästa knapp */}
              <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.85}>
                <View style={styles.nextHighlight} />
                <Text style={styles.nextText}>
                  {idx + 1 >= total ? t(lang, 'seeResult') : t(lang, 'nextQuestion')}
                </Text>
              </TouchableOpacity>

            </ImageBackground>
          </Animated.View>
        )}

      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg:       {flex: 1},
  safeArea: {flex: 1, paddingHorizontal: 20, paddingTop: 64},
  center:   {flex: 1, alignItems: 'center', justifyContent: 'center'},
  loadingText: {color: '#fff', fontSize: 16, fontWeight: '600'},

  // ── Toprad ──────────────────────────────────────────────────────────────────
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  barWrap: {alignItems: 'flex-start', flex: 1},
  barWrapRight: {alignItems: 'flex-end'},
  barCount: {fontSize: 22, fontWeight: '900', lineHeight: 26},
  barTrack: {
    width: 80, height: 8, backgroundColor: 'rgba(255,255,255,0.20)',
    borderRadius: 4, overflow: 'hidden', marginTop: 4,
  },
  barFill: {height: 8, borderRadius: 4},

  ringArea: {alignItems: 'center'},
  ringWrap: {
    width: RING_SIZE, height: RING_SIZE,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.42)',
    borderRadius: RING_SIZE / 2,
    elevation: 12,
    shadowColor: GOLD,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
  ringNum:   {fontSize: 24, fontWeight: '900', color: '#fff'},
  ringLabel: {fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 4},

  content: {paddingTop: 28},

  // ── Popup-overlay ────────────────────────────────────────────────────────────
  popupOverlay: {
    position: 'absolute', left: 0, right: 0, bottom: 0, top: 183,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
    elevation: 20,
  },
  popupBg: {
    flex: 1, paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28,
  },
  popupBgImg: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  popupQuestion: {
    fontSize: 16, fontWeight: '700', color: '#fff',
    lineHeight: 22, marginBottom: 16,
    opacity: 0.9,
  },
  popupLabel: {
    fontSize: 22, fontWeight: '900', marginBottom: 12, letterSpacing: -0.3,
  },

  // ── Fråga ────────────────────────────────────────────────────────────────────
  questionCard: {
    backgroundColor: 'rgba(10,6,0,0.88)',
    borderRadius: 18, padding: 24, marginBottom: 20,
  },
  questionMeta: {marginBottom: 14, gap: 6},
  categoryBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(200,168,64,0.20)',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(200,168,64,0.50)',
  },
  categoryIcon: {fontSize: 14},
  categoryText: {fontSize: 12, fontWeight: '700', color: GOLD, letterSpacing: 0.5},
  locationLabel: {
    fontSize: 13, fontWeight: '700', color: 'rgba(255,255,255,0.60)',
    letterSpacing: 0.3,
  },
  questionText: {fontSize: 22, fontWeight: '800', color: '#fff', lineHeight: 30},

  // ── Alternativ ───────────────────────────────────────────────────────────────
  options: {gap: 10},
  optBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 18, paddingHorizontal: 20,
    borderWidth: 1.5, borderColor: 'rgba(200,168,64,0.30)',
    elevation: 2,
    shadowColor: '#000', shadowOffset:{width:0,height:1}, shadowOpacity:0.08, shadowRadius:3,
  },
  optText: {fontSize: 16, fontWeight: '600', color: DARK},

  // ── Resultat (i popup) ───────────────────────────────────────────────────────
  scoreWrap: {alignItems: 'center', marginBottom: 16},
  scoreNum:  {fontSize: 48, fontWeight: '900', color: GOLD, lineHeight: 52, letterSpacing: -2},
  scoreLbl:  {fontSize: 11, fontWeight: '800', color: GOLD, letterSpacing: 2.5, marginTop: -4},
  answerRows: {gap: 8, marginBottom: 16},
  answerRow:  {flexDirection: 'row', alignItems: 'center', gap: 10},
  answerLbl:  {fontSize: 12, color: 'rgba(255,255,255,0.70)', fontWeight: '600', width: 76},
  wrongPill: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#FF8080',
  },
  wrongPillText:  {fontSize: 13, fontWeight: '700', color: '#FF8080'},
  correctPill: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.30)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderColor: '#7EE8A2',
  },
  correctPillText: {fontSize: 13, fontWeight: '700', color: '#7EE8A2'},

  // ── Visste du att (i popup) ──────────────────────────────────────────────────
  factCard: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  factLabel: {fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.60)', letterSpacing: 1.2, marginBottom: 6},
  factText:  {fontSize: 13, color: 'rgba(255,255,255,0.90)', lineHeight: 19},

  // ── Nästa / Hem ──────────────────────────────────────────────────────────────
  nextBtn: {
    backgroundColor: GOLD, borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    overflow: 'hidden', elevation: 10,
    borderBottomWidth: 4, borderBottomColor: 'rgba(0,0,0,0.30)',
    marginTop: 8,
  },
  nextHighlight: {
    position: 'absolute', top: 0, left: 0, right: 0, height: 22,
    backgroundColor: 'rgba(255,255,255,0.28)', borderRadius: 50,
  },
  nextText: {color: '#1a0f00', fontSize: 16, fontWeight: '800', letterSpacing: 0.5},
  homeIcon: {
    position: 'absolute', top: 12, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.40)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  homeIconText: {fontSize: 20, color: '#fff'},

  // ── Avslutsskärm ─────────────────────────────────────────────────────────────
  scoreBubble: {
    alignSelf: 'center',
    width: 190, height: 190, borderRadius: 95,
    backgroundColor: 'rgba(200,168,64,0.18)',
    borderWidth: 2, borderColor: 'rgba(200,168,64,0.40)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20, elevation: 20,
    shadowColor: GOLD, shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.55, shadowRadius: 20,
  },
  scoreBubbleInner: {
    width: 162, height: 162, borderRadius: 81,
    backgroundColor: 'rgba(10,6,0,0.92)',
    borderWidth: 2.5, borderColor: GOLD,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8,
    shadowColor: GOLD, shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.6, shadowRadius: 10,
  },
  scoreBubbleLabel: {fontSize: 12, color: 'rgba(255,255,255,0.60)', fontWeight: '600', letterSpacing: 0.5},
  scoreBubbleNum:   {fontSize: 64, fontWeight: '900', color: GOLD, lineHeight: 68, letterSpacing: -3},
  scoreBubbleOf:    {fontSize: 11, color: 'rgba(255,255,255,0.50)', fontWeight: '600'},

  statsCard: {
    backgroundColor: 'rgba(10,6,0,0.88)',
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(200,168,64,0.30)',
  },
  statsRow: {flexDirection: 'row', alignItems: 'center'},
  statCell: {flex: 1, alignItems: 'center'},
  statDivider: {width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.15)'},
  statNum: {fontSize: 28, fontWeight: '900', lineHeight: 32},
  statLbl: {fontSize: 11, color: 'rgba(255,255,255,0.60)', fontWeight: '600', marginTop: 2},

  catCard: {
    backgroundColor: 'rgba(10,6,0,0.88)',
    borderRadius: 16, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(200,168,64,0.30)',
  },
  catTitle: {fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.5, marginBottom: 10},
  catRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)'},
  catName: {fontSize: 14, color: '#fff', fontWeight: '600'},
  catScore: {fontSize: 15, fontWeight: '800'},

  homeBtn: {
    marginTop: 10, alignItems: 'center', paddingVertical: 14,
    borderRadius: 50, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.30)',
  },
  homeBtnText: {color: 'rgba(255,255,255,0.80)', fontSize: 15, fontWeight: '700'},
});
