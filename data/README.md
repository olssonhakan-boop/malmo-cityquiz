# Quiz Data

Edit `quizLocations.json` and `tours.json` to expand the app without changing code.

## Location structure

Each location should include:

- `id`
- `title.sv`, `title.en`, `title.de`
- `summary.sv`, `summary.en`, `summary.de`
- `latitude`, `longitude` or `null` for citywide content
- optional `imageUri` or `imageAssetId`
- `questions[]`

## Supported question types

Each question must declare `type` and can use one of:

- `multiple-choice`
- `true-false`
- `sort-order`
- `find-detail`

All question types support:

- `id`
- `prompt.sv`, `prompt.en`, `prompt.de`
- `instruction.sv`, `instruction.en`, `instruction.de`
- `fact.sv`, `fact.en`, `fact.de`
- optional `imageUri`
- optional `imageAssetId`

## Multiple choice

Use:

- `options[]`
- `correctOptionId`

Example option format:

```json
{
  "id": "horse",
  "label": {
    "sv": "En hast",
    "en": "A horse",
    "de": "Ein Pferd"
  }
}
```

## True / false

Use:

- `correctBoolean`

## Sort order

Use:

- `items[]`
- `correctOrderIds[]`

The ids in `correctOrderIds` must match the ids in `items[]` and include all items exactly once.

## Find detail

Use:

- `imageUri` or `imageAssetId`
- `detailTargets[]`
- `correctTargetId`

Each target needs:

- `id`
- `xPercent`
- `yPercent`
- `radiusPercent`

The tap area is defined in percent of the rendered image size.

## GPS-based questions

Set `latitude` and `longitude` to numbers.

- Within 30 meters: the quiz unlocks automatically.
- Within 100 meters: the user can force open the quiz.

## Citywide questions

Set both `latitude` and `longitude` to `null`.

These question decks are available anywhere in the city and are shown as citywide chips in the app.

## Tour structure

Each tour in `tours.json` should include:

- `id`
- `title.sv`, `title.en`, `title.de`
- `description.sv`, `description.en`, `description.de`
- `iconLabel`
- `locationIds[]`

## Validation

Run:

```bash
npm run validate:content
```

This checks duplicate ids, missing translations, question-type specific fields, and tours that point to missing locations.
