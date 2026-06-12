import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const rootDir = process.cwd()
const locationsPath = path.join(rootDir, 'data', 'quizLocations.json')
const toursPath = path.join(rootDir, 'data', 'tours.json')
const requiredLanguages = ['sv', 'en', 'de']
const supportedQuestionTypes = new Set([
  'multiple-choice',
  'true-false',
  'sort-order',
  'find-detail',
])

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

function assertImageConfig(value, label) {
  if (value.imageUri !== undefined && value.imageUri !== null) {
    assert(
      typeof value.imageUri === 'string' && value.imageUri.trim().length > 0,
      `${label}.imageUri must be a non-empty string or null.`
    )
  }

  if (value.imageAssetId !== undefined && value.imageAssetId !== null) {
    assert(
      typeof value.imageAssetId === 'string' &&
        value.imageAssetId.trim().length > 0,
      `${label}.imageAssetId must be a non-empty string or null.`
    )
  }
}

function validateMultipleChoice(question, questionLabel, scopeLabel) {
  assert(
    Array.isArray(question.options) && question.options.length >= 2,
    `${questionLabel}.options must contain at least two items.`
  )

  const optionIds = new Set()
  question.options.forEach((option, optionIndex) => {
    const optionLabel = `${questionLabel}.options[${optionIndex}]`
    assert(
      typeof option.id === 'string' && option.id.trim(),
      `${optionLabel}.id is required.`
    )
    assert(
      !optionIds.has(option.id),
      `Duplicate option id "${scopeLabel}:${option.id}".`
    )
    optionIds.add(option.id)
    assertLocalizedText(option.label, `${optionLabel}.label`)
  })

  assert(
    optionIds.has(question.correctOptionId),
    `${questionLabel}.correctOptionId must match one of the option ids.`
  )
}

function validateTrueFalse(question, questionLabel) {
  assert(
    typeof question.correctBoolean === 'boolean',
    `${questionLabel}.correctBoolean must be a boolean.`
  )
}

function validateSortOrder(question, questionLabel, scopeLabel) {
  assert(
    Array.isArray(question.items) && question.items.length >= 2,
    `${questionLabel}.items must contain at least two sortable items.`
  )

  const itemIds = new Set()
  question.items.forEach((item, itemIndex) => {
    const itemLabel = `${questionLabel}.items[${itemIndex}]`
    assert(
      typeof item.id === 'string' && item.id.trim(),
      `${itemLabel}.id is required.`
    )
    assert(
      !itemIds.has(item.id),
      `Duplicate sort item id "${scopeLabel}:${item.id}".`
    )
    itemIds.add(item.id)
    assertLocalizedText(item.label, `${itemLabel}.label`)
  })

  assert(
    Array.isArray(question.correctOrderIds) &&
      question.correctOrderIds.length === question.items.length,
    `${questionLabel}.correctOrderIds must include every sortable item exactly once.`
  )

  const orderIds = new Set(question.correctOrderIds)
  assert(
    orderIds.size === question.items.length,
    `${questionLabel}.correctOrderIds must not contain duplicates.`
  )

  question.correctOrderIds.forEach((itemId) => {
    assert(
      itemIds.has(itemId),
      `${questionLabel}.correctOrderIds contains unknown item id "${itemId}".`
    )
  })
}

