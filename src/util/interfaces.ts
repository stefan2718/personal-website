import { Query } from "../graphql";
import { IBounds, ICluster, IMarker } from "wasm-marker-clusterer";
import { ReactNode } from "react";

export interface IGatsbyLocation {
  ancestorOrigins?: DOMStringList;
  host?: string;
  hostname?: string;
  href?: string;
  key?: string;
  origin?: string;
  pathname: string;
  port?: string;
  protocol?: string;
  reload?: () => string;
  search?: string;
}

export interface IGatsbyProps {
  location: IGatsbyLocation;
  data?: Query;
}

export interface IClustererStats {
  clusterStart: number;
  clusterEnd: number;
  clusterTime: number;
  worstTime: number;
  clusterCount: number;
  markerCount: number;
}

export interface IMapState {
  center: IMarker,
  bounds: IBounds,
  zoom: number
}

export interface ILabTile {
  title: string;
  desc: string;
  path: string;
  image: any;
  imageAlt: string;
}

export interface IBlogSummary {
  path: string;
  date: string;
  dateISO: string;
  title: string;
  excerpt: string;
}

export interface ITestControlsState extends ITestControlsStateNumbers {
  running: boolean;
}

export interface ITestControlsStateNumbers {
  gridSize: number;
  minZoom: number;
  maxZoom: number;
  maxPans: number;
  runs: number;
}

export interface IMapTestState {
  clusterTime: number;
  clusterEnd: number;
  clusterCount: number;
  markerCount: number;
}

export type MapType = "mcp" | "wasm";

export interface IKeyedMapTestState {
  key: MapType;
  state: IMapTestState;
}

export interface ITestControlsProps {
  getMapState: (type: MapType) => IMapState;
  setSyncMap: (syncMap: boolean) => void;
  setTestIsRunning: (testIsRunning: boolean) => void;
  setWasmMapState: (wasmMapState: IMapState) => void;
  setMcpMapState: (mcpMapState: IMapState) => void;
  setGridSize: (gridSize: number) => void;
  wasmState: IMapTestState;
  mcpState: IMapTestState;
  bounds: IBounds;
}

export enum Direction {
  north, east, south, west,
}

export interface ITestResults {
  runCount: number;
  currentIndex: number;
  mapState: IMapState;
  spiralState: ISpiralState;
  mcpResults: ITestSummary[][];
  wasmResults: ITestSummary[][];
}

export interface ITestSummary {
  clusterCount: number;
  markerCount: number;
  clusterTime: number;
  newMarkersClustered?: number;
}

export interface ICombinedResult {
  clusterCount: number;
  wasmClusterTime?: number;
  mcpClusterTime?: number;
  newMarkersClustered: number;
}

export interface ISpiralState {
  totalPansPerZoom: number;
  stepsLeft: number;
  totalSteps: number;
  direction: Direction;
  isFirstOfTwoDirections: boolean;
}

export interface IMapWrapperProps {
  title: string;
  children: ReactNode;
  clustererStats: IClustererStats;
  mapState: IMapState;
  comparisonTime: number;
  clickedCluster?: ICluster;
}

export interface IMapProps {
  allMarkers: IMarker[];
  syncMap: boolean;
  mapState: IMapState;
  setMapState: (mapState: IMapState) => void
  setOtherMapState: (otherMapState: IMapState) => void;
  setMapTestState: (mapTestState: IMapTestState) => void;
  comparisonTime: number;
  gridSize: number;
}