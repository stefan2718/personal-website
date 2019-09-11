import { Query } from "../graphql";

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

export interface IPoint {
  lat: number;
  lng: number;
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
  totalClusters: number;
  totalMarkers: number;
}

export interface ICluster {
  uuid?: string;
  size: number;
  center: IPoint;
  bounds?: IBounds;
  markers: IPoint[];
}

export interface IBounds {
  north: number;
  east: number;
  south: number;
  west: number;
}

export interface IClustererState {
  loadWasmFailure: boolean;
  loadDataFailure: boolean;
  wasmClusters: ICluster[],
  mcpClusters: ICluster[],
  clickedMcpCluster?: ICluster;
  clickedWasmCluster?: ICluster;
  syncMap: boolean;
  wasm: IClustererStats;
  mcp: IClustererStats;
  wasmMapState: IMapState;
  mcpMapState: IMapState;
}

export interface IMapState {
  center: IPoint,
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

export interface ITestControlsState {
  minZoom: number;
  maxZoom: number;
  running: boolean;
  [key: string]: any; // So we can setState using bracket notation
}

export interface IMapTestState {
  clusterTime: number;
  clusterEnd: number;
  clusters: ICluster[];
}

export interface IKeyedMapTestState {
  key: "mcp" | "wasm";
  state: IMapTestState;
}

export interface ITestControlsProps {
  setParentState: any;
  wasmState: IMapTestState;
  mcpState: IMapTestState;
  bounds: IBounds;
}

export enum Direction {
  north, east, south, west,
}

export interface ITestResults {
  mapState: IMapState;
  spiralState: ISpiralState;
  mcpResults: ITestSummary[][];
  wasmResults: ITestSummary[][];
}

export interface ITestSummary {
  clusterCount: number;
  markerCount: number;
  clusterTime: number;
}

export interface ISpiralState {
  stepsLeft: number;
  totalSteps: number;
  direction: Direction;
  isFirstOfTwoDirections: boolean;
}