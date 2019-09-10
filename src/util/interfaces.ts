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
  price?: number;
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
}

export interface ICluster {
  uuid?: string;
  size: number;
  center: IPoint;
  bounds?: IWasmBounds;
  markers: IPoint[];
}

export interface IWasmBounds {
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
  center: { lat: number, lng: number },
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
  [key: string]: number; // So we can setState using bracket notation
}

export interface IMapTestState {
  clusterTime: number;
  clusterEnd: number;
  clusters: ICluster[];
}

export interface ITestControlsProps {
  setParentState: any;
  wasmState: IMapTestState;
  mcpState: IMapTestState;
}