# Malmö CityQuiz — Projektlogg

## Projektfakta

| Nyckel | Värde |
|--------|-------|
| Paketnamn | `se.unicorndevelopment.malmocityquiz` |
| App-namn | `Malmö CityQuiz` |
| Plattform | Android (React Native 0.86.0 bare, New Architecture) |
| Karta | Google Maps SDK |
| Språk | Svenska, Engelska, Tyska |
| Frågor | Laddas från GitHub raw JSON, cachas lokalt 1h |
| Kategorier | Laddas från GitHub raw JSON, cachas lokalt 24h |
| GPS-unlock | 30m bonus, 100m nearby |
| Projektmapp | `C:\Users\hakan\Downloads\MalmoCityQuiz\` |
| GitHub-repo | https://github.com/olssonhakan-boop/malmo-cityquiz |

## Nycklar och hemligheter
Se separat privat anteckning — lägg ALDRIG API-nycklar i den här filen eftersom den är publikt på GitHub.
- Google Maps API-nyckel: spara privat
- SHA-1 (release APK): spara privat

---

## Vad som fungerar ✅

- App startar utan krasch (React Native 0.86 + New Architecture)
- Hemskärm renderar korrekt
- Poängräknare och språkväljare (SV/EN/DE)
- GPS-tillståndsdialog och GPS-positionering
- Frågor laddas från `questions.json` (lokalt fallback om offline)
- Kategorifiltrering på hemskärm
- QuizModal med flersvarsfrågor
- FreeQuestionsPanel för frågor utan GPS-koordinater
- Release APK byggs korrekt med Gradle

## Vad som INTE fungerar / är oklart ❌

- Google Maps tiles — laddas inte på Pixel 7 API 34-emulatorn (troligen GMS-problem i emulatorn, fungerar förmodligen på riktig enhet)
- Material Symbols-ikoner på kartan — implementerade men ej visuellt verifierade (emulatorn blockeras av "System UI isn't responding"-dialog)
- GitHub-synk — frågor och kategorier hämtas från GitHub men appen har ännu inte testats med live-data (lokal fallback används alltid i emulator)

---

## Tekniska beslut och historia

### React Native 0.74 → 0.86 uppgradering
**Problem:** Appen kraschade direkt vid start med `libreact_featureflagsjni.so not found`.  
**Orsak:** `SoLoader.init(this, false)` registrerar inte merged SO mapping, så `react_featureflagsjni` (som är inbäddad i `libreactnative.so`) hittas inte.  
**Fix:** `MainApplication.kt` — ersatte manuell SoLoader-init med `ReactNativeApplicationEntryPoint.loadReactNative(this)` som använder `OpenSourceMergedSoMapping.INSTANCE`.

### Kartmarkörer — SVG övergiven
SVG-baserad `MarkerPin`-komponent orsakade ANR (Application Not Responding) eftersom SVG ritas om vid varje GPS-uppdatering. Ersatt med `QuizMarker` som använder Material Symbols variabeltypsnittet via `<Text fontFamily>`.

### QuizMarker — Material Symbols variabeltypsnitt
- Font: `MaterialSymbolsOutlined.ttf` (~10MB variabelfont) i `android/app/src/main/assets/fonts/`
- Fontfamilj i kod: `'Material Symbols Outlined'` (med mellanslag)
- Ikoner anges som Unicode-kodpunkter via `String.fromCodePoint(0xXXXX)`
- `fontVariationSettings` styr `wght` (100=långt bort, 400=nära, 700=bonus/unlockad)
- `tracksViewChanges={false}` efter 500ms för att undvika onödig omritning

### Dynamiska kategorier
Kategorikonfiguration (ikon + färg) hämtas från `categories.json` på GitHub via `useCategories`-hook.  
**Varför:** Nya kategorier i `questions.json` ska fungera utan app-uppdatering — uppdatera bara `categories.json` på GitHub.  
Format i `categories.json`:
```json
{ "kategorinamn": {"codepoint": "ea66", "color": "#7B1FA2"} }
```

### GitHub-repot
- Repo: `https://github.com/olssonhakan-boop/malmo-cityquiz`
- Repot existerade redan med en äldre TypeScript-version av appen (commits från 2026-06-12)
- Nuvarande lokala kodbas är JavaScript och är den aktiva versionen
- **OBS:** Lokal kod är INTE pushad till GitHub ännu — konflikt med gamla commits måste lösas

---

## Kategorier och ikoner

| Kategori | Icon (Material Symbols) | Färg |
|----------|------------------------|------|
| kultur | theater_comedy (U+EA66) | #7B1FA2 |
| konst | palette (U+E40A) | #E91E63 |
| personer | person (U+E7FD) | #00BCD4 |
| mat | restaurant (U+E56C) | #FFB300 |
| natur | park (U+EA63) | #2E7D32 |
| musik | music_note (U+E405) | #1976D2 |
| historia | castle (U+E678) | #8D6E63 |
| händelser | event (U+E878) | #E65100 |
| arkitektur | architecture (U+EA3A) | #1565C0 |
| kuriosa | help (U+E887) | #F57C00 |
| besökt | check_circle (U+E86C) | #455A64 |

---

## Nästa steg

- [ ] Lösa GitHub-konflikt och pusha lokal kod
- [ ] Verifiera att Material Symbols-ikoner renderas korrekt på riktig enhet
- [ ] Verifiera att Google Maps tiles fungerar på riktig enhet
- [ ] Sätta rätt `questions.json` och `categories.json` på GitHub
- [ ] Kontrollera att kategorinamn i koden matchar exakt vad som finns i `questions.json` (å ä ö)
