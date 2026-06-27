import { AppLanguage } from './types'

const languages = {
  sv: 'Svenska',
  en: 'English',
  de: 'Deutsch',
} satisfies Record<AppLanguage, string>

const copy = {
  subtitle: {
    sv: 'Uppt\u00e4ck Malm\u00f6 till fots med karta, platsl\u00e5s och smart quizfl\u00f6de.',
    en: 'Explore Malm\u00f6 on foot with maps, geofencing, and a smart quiz flow.',
    de: 'Entdecke Malm\u00f6 zu Fu\u00df mit Karte, Ortsfreigabe und smartem Quizfluss.',
  },
  progressPlaces: {
    sv: 'platser klara',
    en: 'places done',
    de: 'Orte fertig',
  },
  progressQuestions: {
    sv: 'fr\u00e5gor klara',
    en: 'questions done',
    de: 'Fragen fertig',
  },
  allTours: {
    sv: 'Alla rundor',
    en: 'All routes',
    de: 'Alle Routen',
  },
  allToursDescription: {
    sv: 'Visa hela quizkartan i Malm\u00f6.',
    en: 'Show the full Malm\u00f6 quiz map.',
    de: 'Zeige die gesamte Quizkarte von Malm\u00f6.',
  },
  tooFarTitle: {
    sv: 'F\u00f6r l\u00e5ngt bort',
    en: 'Too far away',
    de: 'Zu weit entfernt',
  },
  tooFarMessage: {
    sv: 'Du m\u00e5ste g\u00e5 n\u00e4rmare platsen f\u00f6r att l\u00e5sa upp fr\u00e5gan!',
    en: 'You need to move closer to unlock this question!',
    de: 'Du musst n\u00e4her an den Ort gehen, um die Frage freizuschalten!',
  },
  requestingLocation: {
    sv: 'Beg\u00e4r plats\u00e5tkomst...',
    en: 'Requesting location access...',
    de: 'Standortfreigabe wird angefordert...',
  },
  locatingUser: {
    sv: 'H\u00e4mtar din position i Malm\u00f6...',
    en: 'Finding your position in Malm\u00f6...',
    de: 'Deine Position in Malm\u00f6 wird ermittelt...',
  },
  locationDenied: {
    sv: 'Plats\u00e5tkomst beh\u00f6vs f\u00f6r GPS-uppl\u00e5sning av quizpunkter.',
    en: 'Location access is required to unlock GPS-based quiz spots.',
    de: 'Standortzugriff wird ben\u00f6tigt, um GPS-basierte Quizpunkte freizuschalten.',
  },
  nearestQuiz: {
    sv: 'N\u00e4rmsta plats:',
    en: 'Nearest place:',
    de: 'N\u00e4chster Ort:',
  },
  nextStop: {
    sv: 'N\u00e4sta stopp:',
    en: 'Next stop:',
    de: 'N\u00e4chster Stopp:',
  },
  readyToSolve: {
    sv: 'Redo att l\u00f6sa:',
    en: 'Ready to solve:',
    de: 'Bereit zum L\u00f6sen:',
  },
  citywideSection: {
    sv: 'Platsoberoende fr\u00e5gor',
    en: 'Location-free questions',
    de: 'Ortsunabh\u00e4ngige Fragen',
  },
  openAnywhere: {
    sv: '\u00d6ppna var som helst i Malm\u00f6',
    en: 'Open from anywhere in Malm\u00f6',
    de: 'Von \u00fcberall in Malm\u00f6 \u00f6ffnen',
  },
  centerCity: {
    sv: 'Centrera Malm\u00f6',
    en: 'Center Malm\u00f6',
    de: 'Malm\u00f6 zentrieren',
  },
  centerMe: {
    sv: 'Min plats',
    en: 'My location',
    de: 'Mein Standort',
  },
  completed: {
    sv: 'Klar',
    en: 'Completed',
    de: 'Abgeschlossen',
  },
  loadingState: {
    sv: 'L\u00e4ser sparad status...',
    en: 'Loading saved progress...',
    de: 'Gespeicherter Fortschritt wird geladen...',
  },
  markerLocked: {
    sv: 'L\u00e5st',
    en: 'Locked',
    de: 'Gesperrt',
  },
  markerNearby: {
    sv: 'Inom 100 m',
    en: 'Within 100 m',
    de: 'Innerhalb von 100 m',
  },
  markerUnlocked: {
    sv: 'Uppl\u00e5st',
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
    sv: 'Fr\u00e5ga',
    en: 'Question',
    de: 'Frage',
  },
  questionCounter: {
    sv: 'Fr\u00e5ga',
    en: 'Question',
    de: 'Frage',
  },
  trueLabel: {
    sv: 'Sant',
    en: 'True',
    de: 'Wahr',
  },
  falseLabel: {
    sv: 'Falskt',
    en: 'False',
    de: 'Falsch',
  },
  selectedOrder: {
    sv: 'Vald ordning',
    en: 'Selected order',
    de: 'Gew\u00e4hlte Reihenfolge',
  },
  sortPlaceholder: {
    sv: 'V\u00e4lj delarna i den ordning du tycker att de ska ligga.',
    en: 'Tap the items in the order you think is correct.',
    de: 'Tippe die Elemente in der Reihenfolge an, die du f\u00fcr richtig h\u00e4ltst.',
  },
  sortUndo: {
    sv: 'Ta bort senaste',
    en: 'Undo last',
    de: 'Letztes entfernen',
  },
  sortClear: {
    sv: 'Rensa allt',
    en: 'Clear all',
    de: 'Alles leeren',
  },
  checkOrder: {
    sv: 'Kontrollera ordning',
    en: 'Check order',
    de: 'Reihenfolge pr\u00fcfen',
  },
  findDetailHint: {
    sv: 'Tryck direkt p\u00e5 bilden d\u00e4r du tror att detaljen finns.',
    en: 'Tap directly on the image where you think the detail is.',
    de: 'Tippe direkt auf das Bild, wo du das Detail vermutest.',
  },
  didYouKnow: {
    sv: 'Visste du att?',
    en: 'Did you know?',
    de: 'Wusstest du schon?',
  },
  nextQuestion: {
    sv: 'N\u00e4sta fr\u00e5ga',
    en: 'Next question',
    de: 'N\u00e4chste Frage',
  },
  finishLocation: {
    sv: 'Avsluta platsen',
    en: 'Finish place',
    de: 'Ort abschlie\u00dfen',
  },
  locationComplete: {
    sv: 'Alla fr\u00e5gor p\u00e5 platsen \u00e4r nu l\u00f6sta.',
    en: 'All questions at this place are now solved.',
    de: 'Alle Fragen an diesem Ort sind jetzt gel\u00f6st.',
  },
  forceOpenHeading: {
    sv: 'Du \u00e4r n\u00e4ra nog att \u00f6ppna fr\u00e5gan manuellt.',
    en: 'You are close enough to force open this question.',
    de: 'Du bist nah genug, um diese Frage manuell zu \u00f6ffnen.',
  },
  forceOpenBody: {
    sv: 'Vissa platser kan vara sv\u00e5ra att n\u00e5 exakt. Du kan \u00f6ppna fr\u00e5gan redan inom 100 meter.',
    en: 'Some places are hard to reach exactly. You can open the question from within 100 meters.',
    de: 'Manche Orte sind schwer exakt zu erreichen. Du kannst die Frage bereits innerhalb von 100 Metern \u00f6ffnen.',
  },
  forceOpenButton: {
    sv: '\u00d6ppna \u00e4nd\u00e5',
    en: 'Force open',
    de: 'Trotzdem \u00f6ffnen',
  },
  submitCorrect: {
    sv: 'R\u00e4tt svar',
    en: 'Correct answer',
    de: 'Richtige Antwort',
  },
  submitWrong: {
    sv: 'F\u00f6rs\u00f6k igen',
    en: 'Try again',
    de: 'Versuch es erneut',
  },
  successMessage: {
    sv: 'Snyggt! Den h\u00e4r fr\u00e5gan \u00e4r nu avklarad.',
    en: 'Nice work! This question is now completed.',
    de: 'Gut gemacht! Diese Frage ist jetzt abgeschlossen.',
  },
  solvedCard: {
    sv: 'Alla fr\u00e5gor f\u00f6r den h\u00e4r platsen \u00e4r redan avklarade.',
    en: 'All questions for this place have already been completed.',
    de: 'Alle Fragen zu diesem Ort wurden bereits abgeschlossen.',
  },
  close: {
    sv: 'St\u00e4ng',
    en: 'Close',
    de: 'Schlie\u00dfen',
  },
  distanceLabel: {
    sv: 'Avst\u00e5nd',
    en: 'Distance',
    de: 'Entfernung',
  },
  imageMissing: {
    sv: 'Ingen bild tillagd \u00e4nnu.',
    en: 'No image added yet.',
    de: 'Noch kein Bild hinzugef\u00fcgt.',
  },
  routeProgress: {
    sv: 'Rundprogress',
    en: 'Route progress',
    de: 'Routenfortschritt',
  },
} satisfies Record<string, Record<AppLanguage, string>>

export function translate(key: keyof typeof copy, language: AppLanguage) {
  return copy[key][language]
}

export function formatDistance(distanceMeters: number, language: AppLanguage) {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)} m`
  }

  const value = `${(distanceMeters / 1000).toFixed(1)} km`
  return language === 'sv' ? value.replace('.', ',') : value
}

export { copy, languages }
