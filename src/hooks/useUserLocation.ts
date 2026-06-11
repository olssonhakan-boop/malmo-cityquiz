import { useEffect, useState } from 'react'
import * as Location from 'expo-location'
import { UserCoordinates } from '../types'

export default function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserCoordinates | null>(null)
  const [permissionGranted, setPermissionGranted] = useState(false)
  const [permissionResolved, setPermissionResolved] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    let subscription: Location.LocationSubscription | null = null

    async function startTracking() {
      try {
        const permission = await Location.requestForegroundPermissionsAsync()

        if (!isMounted) {
          return
        }

        if (permission.status !== 'granted') {
          setPermissionGranted(false)
          setPermissionResolved(true)
          setErrorMessage('Location access was not granted.')
          return
        }

        setPermissionGranted(true)
        setPermissionResolved(true)

        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })

        if (isMounted) {
          setUserLocation({
            latitude: currentPosition.coords.latitude,
            longitude: currentPosition.coords.longitude,
          })
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
            timeInterval: 3000,
          },
          (position) => {
            if (!isMounted) {
              return
            }

            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            })
          }
        )
      } catch (error) {
        if (!isMounted) {
          return
        }

        setPermissionResolved(true)
        setErrorMessage(
          error instanceof Error
            ? error.message
            : 'Unable to start location tracking.'
        )
      }
    }

    startTracking()

    return () => {
      isMounted = false
      subscription?.remove()
    }
  }, [])

  return {
    userLocation,
    permissionGranted,
    permissionResolved,
    errorMessage,
  }
}
