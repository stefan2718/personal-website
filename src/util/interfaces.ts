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
  price: number;
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
  count: number;
  center_lat: number;
  center_lng: number;
}

export interface IClustererState {
  loadWasmFailure: boolean;
  loadDataFailure: boolean;
  wasmClusters: IWasmCluster[],
  syncMap: boolean;
  wasm: IClustererStats;
  mcp: IClustererStats;
  gmap: {
    center: { lat: number, lng: number },
    zoom: number
  }
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