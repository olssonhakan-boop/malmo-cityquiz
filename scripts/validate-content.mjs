import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const locationsPath = path.join(rootDir, 'data', 'quizLocations.json')
const toursPath = path.join(rootDir, 'data', 'tours.json')
const requiredLanguages = ['sv', 'en', 'de']

function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

function assertLocalizedText(value, label) {
  assert(value && typeof value === 'object', `${label} must be an object.`)

  for (const language of requiredLanguages) {
    assert(
      typeof value[language] === 'string' && value[language].trim().length > 0,
      `${label}.${language} must be a non-empty string.`
    )
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

function validateLocations(locations) {
  assert(Array.isArray(locations), 'quizLocations.json must contain an array.')

  const locationIds = new Set()

  locations.forEach((location, locationIndex) => {
    const locationLabel = `locations[${locationIndex}]`
    assert(typeof location.id === 'string' && location.id.trim(), `${locationLabel}.id is required.`)
    assert(!locationIds.has(location.id), `Duplicate location id "${location.id}".`)
    locationIds.add(location.id)
    assertLocalizedText(location.title, `${locationLabel}.title`)
    assertLocalizedText(location.summary, `${locationLabel}.summary`)
    assert(
      (typeof location.latitude === 'number' && typeof location.longitude === 'number') ||
        (location.latitude === null && location.longitude === null),
      `${locationLabel} must either have both coordinates or both null.`
    )
    assert(Array.isArray(location.questions) && location.questions.length > 0, `${locationLabel}.questions must contain at least one item.`)

    const questionIds = new Set()

    location.questions.forEach((question, questionIndex) => {
      const questionLabel = `${locationLabel}.questions[${questionIndex}]`
      assert(typeof question.id === 'string' && question.id.trim(), `${questionLabel}.id is required.`)
      assert(!questionIds.has(question.id), `Duplicate question id "${location.id}:${question.id}".`)
      questionIds.add(question.id)
      assertLocalizedText(question.prompt, `${questionLabel}.prompt`)
      assertLocalizedText(question.fact, `${questionLabel}.fact`)
      assert(Array.isArray(question.options) && question.options.length >= 2, `${questionLabel}.options must contain at least two items.`)

      const optionIds = new Set()
      question.options.forEach((option, optionIndex) => {
        const optionLabel = `${questionLabel}.options[${optionIndex}]`
        assert(typeof option.id === 'string' && option.id.trim(), `${optionLabel}.id is required.`)
        assert(!optionIds.has(option.id), `Duplicate option id "${location.id}:${question.id}:${option.id}".`)
        optionIds.add(option.id)
        assertLocalizedText(option.label, `${optionLabel}.label`)
      })

      assert(
        optionIds.has(question.correctOptionId),
        `${questionLabel}.correctOptionId must match one of the option ids.`
      )
    })
  })

  return locationIds
}

function validateTours(tours, locationIds) {
  assert(Array.isArray(tours), 'tours.json must contain an array.')

  const tourIds = new Set()

  tours.forEach((tour, tourIndex) => {
    const tourLabel = `tours[${tourIndex}]`
    assert(typeof tour.id === 'string' && tour.id.trim(), `${tourLabel}.id is required.`)
    assert(!tourIds.has(tour.id), `Duplicate tour id "${tour.id}".`)
    tourIds.add(tour.id)
    assertLocalizedText(tour.title, `${tourLabel}.title`)
    assertLocalizedText(tour.description, `${tourLabel}.description`)
    assert(typeof tour.iconLabel === 'string' && tour.iconLabel.trim(), `${tourLabel}.iconLabel is required.`)
    assert(Array.isArray(tour.locationIds) && tour.locationIds.length > 0, `${tourLabel}.locationIds must contain at least one location id.`)

    tour.locationIds.forEach((locationId) => {
      assert(locationIds.has(locationId), `${tourLabel} references unknown location "${locationId}".`)
    })
  })
}

async function main() {
  const [locations, tours] = await Promise.all([
    readJson(locationsPath),
    readJson(toursPath),
  ])

  const locationIds = validateLocations(locations)
  validateTours(tours, locationIds)

  console.log('Content validation passed.')
}

main().catch((error) => {
  console.error(`Content validation failed: ${error.message}`)
  process.exit(1)
})
