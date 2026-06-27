import { Pressable, StyleSheet, Text, View } from 'react-native'
import { languages } from '../i18n'
import { AppLanguage } from '../types'

type Props = {
  language: AppLanguage
  onChange: (language: AppLanguage) => void | Promise<void>
}

export default function LanguageSelector({ language, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      {(Object.keys(languages) as AppLanguage[]).map((key) => {
        const active = key === language

        return (
          <Pressable
            key={key}
            style={[styles.button, active && styles.buttonActive]}
            onPress={() => {
              void onChange(key)
            }}
          >
            <Text style={[styles.buttonText, active && styles.buttonTextActive]}>
              {languages[key]}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(7, 18, 27, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
  },
  buttonActive: {
    backgroundColor: '#12364C',
    borderColor: 'rgba(255,255,255,0.16)',
  },
  buttonText: {
    color: '#C9D6E2',
    fontSize: 13,
    fontWeight: '700',
  },
  buttonTextActive: {
    color: '#F8FAFC',
  },
})
