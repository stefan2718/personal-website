import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import GoogleMapReact, { ChangeEventValue, Maps, Bounds } from 'google-map-react';
import MarkerClusterer from '../../assets/markerclusterer';
import WasmMapCluster from '../../components/lab/WasmMapCluster';
import { IGatsbyProps, IClustererState, IPoint, ICluster } from '../../util/interfaces';
import ClusteringStats from '../../components/lab/ClusteringStats';
import TestControls from '../../components/lab/TestControls';

class Clusterer extends React.Component<IGatsbyProps, IClustererState> {
  torontoPoints: IPoint[] = [];

  // Webassembly version
  wasmClusterer: typeof import("@stefan2718/webassembly-marker-clusterer");
  wasmMap: google.maps.Map;

  // Marker Clusterer Plus
  mcpClusterer: MarkerClusterer = null;
  mcpMap: google.maps.Map;

  logWasmTime = false;

  constructor(props: IGatsbyProps) {
    super(props);

    this.state = {
      loadWasmFailure: false,
      loadDataFailure: false,
      wasmClusters: [],
      mcpClusters: [],
      syncMap: true,
      wasm: {
        clusterStart: 0,
        clusterEnd: 0,
        clusterTime: 0,
        worstTime: 0,
        totalClusters: 0
      },
      mcp: {
        clusterStart: 0,
        clusterEnd: 0,
        clusterTime: 0,
        worstTime: 0,
        totalClusters: 0
      },
      wasmMapState: {
        center: { lat: 43.6358644, lng: -79.4673894 },
        zoom: 8
      },
      mcpMapState: {
        center: { lat: 43.6358644, lng: -79.4673894 },
        zoom: 8
      },
    };
  }

  componentDidMount() {
    this.torontoPoints = (pointData as string[]).map(pointStr => {
      let pointObj = pointStr.split(";");
      return { lat: Number(pointObj[0]), lng: Number(pointObj[1]) };
    });
    import("@stefan2718/webassembly-marker-clusterer")
      .then(lib => {
        this.wasmClusterer = lib;
        this.wasmClusterer.configure({
          average_center: false,
          log_time: this.logWasmTime
        });
        this.wasmClusterer.addMarkers(this.torontoPoints);
        if (this.wasmMap) {
          this.updateWasmMap(this.wasmMap);
        }
      })
      .catch(err => {
        console.error(err);
        this.setState({ loadWasmFailure: true });
      });
  }

  wasmClusterPoints = (bounds: Bounds, zoom: number): ICluster[] => {
    if (!bounds || !zoom) return;
    
    let wasmBounds = {
      north: bounds.ne.lat,
      east: bounds.ne.lng,
      south: bounds.sw.lat,
      west: bounds.sw.lng,
    };
    if (this.logWasmTime) console.time("into-wasm");
    let wasmClusters = this.wasmClusterer.clusterMarkersInBounds(wasmBounds, zoom);
    if (this.logWasmTime) console.timeEnd("out-of-wasm");
    return wasmClusters;
  }

  changeSyncMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && event.target.checked) {
      let mapState = {
        center: { lat: this.mcpMap.getCenter().lat(), lng: this.mcpMap.getCenter().lng() },
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
            totalClusters: mcpMap.getTotalClusters()
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

  handleWasmMapLoaded = (map: google.maps.Map, maps: Maps) => {
    this.wasmMap = map;
    this.updateWasmMap(map);
  }

  updateWasmMap = (map: google.maps.Map) => {
    this.handleWasmMapChange({ 
      center: { lat: map.getCenter().lat(), lng: map.getCenter().lng() },
      zoom: map.getZoom(),
      bounds: {
        ne: {
          lat: map.getBounds().getNorthEast().lat(),
          lng: map.getBounds().getNorthEast().lng(),
        },
        sw: {
          lat: map.getBounds().getSouthWest().lat(),
          lng: map.getBounds().getSouthWest().lng(),
        },
        nw: {
          lat: map.getBounds().getNorthEast().lat(),
          lng: map.getBounds().getSouthWest().lng(),
        },
        se: {
          lat: map.getBounds().getSouthWest().lat(),
          lng: map.getBounds().getNorthEast().lng(),
        },
      }
    });
  }

  handleWasmMapChange = ({ center, zoom, bounds, marginBounds, size }: Partial<ChangeEventValue>) => {
    if (!this.wasmClusterer || !bounds || !zoom) return;

    this.setState(currentState => ({ wasm: { 
      ...currentState.wasm,
      clusterStart: performance.now(),
      clusterTime: 0,
    }}));

    let wasmClusters = this.wasmClusterPoints(bounds, zoom);

    this.setState(currentState => {
      let clusterEnd = performance.now();
      let clusterTime = clusterEnd - currentState.wasm.clusterStart;
      let worstTime = Math.max(clusterTime, currentState.wasm.worstTime);
      return {
        wasm: {
          ...currentState.wasm,
          worstTime,
          clusterTime,
          clusterEnd,
          totalClusters: wasmClusters.length
        },
        wasmClusters,
        wasmMapState: { center, zoom }
      };
    });
    if (this.state.syncMap) {
      this.setState({mcpMapState:  { center, zoom }});
    }
  }

  onWasmClusterClick = (cluster: ICluster) => {
    this.setState({ clickedWasmCluster: cluster });
  }

  // TODO ? instead of using GoogleMapReact's 'onChanged', hook into gmaps actual events for faster response
  handleMcpMapChange = ({ center, zoom, bounds, marginBounds, size }: ChangeEventValue) => {
    this.setState({mcpMapState: { center, zoom }});
    if (this.state.syncMap) {
      this.setState({wasmMapState: { center, zoom }});
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
                  setParentState={this.setState.bind(this)}
                  wasmState={{
                    clusterTime: this.state.wasm.clusterTime,
                    clusterEnd: this.state.wasm.clusterEnd,
                    clusters: this.state.wasmClusters,
                  }}
                  mcpState={{
                    clusterTime: this.state.mcp.clusterTime,
                    clusterEnd: this.state.mcp.clusterEnd,
                    clusters: this.state.mcpClusters,
                  }}
                ></TestControls>
                <div className="map-sync">
                  <input id="syncMap" name="syncMap" type="checkbox" checked={this.state.syncMap} onChange={this.changeSyncMap}/>
                  <label htmlFor="syncMap">Synchronize map state</label>
                </div>
              </div>
              <div className="point-comparison">
                <span className="map-and-stats">
                  <h3>WASM</h3>
                  <span className="error">{ !!this.state.loadWasmFailure ? "Wasm file failed to load :(" : ""}</span>
                  <ClusteringStats {...this.state.wasm} {...this.state.wasmMapState} comparisonTime={this.state.mcp.clusterTime}></ClusteringStats>
                  <div className="gmap">
                    <GoogleMapReact
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
                      zoom={this.state.wasmMapState.zoom}
                      center={this.state.wasmMapState.center}
                      onChange={this.handleWasmMapChange}
                      yesIWantToUseGoogleMapApiInternals
                      onGoogleApiLoaded={({ map, maps }) => this.handleWasmMapLoaded(map, maps)}
                    >
                      {this.state.wasmClusters.map(c =>
                        <WasmMapCluster 
                          onClick={this.onWasmClusterClick}
                          {...c}
                          key={c.uuid}
                          lat={c.center.lat}
                          lng={c.center.lng}
                        ></WasmMapCluster>
                      )}
                    </GoogleMapReact>
                  </div>
                  <details>
                    <summary>Clicked cluster details</summary>
                    <pre>{JSON.stringify(this.state.clickedWasmCluster, null, 2)}</pre>
                  </details>
                </span>
                <span className="map-and-stats">
                  <h3>Javascript (MCP)</h3>
                  <ClusteringStats {...this.state.mcp} {...this.state.mcpMapState} comparisonTime={this.state.wasm.clusterTime}></ClusteringStats>
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