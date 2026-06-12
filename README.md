# Malmo CityQuiz

Malmo CityQuiz is an Expo / React Native project for an Android-first city quiz experience built around Malmo landmarks.

## Current stack

- Expo
- React Native with TypeScript
- `expo-location` for foreground GPS tracking
- `react-native-webview`
- Leaflet inside a WebView
- OpenStreetMap tiles in Leaflet
- AsyncStorage for local completion progress

## Implemented so far

- Full-screen Malmo map centered on `55.6050, 13.0038`
- Blue user-location dot
- Multiple location-based quiz markers
- Citywide quiz items that can open anywhere in the city
- Distance-based unlocking
  - under 30 meters: auto unlock
  - within 100 meters: force open available
- Language selection for Swedish, English, and German
- Stable multilingual answer ids instead of comparing translated answer strings
- Runtime translation fallback if one language is temporarily missing in quiz data
- Multiple questions per location
- Multiple question types
  - `multiple-choice`
  - `true-false`
  - `sort-order`
  - `find-detail`
- Question-level image support via `imageUri` or local `imageAssetId`
- Data-driven thematic tours in [data/tours.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/tours.json)
- Data-driven quiz content in [data/quizLocations.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/quizLocations.json)

## Run locally

```bash
cd C:\Users\hakan\OneDrive\Documents\malmo-cityquiz
npm install
npm run start
```

## Validate

```bash
npm run validate
```

This runs content validation, TypeScript, Expo Doctor, and Android export.

## Editing quiz content

Update [data/quizLocations.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/quizLocations.json).

- To create a location-based quiz, provide `latitude` and `longitude`.
- To create a citywide quiz, set both coordinates to `null`.
- To attach a remote image, set `imageUri`.
- To attach a bundled app image, set `imageAssetId`.
- Mixed question types can live in the same location or citywide deck.

## Notes

- Leaflet is rendered inside a WebView to avoid Google Maps API key requirements.
- OpenStreetMap tiles require network access.
- Citywide question decks are already supported through `null` coordinates.
- The seeded content is mock content and can be adjusted in the data file without changing app logic.
