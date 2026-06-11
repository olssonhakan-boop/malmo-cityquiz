import { AppLanguage } from './types'

const languages = {
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
} satisfies Record<AppLanguage, string>

const copy = {
  subtitle: {
    sv: 'Upptäck Malmö till fots med karta, platslås och smart quizflöde.',
    en: 'Explore Malmö on foot with maps, geofencing, and a smart quiz flow.',
    de: 'Entdecke Malmö zu Fuß mit Karte, Ortsfreigabe und smartem Quizfluss.',
  },
  done: {
    sv: 'klara',
    en: 'done',
    de: 'fertig',
  },
  tooFarTitle: {
    sv: 'För långt bort',
    en: 'Too far away',
    de: 'Zu weit entfernt',
  },
  tooFarMessage: {
    sv: 'Du måste gå närmare platsen för att låsa upp frågan!',
    en: 'You need to move closer to unlock this question!',
    de: 'Du musst näher an den Ort gehen, um die Frage freizuschalten!',
  },
  requestingLocation: {
    sv: 'Begär platsåtkomst...',
    en: 'Requesting location access...',
    de: 'Standortfreigabe wird angefordert...',
  },
  locatingUser: {
    sv: 'Hämtar din position i Malmö...',
    en: 'Finding your position in Malmö...',
    de: 'Deine Position in Malmö wird ermittelt...',
  },
  locationDenied: {
    sv: 'Platsåtkomst behövs för GPS-upplåsning av quizpunkter.',
    en: 'Location access is required to unlock GPS-based quiz spots.',
    de: 'Standortzugriff wird benötigt, um GPS-basierte Quizpunkte freizuschalten.',
  },
  nearestQuiz: {
    sv: 'Närmsta quizpunkt:',
    en: 'Nearest quiz spot:',
    de: 'Nächster Quizpunkt:',
  },
  readyToSolve: {
    sv: 'Redo att lösas:',
    en: 'Ready to solve:',
    de: 'Bereit zum Lösen:',
  },
  citywideSection: {
    sv: 'Stadsgemensamma frågor',
    en: 'Citywide questions',
    de: 'Stadtweite Fragen',
  },
  openAnywhere: {
    sv: 'Öppna var som helst i Malmö',
    en: 'Open from anywhere in Malmö',
    de: 'Von überall in Malmö öffnen',
  },
  completed: {
    sv: 'Klar',
    en: 'Completed',
    de: 'Abgeschlossen',
  },
  loadingState: {
    sv: 'Läser sparad status...',
    en: 'Loading saved progress...',
    de: 'Gespeicherter Fortschritt wird geladen...',
  },
  markerLocked: {
    sv: 'Låst',
    en: 'Locked',
    de: 'Gesperrt',
  },
  markerNearby: {
    sv: 'Inom 100 m',
    en: 'Within 100 m',
    de: 'Innerhalb von 100 m',
  },
  markerUnlocked: {
    sv: 'Upplåst',
    en: 'Unlocked',
    de: 'Freigeschaltet',
  },
  markerCompleted: {
    sv: 'Avklarad',
    en: 'Completed',
    de: 'Abgeschlossen',
  },
  markerCitywide: {
    sv: 'Stadsquiz',
    en: 'Citywide',
    de: 'Stadtquiz',
  },
  quizQuestion: {
    sv: 'Fråga',
    en: 'Question',
    de: 'Frage',
  },
  forceOpenHeading: {
    sv: 'Du är nära nog att öppna frågan manuellt.',
    en: 'You are close enough to force open this question.',
    de: 'Du bist nah genug, um diese Frage manuell zu öffnen.',
  },
  forceOpenBody: {
    sv: 'Vissa platser kan vara svåra att nå exakt. Du kan öppna frågan redan inom 100 meter.',
    en: 'Some places are hard to reach exactly. You can open the question from within 100 meters.',
    de: 'Manche Orte sind schwer exakt zu erreichen. Du kannst die Frage bereits innerhalb von 100 Metern öffnen.',
  },
  forceOpenButton: {
    sv: 'Öppna ändå',
    en: 'Force open',
    de: 'Trotzdem öffnen',
  },
  submitCorrect: {
    sv: 'Rätt svar',
    en: 'Correct answer',
    de: 'Richtige Antwort',
  },
  submitWrong: {
    sv: 'Försök igen',
    en: 'Try again',
    de: 'Versuch es erneut',
  },
  successMessage: {
    sv: 'Snyggt! Platsen är nu markerad som avklarad.',
    en: 'Nice work! This location is now marked as completed.',
    de: 'Gut gemacht! Dieser Ort ist jetzt als abgeschlossen markiert.',
  },
  solvedCard: {
    sv: 'Den här frågan är redan avklarad.',
    en: 'This question has already been completed.',
    de: 'Diese Frage wurde bereits abgeschlossen.',
  },
  close: {
    sv: 'Stäng',
    en: 'Close',
    de: 'Schließen',
  },
  distanceLabel: {
    sv: 'Avstånd',
    en: 'Distance',
    de: 'Entfernung',
  },
  imageMissing: {
    sv: 'Ingen bild tillagd ännu.',
    en: 'No image added yet.',
    de: 'Noch kein Bild hinzugefügt.',
  },
} satisfies Record<string, Record<AppLanguage, string>>

export function translate(
  key: keyof typeof copy,
  language: AppLanguage
) {
  return copy[key][language]
}

export function formatDistance(
  distanceMeters: number,
  language: AppLanguage
) {
  if (distanceMeters < 1000) {
    const value = `${Math.round(distanceMeters)} m`
    return value
  }

  const value = `${(distanceMeters / 1000).toFixed(1)} km`
  return language === 'sv' ? value.replace('.', ',') : value
}

export { copy, languages }
