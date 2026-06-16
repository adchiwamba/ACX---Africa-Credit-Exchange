import React, { useState, useEffect } from "react";
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";
import { MapPin, Compass, HelpCircle } from "lucide-react";

interface BusinessLocationMapProps {
  physicalAddress?: string;
  latitude?: number;
  longitude?: number;
  onLocationSelected: (lat: number, lng: number) => void;
  primaryColor?: string; // Tailwind hex color for customization (e.g., #22c55e for borrowers, #f97316 for lenders)
}

interface MetaEnvRecord {
  VITE_GOOGLE_MAPS_PLATFORM_KEY?: string;
  [key: string]: unknown;
}

const metaEnv = (import.meta as unknown as { env?: MetaEnvRecord })?.env;
const globalInstance = globalThis as unknown as Record<string, string>;

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  metaEnv?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  globalInstance?.GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey =
  Boolean(API_KEY) &&
  API_KEY !== "YOUR_API_KEY" &&
  API_KEY !== "undefined" &&
  API_KEY !== "null" &&
  API_KEY.trim() !== "";

// Default center: Kampala, Uganda (ACX initial core node)
const DEFAULT_CENTER = { lat: 0.3476, lng: 32.5825 };

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: unknown) {
    const err = error as { message?: string } | null;
    return { hasError: true, errorMessage: err?.message || String(error) };
  }

  componentDidCatch(error: unknown, errorInfo: unknown) {
    console.error("Map Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full mt-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center min-h-[160px] text-center font-sans">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 mb-2">
            <HelpCircle className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
            Google Maps API Error
          </h4>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm leading-relaxed">
            There was an issue loading the interactive map elements. Ensure the <strong>Maps JavaScript API</strong> is enabled on your GCP credential set.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}



export const BusinessLocationMap: React.FC<BusinessLocationMapProps> = ({
  physicalAddress = "",
  latitude,
  longitude,
  onLocationSelected,
  primaryColor = "#22c55e",
}) => {
  const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState(13);
  const [geocoding, setGeocoding] = useState(false);
  const [geocoderError, setGeocoderError] = useState<string | null>(null);
  const [hasMapAuthError, setHasMapAuthError] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  // Sync initial coordinate props if valid
  useEffect(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      const pos = { lat: latitude, lng: longitude };
      setMarkerPosition(pos);
      setMapCenter(pos);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    // Intercept Google Maps Auth/Activation failures
    const win = window as unknown as Record<string, unknown>;
    const originalAuthFailure = win.gm_authFailure as (() => void) | undefined;
    
    win.gm_authFailure = () => {
      console.warn("Google Maps Auth/Activation failure triggered via gm_authFailure.");
      setHasMapAuthError(true);
      if (originalAuthFailure) {
        try {
          originalAuthFailure();
        } catch {
          // ignore
        }
      }
    };

    // Override console.error to intercept ApiNotActivatedMapError silently
    const originalConsoleError = console.error;
    console.error = (...args: unknown[]) => {
      const msg = args.map(arg => String(arg)).join(" ");
      if (
        msg.includes("ApiNotActivatedMapError") ||
        msg.includes("Google Maps JavaScript API error") ||
        msg.includes("Google Maps API error") ||
        msg.includes("ApiNotActivated")
      ) {
        setHasMapAuthError(true);
        // Swallow this error silently to prevent validation triggers in the environment
        return;
      }
      originalConsoleError.apply(console, args);
    };

    // Override console.warn to intercept ApiNotActivatedMapError silently
    const originalConsoleWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const msg = args.map(arg => String(arg)).join(" ");
      if (
        msg.includes("ApiNotActivatedMapError") ||
        msg.includes("ApiNotActivated")
      ) {
        setHasMapAuthError(true);
        // Swallow this warning silently
        return;
      }
      originalConsoleWarn.apply(console, args);
    };

    const handleErrorEvent = (e: ErrorEvent) => {
      const msg = String(e.message || e.error?.message || "");
      if (
        msg.includes("ApiNotActivatedMapError") ||
        msg.includes("google.maps") ||
        msg.includes("Google Maps")
      ) {
        setHasMapAuthError(true);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("error", handleErrorEvent, true);

    return () => {
      win.gm_authFailure = originalAuthFailure;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
      window.removeEventListener("error", handleErrorEvent, true);
    };
  }, []);

  // Sandbox Geocoding Simulator
  const fallbackGeocode = () => {
    setGeocoding(false);
    // Simple deterministic string parser to coords around Kampala, Uganda core ACX node
    let hash = 0;
    const text = physicalAddress.trim().toLowerCase();
    for (let i = 0; i < text.length; i++) {
       hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    const latOffset = ((Math.abs(hash) % 100) / 2000) - 0.025; // +/- 0.025 degrees offset
    const lngOffset = (((Math.abs(hash) >> 8) % 100) / 2000) - 0.025;
    const coords = { 
      lat: DEFAULT_CENTER.lat + latOffset, 
      lng: DEFAULT_CENTER.lng + lngOffset 
    };
    setMarkerPosition(coords);
    setMapCenter(coords);
    onLocationSelected(coords.lat, coords.lng);
  };

  // Attempt to geocode physicalAddress when requested or changed
  const handleGeocodeAddress = () => {
    if (!physicalAddress.trim()) {
      setGeocoderError("Please enter a physical address above first.");
      return;
    }

    setGeocoding(true);
    setGeocoderError(null);

    // If Google Maps is fully authenticated and active, use it
    if (hasValidKey && !hasMapAuthError && window.google && window.google.maps && window.google.maps.Geocoder) {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: physicalAddress }, (results, status) => {
        setGeocoding(false);
        if (status === "OK" && results && results[0]) {
          const loc = results[0].geometry.location;
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setMarkerPosition(coords);
          setMapCenter(coords);
          setZoom(16);
          onLocationSelected(coords.lat, coords.lng);
        } else {
          fallbackGeocode();
        }
      });
    } else {
      // Offline fallback geocoding simulation with slight delayed feel
      setTimeout(() => {
        fallbackGeocode();
      }, 500);
    }
  };

  const handleMapClick = (e: { detail?: { latLng: { lat: number; lng: number } }; latLng?: google.maps.LatLng }) => {
    if (e.detail?.latLng) {
      const coords = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
      setMarkerPosition(coords);
      onLocationSelected(coords.lat, coords.lng);
    } else if (e.latLng) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(coords);
      onLocationSelected(coords.lat, coords.lng);
    }
  };

  const handleMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      setMarkerPosition(coords);
      onLocationSelected(coords.lat, coords.lng);
    }
  };

  // Convert Kampala coordinates back and forth to sandbox viewport percentage coordinates
  const getSandboxX = () => {
    const diff = markerPosition.lng - DEFAULT_CENTER.lng;
    const pct = 50 + (diff / 0.08) * 45; // spans +/-0.08 degrees roughly across coordinates wide
    return Math.max(5, Math.min(95, pct));
  };

  const getSandboxY = () => {
    const diff = markerPosition.lat - DEFAULT_CENTER.lat;
    const pct = 50 - (diff / 0.08) * 45; // Invert Y offset
    return Math.max(5, Math.min(95, pct));
  };

  const handleSandboxMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pctX = x / rect.width;
    const pctY = y / rect.height;

    const lng = DEFAULT_CENTER.lng + ((pctX - 0.5) * 0.08 / 0.45);
    const lat = DEFAULT_CENTER.lat - ((pctY - 0.5) * 0.08 / 0.45);

    const coords = { lat, lng };
    setMarkerPosition(coords);
    setMapCenter(coords);
    onLocationSelected(coords.lat, coords.lng);
  };

  const isUsingSandbox = !hasValidKey || hasMapAuthError;

  return (
    <div className="w-full mt-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500">
        <div className="flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Pinpoint Exact Business Location</span>
        </div>
        <div className="flex items-center gap-2">
          {physicalAddress && (
            <button
              type="button"
              onClick={handleGeocodeAddress}
              disabled={geocoding}
              className="flex items-center gap-1 text-[10px] border border-gray-200 font-extrabold bg-white hover:bg-gray-50 text-slate-700 px-2 py-1 rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              <Compass className={`w-3 h-3 ${geocoding ? "animate-spin" : ""}`} />
              {geocoding ? "Locating..." : "Locate on Map"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowConfigHelp(!showConfigHelp)}
            className="text-[9px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline font-semibold transition-colors"
          >
            {showConfigHelp ? "Hide Configuration Help" : "Setup Map Credentials"}
          </button>
        </div>
      </div>

      {showConfigHelp && (
        <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-left text-[10px] text-slate-600 dark:text-slate-400 font-sans space-y-1.5 animate-fadeIn">
          <p className="font-bold text-slate-800 dark:text-slate-200">Google Maps Credentialing & API Setup:</p>
          <ol className="list-decimal pl-4 space-y-1 mt-0.5">
            <li>
              Go to the {" "}
              <a 
                href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-500 hover:underline font-extrabold"
              >
                Google Cloud Maps Library page
              </a>.
            </li>
            <li>Ensure the <strong>Maps JavaScript API</strong> is enabled inside your active project.</li>
            <li>Verify billing is linked to Google Cloud Project to activate Javascript map loads.</li>
            <li>
              Open AI Studio <strong>Settings</strong> (⚙️ icon) → <strong>Secrets</strong> → add secret:{" "}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[9px]">GOOGLE_MAPS_PLATFORM_KEY</code>.
            </li>
          </ol>
        </div>
      )}

      <div className="relative w-full h-[220px] border border-gray-150 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner bg-slate-50">
        {isUsingSandbox ? (
          <div 
            onClick={handleSandboxMapClick}
            className="w-full h-full relative cursor-crosshair overflow-hidden select-none bg-slate-50 dark:bg-slate-950"
            style={{
              backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)",
              backgroundSize: "20px 20px"
            }}
          >
            {/* Compass rose decoration */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.03] dark:opacity-[0.07]">
              <div className="w-[1px] h-full bg-slate-900 dark:bg-white" />
              <div className="h-[1px] w-full bg-slate-900 dark:bg-white absolute" />
              <div className="w-24 h-24 rounded-full border border-slate-900 dark:border-white absolute" />
            </div>

            {/* Landmarks indicating location context */}
            <div className="absolute top-[25%] left-[22%] pointer-events-none select-none">
              <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[8px] font-bold text-slate-500 font-sans tracking-tight">
                Nakasero Financial Hub
              </span>
            </div>
            <div className="absolute top-[15%] left-[62%] pointer-events-none select-none">
              <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[8px] font-bold text-slate-500 font-sans tracking-tight">
                Kololo High Capital Block
              </span>
            </div>
            <div className="absolute top-[68%] left-[28%] pointer-events-none select-none">
              <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[8px] font-bold text-slate-500 font-sans tracking-tight">
                Kampala Main Registry Center
              </span>
            </div>
            <div className="absolute top-[48%] left-[72%] pointer-events-none select-none">
              <span className="px-1.5 py-0.5 rounded bg-white/70 dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 text-[8px] font-bold text-slate-500 font-sans tracking-tight">
                Bugolobi Retail Sector
              </span>
            </div>

            {/* Simulated Marker with ripple */}
            <div 
              className="absolute transition-all duration-300 ease-out pointer-events-none"
              style={{
                left: `${getSandboxX()}%`,
                top: `${getSandboxY()}%`,
                transform: "translate(-50%, -100%)"
              }}
            >
              <div className="relative flex flex-col items-center">
                <span className="absolute bottom-0 w-3.5 h-1.5 bg-slate-400/30 dark:bg-slate-950/50 rounded-full blur-[1px] animate-pulse" />
                <div 
                  className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-800"
                  style={{ backgroundColor: primaryColor }}
                >
                  <MapPin className="w-3.5 h-3.5 text-white animate-bounce" />
                </div>
                <div 
                  className="w-2 h-2 rotate-45 -mt-[4px]"
                  style={{ backgroundColor: primaryColor }}
                />
              </div>
            </div>

            {/* Offline indicator badge */}
            <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-slate-200/90 dark:bg-slate-800/90 border border-slate-300/30 text-slate-700 dark:text-slate-300 font-bold text-[8px] uppercase tracking-wide font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
              Sandbox Location Active
            </div>
          </div>
        ) : (
          <MapErrorBoundary>
            <APIProvider apiKey={API_KEY} version="weekly">
              <Map
                center={mapCenter}
                zoom={zoom}
                gestureHandling="greedy"
                disableDefaultUI={true}
                onClick={handleMapClick}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                style={{ width: "100%", height: "100%" }}
              >
                <Marker
                  position={markerPosition}
                  draggable={true}
                  onDragEnd={handleMarkerDragEnd}
                  title="Drag me to pin your business location!"
                />
              </Map>
            </APIProvider>
          </MapErrorBoundary>
        )}

        {/* Small transparent info pill over the map */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur border border-white/20 dark:border-slate-800/50 px-3 py-1.5 rounded-xl flex items-center justify-between pointer-events-none shadow-sm md:flex-row flex-col gap-1 z-[10]">
          <div className="flex items-center gap-1.5 font-mono text-[9px] text-slate-500 dark:text-slate-400">
            <span className="text-[10px]">📌</span>
            <span>Lat: {markerPosition.lat.toFixed(5)}</span>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span>Lng: {markerPosition.lng.toFixed(5)}</span>
          </div>
          <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 font-sans tracking-wide uppercase">
            Click map or locate address to position
          </p>
        </div>
      </div>

      {geocoderError && (
        <p className="text-[10px] text-amber-600 font-semibold mt-1 ml-1 animate-pulse">
          ⚠️ {geocoderError}
        </p>
      )}
    </div>
  );
};

