import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import GoogleMapReact, { ChangeEventValue, Maps, } from 'google-map-react';
import MarkerClusterer from '../../assets/markerclusterer';
import { IGatsbyProps, IClustererState, IMapState, MapType, IMapTestState } from '../../util/interfaces';
import ClusteringStats from '../../components/lab/ClusteringStats';
import TestControls from '../../components/lab/TestControls';
import { INTIAL_MAP_STATE } from '../../util/constants';
import { IMarker, ICluster } from 'wasm-marker-clusterer';
import { boundsToIBounds } from '../../util/helpers';
import WasmMap from '../../components/lab/WasmMap';

class Clusterer extends React.Component<IGatsbyProps, IClustererState> {
  torontoPoints: IMarker[] = (pointData as string[]).map(pointStr => {
      let pointObj = pointStr.split(";");
      return { lat: Number(pointObj[0]), lng: Number(pointObj[1]) };
    });


  // Marker Clusterer Plus
  mcpClusterer: MarkerClusterer = null;
  mcpMap: google.maps.Map;

  constructor(props: IGatsbyProps) {
    super(props);

    this.state = {
      mcpClusters: [],
      syncMap: true,
      wasmMapTestState: {
        clusterEnd: 0,
        clusterTime: 0,
        clusterCount: 0,
        markerCount: 0,
      },
      mcp: {
        clusterStart: 0,
        clusterEnd: 0,
        clusterTime: 0,
        worstTime: 0,
        clusterCount: 0,
        markerCount: 0,
      },
      wasmMapState: INTIAL_MAP_STATE,
      mcpMapState: INTIAL_MAP_STATE,
      testIsRunning: false,
    };
  }

  changeSyncMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && event.target.checked) {
      let mapState = {
        center: { lat: this.mcpMap.getCenter().lat(), lng: this.mcpMap.getCenter().lng() },
        bounds: this.mcpMap.getBounds().toJSON(),
        zoom: this.mcpMap.getZoom()
      };
      this.setState({ 
        syncMap: event.target.checked,
        wasmMapState: mapState,
        mcpMapState:  mapState,
      })
    } else {
      this.setState({ syncMap: event.target.checked })
    }
  }

  getMapState = (type: MapType): IMapState => {
    return type === "wasm" ? this.state.wasmMapState : this.state.mcpMapState;
  }

  setMcpMapState = (mapState: IMapState) => {
    this.setState({ mcpMapState: mapState });
  }

  setWasmMapState = (mapState: IMapState) => {
    this.setState({ wasmMapState: mapState });
  }

  setWasmMapTestState = (mapTestState: IMapTestState) => {
    this.setState({ wasmMapTestState: mapTestState });
  }

  handleMcpMapLoaded = (map: google.maps.Map, maps: Maps) => {
    this.mcpMap = map;
    let markers = this.torontoPoints.map(pnt => {
      let marker = new google.maps.Marker({
        position: new google.maps.LatLng(pnt.lat, pnt.lng)
      });
      marker.addListener('click', () => {
        this.setState({ clickedMcpCluster: {
          size: 1,
          center: { lat: pnt.lat, lng: pnt.lng },
          markers: [{ lat: pnt.lat, lng: pnt.lng }]
        }});
      });
      return marker;
    });
    this.mcpClusterer = new MarkerClusterer(map, markers, { imagePath: "/images/m", zoomOnClick: false });
    this.mcpClusterer.addListener('clusteringbegin', mcpMap => {
      this.setState(currentState => ({ mcp: { 
        ...currentState.mcp,
        clusterStart: performance.now(),
        clusterTime: 0,
       }}));
    });
    this.mcpClusterer.addListener('clusteringend', (mcpMap: MarkerClusterer) => {
      this.setState(currentState => { 
        let clusterEnd = performance.now();
        let clusterTime = clusterEnd - currentState.mcp.clusterStart;
        let worstTime = Math.max(clusterTime, currentState.mcp.worstTime);
        return { 
          mcp: { 
            ...currentState.mcp,
            worstTime,
            clusterTime,
            clusterEnd,
            markerCount: mcpMap.getClusters().reduce((acc, curr) => acc + curr.getSize(), 0),
            clusterCount: mcpMap.getTotalClusters()
          },
          mcpClusters: mcpMap.getClusters().map(cluster => this.getClusterData(cluster))
        };
      });
    });
    this.mcpClusterer.addListener('click', (cluster: Cluster) => {
      this.setState({ clickedMcpCluster: this.getClusterData(cluster, true, 10)});
    });
  }

  getClusterData = (cluster: Cluster, getBounds: boolean = false, sliceTo: number = -1): ICluster => ({
    size: cluster.getSize(),
    center: cluster.getCenter().toJSON(),
    bounds: getBounds ? this.mcpClusterer.getExtendedBounds(new google.maps.LatLngBounds(cluster.getCenter(), cluster.getCenter())).toJSON() : null,
    // TODO: simplify if too slow? all I need is a count?
    markers: (sliceTo == -1 ? cluster.getMarkers() : cluster.getMarkers().slice(0,sliceTo)).map(m => m.getPosition().toJSON()),
  });

  // TODO ? instead of using GoogleMapReact's 'onChanged', hook into gmaps actual events for faster response
  handleMcpMapChange = ({ center, zoom, bounds, marginBounds, size }: ChangeEventValue) => {
    this.setState({mcpMapState: { center, zoom, bounds: boundsToIBounds(bounds) }});
    if (this.state.syncMap) {
      this.setState({ wasmMapState: { center, zoom, bounds: boundsToIBounds(bounds) }});
    }
  }

  render() {
    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>WebAssembly Markerer Clusterer</title>
          <meta name="description" content="A side-by-side comparison of the popular MarkerClusterPlus for Google Maps and a WebAssembly port of the same logic." />
        </Helmet>
        <div id="main" className="wasm-lab">
          <div className="inner-main">
            <h1>WebAssembly Experiment</h1>
            <p>I'm working towards a side-by-side comparison of the popular&nbsp;
              <a href="https://github.com/googlemaps/v3-utility-library/tree/master/markerclustererplus">MarkerClusterPlus for Google Maps</a>
              &nbsp;library and a <a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly</a> 
              &nbsp;implementation. MarkerClusterPlus clusters map points together when you have too many to display. This can become fairly CPU intensive when 
              you have thousands of map points. I'd like to see what benefits there will be from moving this clustering logic into
              a WebAssembly module. Hopefully, by running it outside of the main JavaScript event loop, it will take less time, and
              allow the page to keep rendering without blocking.
            </p>
            <main>
              <div className="map-controls">
                <TestControls
                  getMapState={this.getMapState}
                  setParentState={this.setState.bind(this)}
                  bounds={this.state.mcpMapState.bounds}
                  wasmState={this.state.wasmMapTestState}
                  mcpState={{
                    clusterTime: this.state.mcp.clusterTime,
                    clusterEnd: this.state.mcp.clusterEnd,
                    clusterCount: this.state.mcp.clusterCount,
                    markerCount: this.state.mcp.markerCount,
                  }}
                  />
                <div className="map-sync">
                  <input id="syncMap" name="syncMap" type="checkbox" disabled={this.state.testIsRunning} checked={this.state.syncMap} onChange={this.changeSyncMap}/>
                  <label htmlFor="syncMap">Synchronize map state</label>
                </div>
              </div>
              <div className="point-comparison">
                <WasmMap 
                  allMarkers={this.torontoPoints}
                  syncMap={this.state.syncMap}
                  comparisonTime={this.state.mcp.clusterTime}
                  mapState={this.state.wasmMapState}
                  setMapState={this.setWasmMapState.bind(this)}
                  setOtherMapState={this.setMcpMapState.bind(this)}
                  setMapTestState={this.setWasmMapTestState.bind(this)}
                  />
                <span className="map-and-stats">
                  <h3>Javascript (MCP)</h3>
                  <ClusteringStats {...this.state.mcp} {...this.state.mcpMapState} comparisonTime={this.state.wasmMapTestState.clusterTime}></ClusteringStats>
                  <div className="gmap">
                    <GoogleMapReact
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
                      zoom={this.state.mcpMapState.zoom}
                      center={this.state.mcpMapState.center}
                      onChange={this.handleMcpMapChange}
                      yesIWantToUseGoogleMapApiInternals
                      onGoogleApiLoaded={({ map, maps }) => this.handleMcpMapLoaded(map, maps)}
                    ></GoogleMapReact>
                  </div>
                  <details>
                    <summary>Clicked cluster details</summary>
                    <pre>{JSON.stringify(this.state.clickedMcpCluster, null, 2)}</pre>
                  </details>
                </span>
              </div>
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Clusterer