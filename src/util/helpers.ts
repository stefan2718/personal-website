import { Bounds } from "google-map-react";
import { IBounds } from "wasm-marker-clusterer";
import { ITestSummary, ICombinedResult } from "./interfaces";

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

export const combineTestResults = (mcpResults: Partial<ITestSummary>[], wasmResults: Partial<ITestSummary>[]): ICombinedResult[] => {
    let totalResults: ICombinedResult[] = [];
    mcpResults.forEach((_, i) => {
      if (mcpResults[i].newMarkersClustered === wasmResults[i].newMarkersClustered && mcpResults[i].clusterCount === wasmResults[i].clusterCount) {
        totalResults.push({
          clusterCount: mcpResults[i].clusterCount,
          newMarkersClustered: mcpResults[i].newMarkersClustered,
          mcpClusterTime: mcpResults[i].clusterTime,
          wasmClusterTime: wasmResults[i].clusterTime,
        });
      } else {
        totalResults.push({
          clusterCount: mcpResults[i].clusterCount,
          newMarkersClustered: mcpResults[i].newMarkersClustered,
          mcpClusterTime: mcpResults[i].clusterTime,
        });
        totalResults.push({
          clusterCount: wasmResults[i].clusterCount,
          newMarkersClustered: wasmResults[i].newMarkersClustered,
          wasmClusterTime: wasmResults[i].clusterTime,
        });
      }
    });
    return totalResults;
  }
