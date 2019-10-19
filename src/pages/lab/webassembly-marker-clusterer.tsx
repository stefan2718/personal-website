import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import MarkerClusterer from '../../assets/markerclusterer';
import { IGatsbyProps, IClustererState, IMapState, MapType, IMapTestState } from '../../util/interfaces';
import TestControls from '../../components/lab/TestControls';
import { INTIAL_MAP_STATE } from '../../util/constants';
import { IMarker, } from 'wasm-marker-clusterer';
import WasmMap from '../../components/lab/WasmMap';
import McpMap from '../../components/lab/McpMap';

class Clusterer extends React.Component<IGatsbyProps, IClustererState> {
  torontoPoints: IMarker[] = (pointData as string[]).map(pointStr => {
      let pointObj = pointStr.split(";");
      return { lat: Number(pointObj[0]), lng: Number(pointObj[1]) };
    });

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
      mcpMapTestState: {
        clusterEnd: 0,
        clusterTime: 0,
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
      // let mapState = {
      //   center: { lat: this.mcpMap.getCenter().lat(), lng: this.mcpMap.getCenter().lng() },
      //   bounds: this.mcpMap.getBounds().toJSON(),
      //   zoom: this.mcpMap.getZoom()
      // };
      this.setState({ 
        syncMap: event.target.checked,
        wasmMapState: this.state.mcpMapState,
        mcpMapState:  this.state.mcpMapState,
      })
    } else {
      this.setState({ syncMap: event.target.checked })
    }
  }

  getMapState = (type: MapType): IMapState => type === "wasm" ? this.state.wasmMapState : this.state.mcpMapState

  setMcpMapState = (mapState: IMapState) => this.setState({ mcpMapState: mapState })
  setWasmMapState = (mapState: IMapState) => this.setState({ wasmMapState: mapState })
  setWasmMapTestState = (mapTestState: IMapTestState) => this.setState({ wasmMapTestState: mapTestState })
  setMcpMapTestState = (mapTestState: IMapTestState) => this.setState({ mcpMapTestState: mapTestState })

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
                  mcpState={this.state.mcpMapTestState}
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
                  comparisonTime={this.state.mcpMapTestState.clusterTime}
                  mapState={this.state.wasmMapState}
                  setMapState={this.setWasmMapState.bind(this)}
                  setOtherMapState={this.setMcpMapState.bind(this)}
                  setMapTestState={this.setWasmMapTestState.bind(this)}
                  />
                <McpMap
                  allMarkers={this.torontoPoints}
                  syncMap={this.state.syncMap}
                  comparisonTime={this.state.wasmMapTestState.clusterTime}
                  mapState={this.state.mcpMapState}
                  setMapState={this.setMcpMapState.bind(this)}
                  setOtherMapState={this.setWasmMapState.bind(this)}
                  setMapTestState={this.setMcpMapTestState.bind(this)}
                  />
              </div>
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Clusterer