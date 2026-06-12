# Malmö CityQuiz

Malmö CityQuiz is a separate Expo / React Native project for an Android-first city quiz experience built around Malmö landmarks.

## Current stack

- Expo
- React Native with TypeScript
- `expo-location` for foreground GPS tracking
- `react-native-webview`
- Leaflet inside a WebView
- OpenStreetMap tiles in Leaflet
- AsyncStorage for local completion progress

## Implemented so far

- Full-screen Malmö map centered on `55.6050, 13.0038`
- Blue user-location dot
- Multiple location-based quiz markers
- Citywide quiz items that can open anywhere in Malmö
- Distance-based unlocking
  - under 30 meters: auto unlock
  - within 100 meters: force open available
- Language selection for Swedish, English, and German
- Stable multilingual answer ids instead of comparing translated answer strings
- Runtime translation fallback if one language is temporarily missing in quiz data
- Multiple questions per location
- Data-driven thematic tours in `data/tours.json`
- Marker states for locked, nearby, unlocked, and completed
- Green completion state after correct answer
- Quick map actions for centering on Malmö or the user's current position
- Data-driven quiz content in [data/quizLocations.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/quizLocations.json)

## Run locally

```bash
cd C:\Users\hakan\OneDrive\Documents\malmo-cityquiz
npm install
npm run start
```

## Validate

```bash
npm run doctor
npm run validate:content
npm run export:android
```

## Editing quiz content

Update [data/quizLocations.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/quizLocations.json).

- To create a location-based quiz, provide `latitude` and `longitude`.
- To create a citywide quiz, set both coordinates to `null`.
- Add optional `imageUri` values for photos.
- Recommended: use `options[]` plus `correctOptionId` instead of localized `correctAnswer` strings.

Examples:

- `https://...`
- `file:///...`
- `data:image/jpeg;base64,...`

## Notes

- Leaflet is rendered inside a WebView to avoid Google Maps API key requirements.
- OpenStreetMap tiles require network access.
- The seeded quiz answers are mock content and can be adjusted in the data file without changing the app logic.
- The app still accepts the older quiz schema, but the new option-id schema is now the recommended way to manage multiple languages safely.
