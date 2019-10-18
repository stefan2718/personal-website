import { Bounds } from "google-map-react";
import { IBounds } from "wasm-marker-clusterer";

export const iBoundsToBounds = (iBounds: IBounds): Bounds => ({
  ne: {
    lat: iBounds.north,
    lng: iBounds.east,
  },
  sw: {
    lat: iBounds.south,
    lng: iBounds.west,
  },
  nw: {
    lat: iBounds.north,
    lng: iBounds.west,
  },
  se: {
    lat: iBounds.south,
    lng: iBounds.east,
  },
})

export const boundsToIBounds = (bounds: Bounds): IBounds => ({
  north: bounds.ne.lat,
  east:  bounds.ne.lng,
  south: bounds.sw.lat,
  west:  bounds.sw.lng,
});
