# Quiz Data

Edit `quizLocations.json` and `tours.json` to expand the app without changing code.

## Location structure

Each location should include:

- `id`
- `title.sv`, `title.en`, `title.de`
- `summary.sv`, `summary.en`, `summary.de`
- `latitude`, `longitude` or `null` for citywide content
- `imageUri` or `null`
- `questions[]`

## Question structure

Each question should include:

- `id`
- `prompt.sv`, `prompt.en`, `prompt.de`
- `options[]`
- `correctOptionId`
- `fact.sv`, `fact.en`, `fact.de`

Recommended option format:

```json
{
  "id": "horse",
  "label": {
    "sv": "En häst",
    "en": "A horse",
    "de": "Ein Pferd"
  }
}
```

The correct answer should point to the stable option id:

```json
"correctOptionId": "horse"
```

## GPS-based questions

Set `latitude` and `longitude` to numbers.

- Within 30 meters: the quiz unlocks automatically.
- Within 100 meters: the user can force open the quiz.

## Citywide questions

Set both `latitude` and `longitude` to `null`.

These are shown as citywide quiz chips and can be opened from anywhere in Malmö.

## Tour structure

Each tour in `tours.json` should include:

- `id`
- `title.sv`, `title.en`, `title.de`
- `description.sv`, `description.en`, `description.de`
- `iconLabel`
- `locationIds[]`

## Optional images

Set `imageUri` to:

- an `https://` URL
- a `file:///` path during development
- a `data:` URI

If `imageUri` is `null`, the app shows the question without an image.

## Validation

Run:

```bash
npm run validate:content
```

This checks duplicate ids, missing translations, invalid answer ids, and tours that point to missing locations.
