import React, { useState, useEffect } from 'react';
import Helmet from 'react-helmet';
import { Link } from 'gatsby';
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
type WasmOption = typeof wasmOptions;
export const wasmOptions = {
  minZoom: {
    label: "Min zoom",
    desc: "The most zoomed out level, where the test will start",
  },
  maxZoom: {
    label: "Max zoom",
    desc: "The most zoomed in level, where the test will end",
  },
  runs: {
    label: "Runs",
    desc: "How many iterations going from minZoom to maxZoom",
  },
  maxPans: {
    label: "Max pans per zoom",
    desc: "How many times the map will pan in any direction at the same zoom level. Only is involved if all markers are not already clustered at the given zoom level",
  },
  submitResults: {
    label: "Submit results",
    desc: "If checked, your test results will be sent to a database to draw aggregated graphs for different browsers and OS's. No personal information is involved at all.",
  },
  saveLocally: {
    label: "Save results locally",
    desc: "Save the results of this test locally in this device's browser, so you can view results of multiple tests in aggregate.",
  },
  gridSize: {
    label: "Grid size",
    desc: "How many pixels make up the length and width of each clusters area",
  },
  syncMap: {
    label: "Synchronize maps",
    desc: "Moving one map will cause the other map to follow",
  },
  showIndicator: {
    label: "Show rendering indicator",
    desc: "This enables a javascript-animated rainbow-slider that demonstrates when heavy computation is occuring on the main thread. The element will stop moving or stutter when this happens.",
  },
}

const gridSizeMax = 400;
const gridSizeMin = 10;

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

  const setGridSizeInBound = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target) {
      let value = Number(event.target.value);
      setGridSize(value > gridSizeMax ? gridSizeMax : value < gridSizeMin ? gridSizeMin : value);
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
          <p>Read the <Link to="/blog/webassembly-marker-clusterer">blog post</Link> about this experiment.
            <span className="can-hover">&nbsp; Desktop users can hover over different input options to learn more.</span>
          </p>
          <details className="no-hover">
            <summary>Mobile users can tap here to read more about what the different input options do below.</summary>
            <ul>
              {(Object.keys(wasmOptions) as any).map((key: keyof WasmOption) => 
                <li key={key}><b>{wasmOptions[key].label}:</b> {wasmOptions[key].desc} </li>
              )}
            </ul>
           </details>
          <main>
            <div className="map-controls">
              <TestControls
                getMapState={getMapState}
                gridSize={gridSize}
                setSyncMap={setSyncMap}
                setTestIsRunning={setTestIsRunning}
                setMcpMapState={setMcpMapState}
                setWasmMapState={setWasmMapState}
                setShowIndicator={setShowIndicator}
                bounds={mcpMapState.bounds}
                wasmState={wasmMapTestState}
                mcpState={mcpMapTestState}
                />
              <div className="map-sync">
                <h4>Map Settings</h4>
                <div className="map-settings">
                  <label htmlFor="gridSize" title={wasmOptions.gridSize.desc}>{wasmOptions.gridSize.label}<br/>
                    <input step="10" id="gridSize" type="number" min={gridSizeMin} max={gridSizeMax} disabled={testIsRunning} value={gridSize} onChange={setGridSizeInBound}/>
                  </label>
                  <span title={wasmOptions.syncMap.desc}>
                    <input id="syncMap" name="syncMap" type="checkbox" disabled={testIsRunning} checked={syncMap} onChange={changeSyncMap}/>
                    <label htmlFor="syncMap">{wasmOptions.syncMap.label}</label>
                  </span>
                  <span title={wasmOptions.showIndicator.desc}>
                    <input id="showIndicator" name="showIndicator" type="checkbox" checked={showIndicator} onChange={changeShowIndicator}/>
                    <label htmlFor="showIndicator">{wasmOptions.showIndicator.label}</label>
                  </span>
                </div>
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