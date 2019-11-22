import React, { useState, useEffect } from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import { IGatsbyProps, IMapState, MapType, IMapTestState } from '../../util/interfaces';
import TestControls from '../../components/lab/TestControls';
import { INTIAL_MAP_STATE } from '../../util/constants';
import WasmMap from '../../components/lab/WasmMap';
import McpMap from '../../components/lab/McpMap';

import './webassembly-marker-clusterer.scss';

const getInitialTestState = () => ({
  clusterEnd: 0,
  clusterTime: 0,
  clusterCount: 0,
  markerCount: 0,
});

const initialTestState = getInitialTestState();

const torontoPoints = (pointData as string[]).map(pointStr => {
  let pointObj = pointStr.split(";");
  return { lat: Number(pointObj[0]), lng: Number(pointObj[1]) };
})

export default function Clusterer(props: IGatsbyProps) {
  let [gridSize, setGridSize] = useState(60);
  let [syncMap, setSyncMap] = useState(true);
  let [testIsRunning, setTestIsRunning] = useState(false);
  let [wasmMapTestState, setWasmMapTestState] = useState<IMapTestState>(initialTestState);
  let [mcpMapTestState, setMcpMapTestState] = useState<IMapTestState>(initialTestState);
  let [wasmMapState, setWasmMapState] = useState<IMapState>(INTIAL_MAP_STATE);
  let [mcpMapState, setMcpMapState] = useState<IMapState>(INTIAL_MAP_STATE);
  let [renderIndicatorPercent, setRenderIndicatorPercent] = useState(0);
  let [renderIndicatorMovesRight, setRenderIndicatorMovesRight] = useState(true);
  let [showIndicator, setShowIndicator] = useState(true);

  useEffect(() => {
    if (showIndicator) {
      let timeout = setTimeout(() => {
        if (renderIndicatorMovesRight && renderIndicatorPercent + 1 === 90) {
          setRenderIndicatorMovesRight(false);
        } else if (!renderIndicatorMovesRight && renderIndicatorPercent - 1 === 0) {
          setRenderIndicatorMovesRight(true);
        }
        setRenderIndicatorPercent((renderIndicatorPercent + (renderIndicatorMovesRight ? 1 : -1)))
      }, 15);
      return () => clearTimeout(timeout);
    }
  }, [renderIndicatorPercent, showIndicator]);

  const changeSyncMap = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSyncMap(event.target.checked);
    if (event && event.target && event.target.checked) {
      setWasmMapState(mcpMapState);
    }
  }

  const changeShowIndicator = (event: React.ChangeEvent<HTMLInputElement>) => setShowIndicator(event.target.checked)
  const getMapState = (type: MapType): IMapState => type === "wasm" ? wasmMapState : mcpMapState;

  return (
    <HomePageLayout location={props.location}>
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
                setGridSize={setGridSize}
                getMapState={getMapState}
                setSyncMap={setSyncMap}
                setTestIsRunning={setTestIsRunning}
                setMcpMapState={setMcpMapState}
                setWasmMapState={setWasmMapState}
                bounds={mcpMapState.bounds}
                wasmState={wasmMapTestState}
                mcpState={mcpMapTestState}
                />
              <div className="map-sync">
                <input id="syncMap" name="syncMap" type="checkbox" disabled={testIsRunning} checked={syncMap} onChange={changeSyncMap}/>
                <label htmlFor="syncMap">Synchronize map state</label>
                <input id="showIndicator" name="showIndicator" type="checkbox" checked={showIndicator} onChange={changeShowIndicator}/>
                <label htmlFor="showIndicator">Show rendering indicator</label>
              </div>
            </div>
            <div className="point-comparison">
              <WasmMap
                gridSize={gridSize}
                allMarkers={torontoPoints}
                syncMap={syncMap}
                comparisonTime={mcpMapTestState.clusterTime}
                mapState={wasmMapState}
                setMapState={setWasmMapState}
                setOtherMapState={setMcpMapState}
                setMapTestState={setWasmMapTestState}
                renderIndicatorPercent={renderIndicatorPercent}
                showIndicator={showIndicator}
                />
              <McpMap
                gridSize={gridSize}
                allMarkers={torontoPoints}
                syncMap={syncMap}
                comparisonTime={wasmMapTestState.clusterTime}
                mapState={mcpMapState}
                setMapState={setMcpMapState}
                setOtherMapState={setWasmMapState}
                setMapTestState={setMcpMapTestState}
                renderIndicatorPercent={renderIndicatorPercent}
                showIndicator={showIndicator}
                />
            </div>
          </main>
        </div>
      </div>
    </HomePageLayout>
  )
}