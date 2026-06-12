import { ImageSourcePropType } from 'react-native'

const quizImageAssets = {
  'malmo-history-detail': require('../../assets/questions/malmo-history-detail.png'),
} as const satisfies Record<string, ImageSourcePropType>

export type QuizImageAssetId = keyof typeof quizImageAssets

export function resolveQuizImageSource(
  imageAssetId: string | null | undefined,
  imageUri: string | null | undefined
) {
  if (imageAssetId && imageAssetId in quizImageAssets) {
    return quizImageAssets[imageAssetId as QuizImageAssetId]
  }

  if (imageUri) {
    return { uri: imageUri } satisfies ImageSourcePropType
  }

  return null
}
