import { AppLanguage, QuizEntry } from '../types'

type MapMarkerPayload = {
  id: string
  title: string
  latitude: number
  longitude: number
}

const leafletCssUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
const leafletJsUrl =
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'

export function buildLeafletHtml(
  quizEntries: QuizEntry[],
  center: { latitude: number; longitude: number },
  language: AppLanguage
) {
  const markers: MapMarkerPayload[] = quizEntries.map((quiz) => ({
    id: quiz.id,
    title: quiz.title[language],
    latitude: quiz.latitude as number,
    longitude: quiz.longitude as number,
  }))

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="${leafletCssUrl}" />
    <style>
      html, body, #map {
        margin: 0;
        height: 100%;
        width: 100%;
        background: #0b1722;
      }

      .leaflet-control-attribution {
        font-size: 10px;
      }

      .quiz-marker {
        width: 36px;
        height: 36px;
        border-radius: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        font-weight: 700;
        color: white;
        border: 2px solid rgba(255,255,255,0.9);
        box-shadow: 0 6px 18px rgba(0,0,0,0.28);
      }

      .marker-locked { background: #d64545; }
      .marker-nearby { background: #f59e0b; }
      .marker-unlocked { background: #2563eb; }
      .marker-completed { background: #16a34a; }
      .user-dot {
        width: 18px;
        height: 18px;
        border-radius: 9px;
        background: #3b82f6;
        border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 0 0 10px rgba(59,130,246,0.20);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script src="${leafletJsUrl}"></script>
    <script>
      const CENTER = ${JSON.stringify(center)};
      const INITIAL_MARKERS = ${JSON.stringify(markers)};

      let map;
      let userMarker = null;
      const markersById = {};

      function postToApp(payload) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(payload));
        }
      }

      function buildMarkerIcon(marker) {
        return L.divIcon({
          html: '<div class="quiz-marker marker-' + (marker.status || 'locked') + '">' + (marker.label || '?') + '</div>',
          className: '',
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });
      }

      function buildUserIcon() {
        return L.divIcon({
          html: '<div class="user-dot"></div>',
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });
      }

      function initMap() {
        map = L.map('map', {
          zoomControl: false,
        }).setView([CENTER.latitude, CENTER.longitude], 15);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        L.control.zoom({ position: 'bottomright' }).addTo(map);
      }

      function renderMarkers(markers) {
        markers.forEach((marker) => {
          const position = [marker.latitude, marker.longitude];
          const existingMarker = markersById[marker.id];

          if (existingMarker) {
            existingMarker.setLatLng(position);
            existingMarker.setIcon(buildMarkerIcon(marker));
            return;
          }

          const leafletMarker = L.marker(position, {
            icon: buildMarkerIcon(marker),
          }).addTo(map);

          leafletMarker.on('click', () => {
            postToApp({ type: 'markerPress', id: marker.id });
          });

          markersById[marker.id] = leafletMarker;
        });
      }

      function updateUserLocation(userLocation) {
        if (!userLocation || typeof userLocation.latitude !== 'number' || typeof userLocation.longitude !== 'number') {
          return;
        }

        const position = [userLocation.latitude, userLocation.longitude];

        if (!userMarker) {
          userMarker = L.marker(position, {
            icon: buildUserIcon(),
            zIndexOffset: 1000,
          }).addTo(map);
          return;
        }

        userMarker.setLatLng(position);
      }

      window.updateMapState = function updateMapState(payload) {
        if (!map) {
          return;
        }

        if (Array.isArray(payload.markers)) {
          renderMarkers(payload.markers);
        }

        if (payload.userLocation) {
          updateUserLocation(payload.userLocation);
        }
      };

      initMap();
      renderMarkers(INITIAL_MARKERS);
    </script>
  </body>
</html>
  `.trim()
}
