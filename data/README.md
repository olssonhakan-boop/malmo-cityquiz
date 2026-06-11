# Quiz Data

Edit `quizLocations.json` to add or update quiz items without changing app logic.

## Required fields

- `id`
- `title.sv`, `title.en`, `title.de`
- `question.sv`, `question.en`, `question.de`
- `options.sv`, `options.en`, `options.de`
- `correctAnswer.sv`, `correctAnswer.en`, `correctAnswer.de`

## GPS-based questions

Set `latitude` and `longitude` to numbers.

- Within 30 meters: the quiz unlocks automatically.
- Within 100 meters: the user can force open the quiz.

## Citywide questions

Set both `latitude` and `longitude` to `null`.

These are shown as citywide quiz chips and can be opened from anywhere in Malmö.

## Optional images

Set `imageUri` to:

- an `https://` URL
- a `file:///` path during development
- a `data:` URI

If `imageUri` is `null`, the app simply shows the question without an image.