function validateFindDetail(question, questionLabel, scopeLabel) {
  assert(
    typeof question.imageUri === 'string' ||
      typeof question.imageAssetId === 'string',
    `${questionLabel} must provide imageUri or imageAssetId for find-detail questions.`
  )
  assert(
    Array.isArray(question.detailTargets) && question.detailTargets.length >= 1,
    `${questionLabel}.detailTargets must contain at least one target.`
  )

  const targetIds = new Set()
  question.detailTargets.forEach((target, targetIndex) => {
    const targetLabel = `${questionLabel}.detailTargets[${targetIndex}]`
    assert(
      typeof target.id === 'string' && target.id.trim(),
      `${targetLabel}.id is required.`
    )
    assert(
      !targetIds.has(target.id),
      `Duplicate detail target id "${scopeLabel}:${target.id}".`
    )
    targetIds.add(target.id)
    assert(
      typeof target.xPercent === 'number' &&
        target.xPercent >= 0 &&
        target.xPercent <= 100,
      `${targetLabel}.xPercent must be between 0 and 100.`
    )
    assert(
      typeof target.yPercent === 'number' &&
        target.yPercent >= 0 &&
        target.yPercent <= 100,
      `${targetLabel}.yPercent must be between 0 and 100.`
    )
    assert(
      typeof target.radiusPercent === 'number' &&
        target.radiusPercent > 0 &&
        target.radiusPercent <= 100,
      `${targetLabel}.radiusPercent must be between 0 and 100.`
    )
  })

  assert(
    targetIds.has(question.correctTargetId),
    `${questionLabel}.correctTargetId must match one of the detail target ids.`
  )
}

function validateLocations(locations) {
  assert(Array.isArray(locations), 'quizLocations.json must contain an array.')

  const locationIds = new Set()

  locations.forEach((location, locationIndex) => {
    const locationLabel = `locations[${locationIndex}]`
    assert(
      typeof location.id === 'string' && location.id.trim(),
      `${locationLabel}.id is required.`
    )
    assert(
      !locationIds.has(location.id),
      `Duplicate location id "${location.id}".`
    )
    locationIds.add(location.id)
    assertLocalizedText(location.title, `${locationLabel}.title`)
    assertLocalizedText(location.summary, `${locationLabel}.summary`)
    assertImageConfig(location, locationLabel)
    assert(
      (typeof location.latitude === 'number' &&
        typeof location.longitude === 'number') ||
        (location.latitude === null && location.longitude === null),
      `${locationLabel} must either have both coordinates or both null.`
    )
    assert(
      Array.isArray(location.questions) && location.questions.length > 0,
      `${locationLabel}.questions must contain at least one item.`
    )

    const questionIds = new Set()

    location.questions.forEach((question, questionIndex) => {
      const questionLabel = `${locationLabel}.questions[${questionIndex}]`
      const scopeLabel = `${location.id}:${question.id}`
      assert(
        typeof question.id === 'string' && question.id.trim(),
        `${questionLabel}.id is required.`
      )
      assert(
        !questionIds.has(question.id),
        `Duplicate question id "${scopeLabel}".`
      )
      questionIds.add(question.id)
      assert(
        typeof question.type === 'string' &&
          supportedQuestionTypes.has(question.type),
        `${questionLabel}.type must be one of ${[
          ...supportedQuestionTypes,
        ].join(', ')}.`
      )
      assertLocalizedText(question.prompt, `${questionLabel}.prompt`)
      assertLocalizedText(question.fact, `${questionLabel}.fact`)
      assertLocalizedText(question.instruction, `${questionLabel}.instruction`)
      assertImageConfig(question, questionLabel)

      if (question.type === 'multiple-choice') {
        validateMultipleChoice(question, questionLabel, scopeLabel)
        return
      }

      if (question.type === 'true-false') {
        validateTrueFalse(question, questionLabel)
        return
      }

      if (question.type === 'sort-order') {
        validateSortOrder(question, questionLabel, scopeLabel)
        return
      }

      if (question.type === 'find-detail') {
        validateFindDetail(question, questionLabel, scopeLabel)
      }
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
    assert(
      typeof tour.iconLabel === 'string' && tour.iconLabel.trim(),
      `${tourLabel}.iconLabel is required.`
    )
    assert(
      Array.isArray(tour.locationIds) && tour.locationIds.length > 0,
      `${tourLabel}.locationIds must contain at least one location id.`
    )

    tour.locationIds.forEach((locationId) => {
      assert(
        locationIds.has(locationId),
        `${tourLabel} references unknown location "${locationId}".`
      )
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
