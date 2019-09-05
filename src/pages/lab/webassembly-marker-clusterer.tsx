import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import GoogleMapReact, { ChangeEventValue, Maps, Bounds } from 'google-map-react';
import MarkerClusterer from '../../assets/markerclusterer';
import WasmMapCluster from '../../components/lab/WasmMapCluster';
import { IGatsbyProps, IClustererState, IPoint, IWasmCluster } from '../../util/interfaces';
import ClusteringStats from '../../components/lab/ClusteringStats';

class Clusterer extends React.Component<IGatsbyProps, IClustererState> {
  torontoPoints: IPoint[] = [];

  // Webassembly version
  wasmClusterer: typeof import("@stefan2718/webassembly-marker-clusterer");
  wasmMap: google.maps.Map;

  // Marker Clusterer Plus
  mcpClusterer: MarkerClusterer = null;
  mcpMap: google.maps.Map;

  logWasmTime = true;

  constructor(props: IGatsbyProps) {
    super(props);

    this.state = {
      loadWasmFailure: false,
      loadDataFailure: false,
      wasmClusters: [],
      syncMap: true,
      wasm: {
        clusterStart: 0,
        clusterTime: 0,
        worstTime: 0,
        totalClusters: 0
      },
      mcp: {
        clusterStart: 0,
        clusterTime: 0,
        worstTime: 0,
        totalClusters: 0
      },
      gmap: {
        center: { lat: 43.6532, lng: -79.3832 },
        zoom: 8
      }
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

  wasmClusterPoints = (bounds: Bounds, zoom: number) => {
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
    this.setState({ wasmClusters });
    return wasmClusters;
  }

  changeSyncMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && event.target.checked) {
      this.setState({ 
        syncMap: event.target.checked,
        gmap: {
          center: { lat: this.mcpMap.getCenter().lat(), lng: this.mcpMap.getCenter().lng() },
          zoom: this.mcpMap.getZoom()
        }
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
        let clusterTime = Math.round(performance.now() - currentState.mcp.clusterStart);
        let worstTime = Math.max(clusterTime, currentState.mcp.worstTime);
        return { mcp: { 
          ...currentState.mcp,
          worstTime,
          clusterTime,
          totalClusters: mcpMap.getTotalClusters()
        }};
      });
    });
    this.mcpClusterer.addListener('click', (cluster: Cluster) => {
      this.setState({ clickedMcpCluster: {
        size: cluster.getSize(),
        center: cluster.getCenter().toJSON(),
        bounds: this.mcpClusterer.getExtendedBounds(new google.maps.LatLngBounds(cluster.getCenter(), cluster.getCenter())).toJSON(),
        markers: cluster.getMarkers().slice(0,10).map(m => m.getPosition().toJSON()),
      }});
    });
  }

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
      let clusterTime = Math.round(performance.now() - currentState.wasm.clusterStart);
      let worstTime = Math.max(clusterTime, currentState.wasm.worstTime);
      return { wasm: { 
        ...currentState.wasm,
        worstTime,
        clusterTime,
        totalClusters: wasmClusters.length
      }};
    });
    this.syncMapChange({ center, zoom, bounds, marginBounds, size });
  }

  onWasmClusterClick = (cluster: IWasmCluster) => {
    this.setState({ clickedWasmCluster: cluster });
  }

  // TODO ? instead of using GoogleMapReact's 'onChanged', hook into gmaps actual events for faster response
  syncMapChange = ({ center, zoom, bounds, marginBounds, size }: ChangeEventValue) => {
    if (this.state.syncMap) {
      this.setState({gmap: { center, zoom }});
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
              <input id="syncMap" name="syncMap" type="checkbox" checked={this.state.syncMap} onChange={this.changeSyncMap}/>
              <label htmlFor="syncMap">Synchronize map state</label>
              <details>
                <summary>Map state</summary>
                <ul>
                  <li>Zoom: {this.state.gmap.zoom} </li>
                  <li>Center lat: {this.state.gmap.center.lat} </li>
                  <li>Center lng: {this.state.gmap.center.lng}</li>
                </ul>
              </details>
              <div className="point-comparison">
                <span className="map-and-stats">
                  <h3>WASM</h3>
                  <span className="error">{ !!this.state.loadWasmFailure ? "Wasm file failed to load :(" : ""}</span>
                  <ClusteringStats {...this.state.wasm} comparisonTime={this.state.mcp.clusterTime}></ClusteringStats>
                  <div className="gmap">
                    <GoogleMapReact
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
                      zoom={this.state.gmap.zoom}
                      center={this.state.gmap.center}
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
                  <ClusteringStats {...this.state.mcp} comparisonTime={this.state.wasm.clusterTime}></ClusteringStats>
                  <div className="gmap">
                    <GoogleMapReact
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
                      zoom={this.state.gmap.zoom}
                      center={this.state.gmap.center}
                      onChange={this.syncMapChange}
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