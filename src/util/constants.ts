import { IMapState, IClustererStats } from "./interfaces";
import { IBounds } from "wasm-marker-clusterer";

export const INTIAL_MAP_STATE: IMapState = Object.freeze({ 
  center: { lat: 43.6358644, lng: -79.4673894 }, 
  bounds: {
    east: -78.3962224078125,
    north: 44.327569446620544,
    south: 42.93610456321247,
    west: -80.5385563921875,
  },
  zoom: 8 
});

export const INITIAL_STATS: IClustererStats = Object.freeze({
  clusterStart: 0,
  clusterEnd: 0,
  clusterTime: 0,
  worstTime: 0,
  clusterCount: 0,
  markerCount: 0,
});

export const BOUNDS_ALL_POINTS: IBounds = Object.freeze({ 
  south: 43.3413947,
  west: -79.94704530000001,
  north: 43.9865649,
  east: -78.8772558
});

export const LOCAL_RESULTS_KEY_MCP = "res_mcp";
export const LOCAL_RESULTS_KEY_WASM = "res_wasm";