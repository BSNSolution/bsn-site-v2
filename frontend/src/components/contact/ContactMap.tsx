import { useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// ────────────────────────────────────────────────────────────
// Fix para o ícone padrão do Leaflet quando bundled via Vite.
// Sem isso o marker fica invisível em produção (issue clássico).
// ────────────────────────────────────────────────────────────
// @ts-expect-error — _getIconUrl é uma propriedade interna do Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Marker custom com cor do tema (gradiente violet→cyan via SVG inline).
function customIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <defs>
        <linearGradient id="bsn-pin-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#a78bfa" />
          <stop offset="100%" stop-color="#22d3ee" />
        </linearGradient>
      </defs>
      <path d="M17 1 C 8 1 1 8 1 17 c 0 12 16 28 16 28 s 16 -16 16 -28 c 0 -9 -7 -16 -16 -16 z"
        fill="url(#bsn-pin-grad)" stroke="#0a0a0f" stroke-width="1.5"/>
      <circle cx="17" cy="17" r="6" fill="#0a0a0f"/>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: 'bsn-map-pin',
    iconSize: [34, 46],
    iconAnchor: [17, 44],
    popupAnchor: [0, -38],
  })
}

interface Props {
  lat: number
  lng: number
  address?: string
  name?: string
  /** Altura customizada — default 360 desktop / 280 mobile */
  height?: number
}

/**
 * Mapa Leaflet+OpenStreetMap (sem chave de API) com tile dark CartoDB.
 * Combina com o tema dark do site sem precisar customizar tiles.
 */
export default function ContactMap({
  lat,
  lng,
  address,
  name = 'BSN Solution',
  height,
}: Props) {
  const center: [number, number] = [lat, lng]
  const icon = useMemo(() => customIcon(), [])

  const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`

  return (
    <div
      className="contact-map-wrap glass"
      style={{
        position: 'relative',
        borderRadius: 18,
        overflow: 'hidden',
        height: height ?? undefined,
      }}
    >
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', minHeight: 280 }}
        attributionControl={true}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          subdomains={['a', 'b', 'c', 'd']}
          maxZoom={19}
        />
        <Marker position={center} icon={icon}>
          <Popup>
            <div style={{ minWidth: 180 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{name}</div>
              {address && (
                <div style={{ fontSize: 12, color: '#444' }}>{address}</div>
              )}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  marginTop: 8,
                  fontSize: 12,
                  color: '#7a5bff',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                Ver no Google Maps ↗
              </a>
            </div>
          </Popup>
        </Marker>
      </MapContainer>

      <style>{`
        .contact-map-wrap {
          height: 360px;
        }
        @media (max-width: 768px) {
          .contact-map-wrap {
            height: 280px;
          }
        }
        .contact-map-wrap .leaflet-container {
          background: #0a0a0f;
          font-family: 'Inter', sans-serif;
        }
        .contact-map-wrap .leaflet-control-attribution {
          background: rgba(0, 0, 0, 0.6);
          color: rgba(255, 255, 255, 0.5);
          font-size: 10px;
        }
        .contact-map-wrap .leaflet-control-attribution a {
          color: rgba(255, 255, 255, 0.7);
        }
        .contact-map-wrap .leaflet-control-zoom a {
          background: rgba(20, 20, 28, 0.9);
          color: rgba(255, 255, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .contact-map-wrap .leaflet-control-zoom a:hover {
          background: rgba(40, 40, 55, 0.95);
          color: #fff;
        }
        .contact-map-wrap .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.97);
          border-radius: 8px;
          padding: 4px;
        }
        .bsn-map-pin {
          background: transparent !important;
          border: none !important;
        }
      `}</style>
    </div>
  )
}
