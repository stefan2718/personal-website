import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import GoogleMapReact, { ChangeEventValue, Maps, Bounds } from 'google-map-react';
import MarkerClusterer from '../../assets/markerclusterer';
import WasmMapClusters from '../../components/lab/WasmMapClusters';
import { IGatsbyProps, IClustererState, IPoint } from '../../util/interfaces';

class Clusterer extends React.Component<IGatsbyProps, IClustererState> {
  torontoPoints: IPoint[] = [];

  // Webassembly version
  wasmClusterer: typeof import("@stefan2718/webassembly-marker-clusterer");
  wasmMap: google.maps.Map | undefined;

  // Marker Clusterer Plus
  mcpClusterer: MarkerClusterer = null;
  mcpMap: google.maps.Map | undefined;

  constructor(props: IGatsbyProps) {
    super(props);

    this.state = {
      loadWasmFailure: false,
      loadDataFailure: false,
      // numberOfPoints: 1,
      // points: [{lat: 1, lng: 2, price: 3}],
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
      return { lat: Number(pointObj[0]), lng: Number(pointObj[1]), price: Number(pointObj[2]) };
    });
    import("@stefan2718/webassembly-marker-clusterer")
      .then(lib => {
        this.wasmClusterer = lib;
        this.wasmClusterer.add_points(this.torontoPoints);
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
      north_east_lat: bounds.ne.lat,
      north_east_lng: bounds.ne.lng,
      south_west_lat: bounds.sw.lat,
      south_west_lng: bounds.sw.lng,
    };
    console.time("into-wasm");
    let wasmClusters = this.wasmClusterer.cluster_points_in_bounds(wasmBounds, zoom);
    console.timeEnd("out-of-wasm");
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

  // changeNumberOfPoints = (event) => {
  //   let size = 0;
  //   if (event.target.value > 0) {
  //     size = event.target.value; 
  //   }
  //   this.setState({
  //     numberOfPoints: size,
  //     points: Array(Number(size)).fill({ lat: 1, lng: 2, price: 3 }),
  //   });
  // }

  handleMcpMapLoaded = (map: google.maps.Map, maps: Maps) => {
    this.mcpMap = map;
    let markers = this.torontoPoints.map(pnt => new google.maps.Marker({
      position: new google.maps.LatLng(pnt.lat, pnt.lng)
    }));
    this.mcpClusterer = new MarkerClusterer(map, markers, { imagePath: "/images/m" });
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
              {/* <label htmlFor="numPoints">Number of points
                <input id="numPoints" type="number" value={this.state.numberOfPoints} onChange={this.changeNumberOfPoints}/>
              </label> */}
              <input id="syncMap" name="syncMap" type="checkbox" checked={this.state.syncMap} onChange={this.changeSyncMap}/>
              <label htmlFor="syncMap">Synchronize map state</label>
              {/* <div>
                <button className="button" onClick={this.wasmClusterPoints}>Cluster all points - in WASM!</button>
                <span>See console for performance timings</span>
              </div> */}
              { !!this.state.loadWasmFailure ? "Wasm file failed to load :(" : ""}
              <div className="point-comparison">
                <span className="map-and-stats">
                  <h3>Javascript (MCP)</h3>
                  <ul className="stats">
                    <li><span>
                      <span>Clusters created: </span>
                      <span className="stat-value">{this.state.mcp.totalClusters}</span>
                    </span></li>
                    <li><span>
                      <span>Clustering time (ms): </span>
                      <span className="stat-value">{!!this.state.mcp.clusterTime ? this.state.mcp.clusterTime : '...waiting'}</span>
                    </span></li>
                    <li><span>
                      <span>Worst time (ms): </span>
                      <span className="stat-value">{this.state.mcp.worstTime}</span>
                    </span></li>
                  </ul>
                  <div className="gmap">
                    <GoogleMapReact 
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY || "" }}
                      zoom={this.state.gmap.zoom}
                      center={this.state.gmap.center}
                      onChange={this.syncMapChange}
                      yesIWantToUseGoogleMapApiInternals
                      onGoogleApiLoaded={({ map, maps }) => this.handleMcpMapLoaded(map, maps)}
                    ></GoogleMapReact>
                  </div>
                </span>
                <span className="map-and-stats">
                  <h3>WASM</h3>
                  <ul className="stats">
                    <li><span>
                      <span>Clusters created: </span>
                      <span className="stat-value">{this.state.wasm.totalClusters}</span>
                    </span></li>
                    <li><span>
                      <span>Clustering time (ms): </span>
                      <span className="stat-value">{!!this.state.wasm.clusterTime ? this.state.wasm.clusterTime : '...waiting'}</span>
                    </span></li>
                    <li><span>
                      <span>Worst time (ms): </span>
                      <span className="stat-value">{this.state.wasm.worstTime}</span>
                    </span></li>
                  </ul>
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
                        <WasmMapClusters count={c.count} key={c.uuid} lat={c.center_lat} lng={c.center_lng}></WasmMapClusters>
                      )}
                    </GoogleMapReact>
                  </div>
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