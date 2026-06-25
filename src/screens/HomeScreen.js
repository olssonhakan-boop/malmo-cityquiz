import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {t, categoryLabel} from '../utils/i18n';
import {useQuestions} from '../hooks/useQuestions';
import LanguagePicker from '../components/LanguagePicker';

const COMPLETED_KEY = 'malmo_completed';
const SCORE_KEY = 'malmo_score';
const ONBOARDING_KEY = 'malmo_onboarding_done';

export default function HomeScreen({lang, onLangChange, selectedCategories, onCategoriesChange, onStart}) {
  const [score, setScore] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const {questions} = useQuestions();
  const totalCount = questions.length;

  const allCategories = [...new Set(questions.map(q => q.category).filter(Boolean))].sort();

  useEffect(() => {
    async function loadData() {
      const [scoreVal, completedVal, onboardingDone] = await Promise.all([
        AsyncStorage.getItem(SCORE_KEY),
        AsyncStorage.getItem(COMPLETED_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      setScore(scoreVal ? parseInt(scoreVal, 10) : 0);
      setCompletedCount(completedVal ? JSON.parse(completedVal).length : 0);
      if (!onboardingDone) {
        setShowOnboarding(true);
      }
    }
    loadData();
  }, []);

  function toggleCategory(cat) {
    if (selectedCategories.includes(cat)) {
      onCategoriesChange(selectedCategories.filter(c => c !== cat));
    } else {
      onCategoriesChange([...selectedCategories, cat]);
    }
  }

  function handleReset() {
    Alert.alert(
      t(lang, 'resetProgress'),
      t(lang, 'resetConfirm'),
      [
        {text: t(lang, 'resetNo'), style: 'cancel'},
        {
          text: t(lang, 'resetYes'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([SCORE_KEY, COMPLETED_KEY]);
            setScore(0);
            setCompletedCount(0);
          },
        },
      ],
    );
  }

  async function finishOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    setShowOnboarding(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Malmö CityQuiz</Text>
          <Text style={styles.headerSub}>Utforska staden — svara på frågor</Text>
        </View>
        <LanguagePicker lang={lang} onSelect={onLangChange} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Score card */}
        <View style={styles.scoreCard}>
          <View style={styles.scoreMain}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreLabel}>{t(lang, 'yourScore')}</Text>
          </View>
          <View style={styles.scoreDivider} />
          <View style={styles.scoreMain}>
            <Text style={styles.scoreNumber}>{completedCount}</Text>
            <Text style={styles.scoreLabel}>
              {t(lang, 'placesOf')} {totalCount}
            </Text>
          </View>
        </View>

        {/* Categories */}
        {allCategories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t(lang, 'chooseCategories')}</Text>
            <View style={styles.chips}>
              <TouchableOpacity
                style={[styles.chip, selectedCategories.length === 0 && styles.chipActive]}
                onPress={() => onCategoriesChange([])}>
                <Text style={[styles.chipText, selectedCategories.length === 0 && styles.chipTextActive]}>
                  {t(lang, 'allCategories')}
                </Text>
              </TouchableOpacity>
              {allCategories.map(cat => {
                const active = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.chip, active && styles.chipActive]}
                    onPress={() => toggleCategory(cat)}>
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>
                      {categoryLabel(lang, cat)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Start button */}
        <TouchableOpacity style={styles.startBtn} onPress={onStart}>
          <Text style={styles.startBtnText}>{t(lang, 'startBtn')}</Text>
        </TouchableOpacity>

        {/* Reset */}
        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
          <Text style={styles.resetBtnText}>{t(lang, 'resetProgress')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Onboarding modal */}
      <Modal visible={showOnboarding} transparent animationType="fade">
        <View style={styles.onboardingOverlay}>
          <View style={styles.onboardingCard}>
            <Text style={styles.onboardingTitle}>{t(lang, 'onboardingTitle')}</Text>
            <Text style={styles.onboardingStep}>{t(lang, 'onboardingStep1')}</Text>
            <Text style={styles.onboardingStep}>{t(lang, 'onboardingStep2')}</Text>
            <Text style={styles.onboardingStep}>{t(lang, 'onboardingStep3')}</Text>
            <TouchableOpacity style={styles.onboardingBtn} onPress={finishOnboarding}>
              <Text style={styles.onboardingBtnText}>{t(lang, 'onboardingBtn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f4f6f9'},
  header: {
    backgroundColor: '#003366',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {fontSize: 22, fontWeight: '800', color: '#fff'},
  headerSub: {fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2},
  content: {padding: 20, gap: 20},
  scoreCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  scoreMain: {flex: 1, alignItems: 'center'},
  scoreNumber: {fontSize: 42, fontWeight: '800', color: '#003366'},
  scoreLabel: {fontSize: 13, color: '#666', marginTop: 4, textAlign: 'center'},
  scoreDivider: {width: 1, height: 60, backgroundColor: '#e0e0e0'},
  section: {gap: 12},
  sectionTitle: {fontSize: 15, fontWeight: '700', color: '#333'},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    borderWidth: 1.5,
    borderColor: '#003366',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  chipActive: {backgroundColor: '#003366'},
  chipText: {fontSize: 14, color: '#003366', fontWeight: '600'},
  chipTextActive: {color: '#fff'},
  startBtn: {
    backgroundColor: '#003366',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#003366',
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startBtnText: {fontSize: 18, fontWeight: '800', color: '#fff'},
  resetBtn: {alignItems: 'center', paddingVertical: 8},
  resetBtnText: {fontSize: 13, color: '#999'},
  onboardingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  onboardingCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    width: '100%',
  },
  onboardingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#003366',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 30,
  },
  onboardingStep: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
    marginBottom: 14,
  },
  onboardingBtn: {
    backgroundColor: '#003366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
  },
  onboardingBtnText: {fontSize: 16, fontWeight: '700', color: '#fff'},
});
