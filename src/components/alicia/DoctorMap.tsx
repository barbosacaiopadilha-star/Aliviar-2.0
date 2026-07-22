"use client";

import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";

import type { Doctor } from "@/alicia/types";
import { ES_STATE_CENTER, type MapBounds } from "@/alicia/lib/geo";

import "leaflet/dist/leaflet.css";

function createMarkerIcon(selected: boolean) {
  const size = selected ? 18 : 14;
  const anchor = size / 2;

  return L.divIcon({
    className: selected ? "alicia-marker alicia-marker--selected" : "alicia-marker",
    html: `<span class="alicia-marker__dot"></span>`,
    iconSize: [size, size],
    iconAnchor: [anchor, anchor],
  });
}

function boundsFromLeaflet(bounds: L.LatLngBounds): MapBounds {
  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
  };
}

function MapViewport({
  doctors,
  selectedId,
  ignoreProgrammaticMoveRef,
}: {
  doctors: Doctor[];
  selectedId: string | null;
  ignoreProgrammaticMoveRef: MutableRefObject<number>;
}) {
  const map = useMap();
  const hasInitialFit = useRef(false);

  useEffect(() => {
    if (selectedId) {
      const doctor = doctors.find((item) => item.id === selectedId);
      if (doctor) {
        ignoreProgrammaticMoveRef.current += 1;
        map.flyTo([doctor.location.lat, doctor.location.lng], 11, { duration: 0.75 });
      }
      return;
    }

    if (hasInitialFit.current) {
      return;
    }

    if (doctors.length === 1) {
      hasInitialFit.current = true;
      ignoreProgrammaticMoveRef.current += 1;
      map.flyTo([doctors[0].location.lat, doctors[0].location.lng], 10, { duration: 0.75 });
      return;
    }

    if (doctors.length > 1) {
      hasInitialFit.current = true;
      const bounds = L.latLngBounds(
        doctors.map((doctor) => [doctor.location.lat, doctor.location.lng] as [number, number]),
      );
      ignoreProgrammaticMoveRef.current += 1;
      map.flyToBounds(bounds, { padding: [48, 48], maxZoom: 11, duration: 0.75 });
    }
  }, [doctors, ignoreProgrammaticMoveRef, map, selectedId]);

  return null;
}

function MapBoundsReporter({
  onBoundsChange,
  ignoreProgrammaticMoveRef,
}: {
  onBoundsChange?: (bounds: MapBounds) => void;
  ignoreProgrammaticMoveRef: MutableRefObject<number>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onBoundsChange) {
      return;
    }

    const reportBounds = () => {
      if (ignoreProgrammaticMoveRef.current > 0) {
        ignoreProgrammaticMoveRef.current -= 1;
        return;
      }

      onBoundsChange(boundsFromLeaflet(map.getBounds()));
    };

    map.on("moveend", reportBounds);
    map.on("zoomend", reportBounds);

    return () => {
      map.off("moveend", reportBounds);
      map.off("zoomend", reportBounds);
    };
  }, [ignoreProgrammaticMoveRef, map, onBoundsChange]);

  return null;
}

export function DoctorMap({
  doctors,
  selectedId,
  onSelect,
  onBoundsChange,
}: {
  doctors: Doctor[];
  selectedId: string | null;
  onSelect: (doctor: Doctor) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
}) {
  const [defaultIcon] = useState(() => createMarkerIcon(false));
  const [selectedIcon] = useState(() => createMarkerIcon(true));
  const ignoreProgrammaticMoveRef = useRef(0);

  const center = useMemo(() => {
    if (doctors.length > 0) {
      const avgLat = doctors.reduce((sum, doctor) => sum + doctor.location.lat, 0) / doctors.length;
      const avgLng = doctors.reduce((sum, doctor) => sum + doctor.location.lng, 0) / doctors.length;
      return { lat: avgLat, lng: avgLng };
    }
    return ES_STATE_CENTER;
  }, [doctors]);

  const initialZoom = doctors.length > 0 ? 10 : 8;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={initialZoom}
      scrollWheelZoom
      className="alicia-map h-[min(68vh,560px)] min-h-[360px] w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapViewport
        doctors={doctors}
        selectedId={selectedId}
        ignoreProgrammaticMoveRef={ignoreProgrammaticMoveRef}
      />
      <MapBoundsReporter
        onBoundsChange={onBoundsChange}
        ignoreProgrammaticMoveRef={ignoreProgrammaticMoveRef}
      />
      {doctors.map((doctor) => {
        const isSelected = doctor.id === selectedId;

        return (
          <Marker
            key={doctor.id}
            position={[doctor.location.lat, doctor.location.lng]}
            icon={isSelected ? selectedIcon : defaultIcon}
            title={doctor.name}
            alt={doctor.name}
            eventHandlers={{
              click: () => onSelect(doctor),
            }}
          />
        );
      })}
    </MapContainer>
  );
}
