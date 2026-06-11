# Malmö CityQuiz

Malmö CityQuiz is a separate Expo / React Native project for an Android-first city quiz experience built around Malmö landmarks.

## Current stack

- Expo
- React Native with TypeScript
- `expo-location` for foreground GPS tracking
- `react-native-webview`
- Leaflet inside a WebView
- OpenStreetMap tiles via `UrlTile`-style web tiles in Leaflet
- AsyncStorage for local completion progress

## Implemented in this first batch

- Full-screen Malmö map centered on `55.6050, 13.0038`
- Blue user-location dot
- Three location-based quiz markers
- One citywide quiz item that can open anywhere in Malmö
- Distance-based unlocking
  - under 30 meters: auto unlock
  - within 100 meters: force open available
- Language selection for Swedish, English, and German
- Marker states for locked, nearby, unlocked, and completed
- Green completion state after correct answer
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
npm run export:android
```

## Editing quiz content

Update [data/quizLocations.json](C:/Users/hakan/OneDrive/Documents/malmo-cityquiz/data/quizLocations.json).

- To create a location-based quiz, provide `latitude` and `longitude`.
- To create a citywide quiz, set both coordinates to `null`.
- Add optional `imageUri` values for photos.

Examples:

- `https://...`
- `file:///...`
- `data:image/jpeg;base64,...`

## Notes

- Leaflet is rendered inside a WebView to avoid Google Maps API key requirements.
- OpenStreetMap tiles require network access.
- The seeded quiz answers are mock content and can be adjusted in the data file without changing the app logic.
