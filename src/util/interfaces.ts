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

export interface ITestControlsState extends ITestControlsStateNumbers, ITestControlsStateBooleans {
  latestWasmResults: ILocalResults;
  latestMcpResults: ILocalResults;
}

export interface ITestControlsStateBooleans {
  running: boolean;
  submitResults: boolean;
  saveLocally: boolean;
  showModal: boolean;
}

export interface ITestControlsStateNumbers {
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
  setShowIndicator: (showIndicator: boolean) => void;
  gridSize: number;
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
  link: string;
  children: ReactNode;
  clustererStats: IClustererStats;
  mapState: IMapState;
  comparisonTime: number;
  clickedCluster?: ICluster;
  renderIndicatorPercent: number;
  showIndicator: boolean;
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
  renderIndicatorPercent: number;
  showIndicator: boolean;
}

export interface IGraphProps {
  latestWasmResults: ILocalResults;
  latestMcpResults: ILocalResults;
}

export interface IModalProps {
  open: boolean;
}

export interface ILocalResults {
  timestamp: number;
  results: ITestSummary[];
}