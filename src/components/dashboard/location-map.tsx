
"use client";

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Loader2, AlertTriangle, Users, UserCircle, WifiOff, Navigation } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { GoogleMap, LoadScript, Marker, InfoWindowF } from '@react-google-maps/api';
import { Button } from '../ui/button';

interface PatientLocation {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  condition?: string;
}

interface LocationMapProps {
  initialPatients?: PatientLocation[];
  showUserLocation?: boolean;
  mapHeight?: string;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 20.5937, // Default to center of India if no location available
  lng: 78.9629,
};

// SVG for the user's location marker
const userLocationIcon = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#007bff" width="36px" height="36px"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>');


export function LocationMap({
  initialPatients,
  showUserLocation = false,
  mapHeight = "500px",
}: LocationMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [trackedPatients, setTrackedPatients] = useState<PatientLocation[]>(initialPatients || []);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [showInfoWindow, setShowInfoWindow] = useState(false);
  const { toast } = useToast();

  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const handleCenterOnUser = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
          setCurrentCoords(userCoords);
          if (mapRef.current) {
            mapRef.current.panTo(userCoords);
            mapRef.current.setZoom(15);
          }
          setShowInfoWindow(true);
          setIsLoading(false);
        },
        (err) => {
          const geoError = `Could not get location: ${err.message}.`;
          setError(geoError);
          toast({ title: "Location Error", description: geoError, variant: "destructive" });
          setIsLoading(false);
        }
      );
    }
  }, [toast]);

  useEffect(() => {
    if (!googleMapsApiKey || googleMapsApiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
      const apiKeyError = "Google Maps API key is missing. The map cannot be displayed.";
      setError(apiKeyError);
      toast({ title: "Map Configuration Error", description: "Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your .env file.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (showUserLocation) {
      handleCenterOnUser();
    } else {
      setIsLoading(false);
    }
  }, [showUserLocation, googleMapsApiKey, toast, handleCenterOnUser]);

  
  const mapTitle = showUserLocation ? "Your Current Location" : "Live Locations";
  const mapDescription = showUserLocation
    ? "Showing your current location via browser geolocation."
    : (trackedPatients.length > 0 ? "Real-time tracking of entities." : "No live tracking data available.");

  const mapCenter = currentCoords || (trackedPatients.length > 0 ? trackedPatients[0].location : defaultCenter);
  
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapReady(true);
  }, []);

  const onMapUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  if (!googleMapsApiKey || googleMapsApiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    return (
      <Card className="h-[600px] flex flex-col shadow-md">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MapPin className="h-6 w-6 text-destructive" />
            <CardTitle>Map Unavailable</CardTitle>
          </div>
          <CardDescription>Google Maps API key is missing or invalid.</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <div className="text-center p-6 bg-destructive/10 text-destructive rounded-md">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p className="font-semibold">Configuration Error</p>
            <p>Please provide a valid Google Maps API key in your <code>.env</code> file.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col shadow-md" style={{ height: mapHeight }}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          <CardTitle>{mapTitle}</CardTitle>
        </div>
        <CardDescription>{mapDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow relative p-0">
        <LoadScript
          googleMapsApiKey={googleMapsApiKey!}
          libraries={['places']}
          loadingElement={ 
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/> 
            </div>
          }
          onError={() => {
              const scriptError = "Failed to load Google Maps script. Check the browser console for specific errors from Google, and verify your API key, billing, and API restrictions in the Google Cloud Console.";
              setError(scriptError);
              toast({ title: "Map Load Error", description: scriptError, variant: "destructive"});
          }}
        >
          <GoogleMap
            mapContainerStyle={{...containerStyle, height: '100%'}}
            center={mapCenter}
            zoom={currentCoords || trackedPatients.length > 0 ? 12 : 5}
            onLoad={onMapLoad}
            onUnmount={onMapUnmount}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
                zoomControl: true,
            }}
          >
           {mapReady && (
             <>
                {showUserLocation && currentCoords && (
                <>
                    <Marker
                    position={currentCoords}
                    title="Your Location"
                    icon={{
                        url: userLocationIcon,
                        scaledSize: new window.google.maps.Size(36, 36),
                        anchor: new window.google.maps.Point(18, 36),
                    }}
                    />
                    {showInfoWindow && (
                        <InfoWindowF position={currentCoords} onCloseClick={() => setShowInfoWindow(false)}>
                            <div>
                                <h4 style={{fontWeight: 'bold'}}>You are here</h4>
                                <p>Location approximated.</p>
                            </div>
                        </InfoWindowF>
                    )}
                </>
                )}
                
                {!showUserLocation && trackedPatients.map(patient => (
                <Marker
                    key={patient.id}
                    position={patient.location}
                    title={patient.name}
                />
                ))}
             </>
           )}
             {showUserLocation && mapReady && (
                <div style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)' }}>
                     <Button onClick={handleCenterOnUser} variant="secondary" className="shadow-lg">
                        <Navigation className="mr-2 h-4 w-4" />
                        Center on My Location
                    </Button>
                </div>
            )}
          </GoogleMap>
        </LoadScript>
        {isLoading && !mapReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-lg">Loading Map...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-destructive/10 text-destructive p-6 z-20 text-center">
            <WifiOff className="h-12 w-12 mb-4" />
            <p className="text-lg font-semibold">Map Data Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
