# Malmö CityQuiz — Projektlogg

## Beslut

| Beslut | Värde |
|--------|-------|
| Paketnamn | `se.unicorndevelopment.malmocityquiz` |
| App-namn | `Malmö CityQuiz` |
| Plattform | Android (React Native 0.74.5 bare) |
| Karta | Google Maps SDK (API-nyckel krävs) |
| Kartalternativ om Google inte fungerar | WebView + Leaflet (OSM) |
| Språk | Svenska, Engelska, Tyska |
| Frågor | Laddas från extern JSON (GitHub) |
| GPS-unlock | 30m auto, 100m force-open |

## Google Maps API-nyckel
- Nyckel: `REMOVED_GOOGLE_MAPS_API_KEY`
- Begränsning: Android apps
- Paketnamn registrerat: `se.unicorndevelopment.malmocityquiz`
- SHA-1 (release APK): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`

## Vad som fungerar
- ✅ App startar och renderar UI
- ✅ Poängräknare visas
- ✅ Språkväljare (SV/EN/DE) visas
- ✅ "Frågor om Malmö"-knapp med badge visas
- ✅ GPS-tillståndsdialog visas
- ✅ GPS-permission fungerar

## Vad som INTE fungerar (pågående)
- ❌ Google Maps tiles laddas inte — orsak: paketnamn i appen (`com.malmocityquiz`) matchar inte vad som är registrerat i Google Cloud Console (`se.unicorndevelopment.malmocityquiz`)
- ❌ Inga GPS-markörer syns på kartan (beror på att tiles inte laddas)

## Emulatorer
- Pixel 7 API 34 — Google Maps fungerar inte (okänd orsak, troligen GMS-problem)
- Pixel 9 API 37 (Google Play) — används nu, 4 GB RAM

## Projektmapp
- Aktiv kod: `C:\Users\hakan\Downloads\MalmoCityQuiz\`
- Paketnamn i koden (FEL, ska ändras): `com.malmocityquiz`
- Paketnamn som ska vara: `se.unicorndevelopment.malmocityquiz`
