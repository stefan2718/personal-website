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
  clusterTime: number;
  worstTime: number;
  totalClusters: number;
}

export interface IWasmCluster {
  uuid: string;
  size: number;
  center: IPoint;
  bounds: IWasmBounds;
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
  wasmClusters: IWasmCluster[],
  clickedMcpCluster?: IClickedCluster;
  clickedWasmCluster?: IWasmCluster;
  syncMap: boolean;
  wasm: IClustererStats;
  mcp: IClustererStats;
  gmap: {
    center: { lat: number, lng: number },
    zoom: number
  }
}

export interface IClickedCluster {
  size: number;
  center: google.maps.LatLngLiteral;
  bounds?: google.maps.LatLngBoundsLiteral;
  markers: google.maps.LatLngLiteral[];
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