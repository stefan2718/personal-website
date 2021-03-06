import React, { useState } from 'react';
import { IGraphProps, ITestSummary, MapType, ILocalResults } from '../../util/interfaces';
import { ResponsiveContainer, XAxis, YAxis, Scatter, ComposedChart, Line, Dot, Legend } from "recharts";

import './Graph.scss';
import { combineTestResults } from '../../util/helpers';
import { LOCAL_RESULTS_KEY_MCP, LOCAL_RESULTS_KEY_WASM } from '../../util/constants';

const mcpColor = "#a62929";
const wasmColor = "#1313d9";

const divideResultsPerCluster = (results: ITestSummary[]): Partial<ITestSummary>[] => {
  if (!results) {
    return [];
  }
  return results.map(point => ({
    clusterCount: point.clusterCount,
    clusterTime: point.clusterTime / point.clusterCount,
    newMarkersClustered: point.newMarkersClustered / point.clusterCount,
  }));
}

const getSums = (results: Partial<ITestSummary>[], key: keyof ITestSummary): number =>
  results.reduce((acc, curr) => acc + curr[key], 0);

const getSlope = (results: Partial<ITestSummary>[], xMean: number, yMean: number): number => {
  const numerator = results.reduce((acc, curr) => acc + (curr.newMarkersClustered - xMean) * (curr.clusterTime - yMean), 0);
  const denominator = results.reduce((acc, curr) => acc + Math.pow(curr.newMarkersClustered - xMean, 2), 0);
  return numerator / denominator;
}
const getMaxX = (results: Partial<ITestSummary>[]): number => results.reduce((acc, curr) => Math.max(acc, curr.newMarkersClustered), 0);

const getBestFitLinePoints = (results: Partial<ITestSummary>[], key: MapType) => {
  let xMean = getSums(results, 'newMarkersClustered');
  let yMean = getSums(results, 'clusterTime');
  let m = getSlope(results, xMean, yMean);
  let b = yMean - (m * xMean);
  let maxX = getMaxX(results);

  // calculate R^2
  let ss_tot = results.reduce((acc, curr) => acc + Math.pow(curr.clusterTime - yMean, 2), 0);
  let ss_res = results.reduce((acc, curr) => acc + Math.pow(curr.clusterTime - (m * curr.newMarkersClustered + b), 2), 0);
  return {
    r: 1 - (ss_res / ss_tot),
    m: m,
    plus: b > 0 ? "+" : "-",
    b: b > 0 ? b : -b,
    points: [
      {
        [key]: 0,
        newMarkersClustered: -b/m
      },
      {
        [key]: (m * maxX + b),
        newMarkersClustered: maxX
      }
    ]
  };
}

const mergeResults = (results: ILocalResults, key: string): ITestSummary[] => {
  const prevLocalResults = localStorage.getItem(key);
  if (prevLocalResults) {
    let prevResults = JSON.parse(prevLocalResults) as ILocalResults[];
    prevResults = prevResults.filter(res => res.timestamp !== results.timestamp);

    if (prevResults.length > 0) {
      return prevResults
        .reduce((acc, curr) => acc.concat(curr.results), [])
        .concat(results.results);
    }
  }
  return results.results;
}

const renderLineOfBestFit = (line: ReturnType<typeof getBestFitLinePoints>) => {
  return <>y =&nbsp;
    <span className="slope">{String(line.m).substr(0, 6)}</span>
    {`x ${line.plus} ${String(line.b).substr(0, 6)}`}
  </>;
}

export const Graph: React.FC<IGraphProps> = React.memo((props) => {
  let [displayLocal, setDisplayLocal] = useState(false);
  
  let mcpRes  = displayLocal ? mergeResults(props.latestMcpResults, LOCAL_RESULTS_KEY_MCP) : props.latestMcpResults.results;
  let mcpData = divideResultsPerCluster(mcpRes);
  let mcpLine = getBestFitLinePoints(mcpData, 'mcp');

  let wasmRes  = displayLocal ? mergeResults(props.latestWasmResults, LOCAL_RESULTS_KEY_WASM) : props.latestWasmResults.results;
  let wasmData = divideResultsPerCluster(wasmRes);
  let wasmLine = getBestFitLinePoints(wasmData, 'wasm');

  let data = combineTestResults(mcpData, wasmData);
  (data as any[]).push(...mcpLine.points, ...wasmLine.points);

  // TODO throw in an explanation of why the axis's are "(per cluster)"
  return (
    <div className="graph-wrapper">
      <div className="graph-options">
        <span title="Display all the results from previous tests you've run on this device.">
          <input id="displayLocal" name="displayLocal" type="checkbox" checked={displayLocal} onChange={e => setDisplayLocal(e.target.checked)}/>
          <label htmlFor="displayLocal">Also display previously saved results</label>
        </span>
      </div>
      <ResponsiveContainer className="graph">
        <ComposedChart data={data} margin={{ top: 30, right: 30, bottom: 30, left: 45 }}>
          <Legend verticalAlign="top"/>
          <XAxis dataKey="newMarkersClustered" label={{ value: "New markers clustered (per cluster)", position: "bottom" }}
            type="number" domain={[0, 'dataMax']} allowDecimals={false} allowDataOverflow={true} padding={{ right: 10, left: 0}}/>
          <YAxis label={{ value: "Cluster time (per cluster)", angle: -90, position: "left", dy: -80, dx: -10 }} unit="ms" type="number"/>
          <Scatter name="MCP" dataKey="mcpClusterTime" fill={mcpColor} shape={<Dot r={2}/>}/>
          <Scatter name="Wasm" dataKey="wasmClusterTime" fill={wasmColor} shape={<Dot r={2}/>}/>
          <Line dataKey="wasm" stroke={wasmColor} dot={false} legendType="none" strokeWidth="2"/>
          <Line dataKey="mcp" stroke={mcpColor} dot={false} legendType="none" strokeWidth="2"/>
        </ComposedChart>
      </ResponsiveContainer>
      <section id="equations">
        <span id="legend-title" className="title legend"></span>
        <span id="legend-mcp" className="mcp legend">MCP</span>
        <span id="legend-wasm" className="wasm legend">Wasm</span>
        <span id="best-fit-title" className="title">Line of best fit</span>
        <span id="best-fit-mcp" className="mcp">{renderLineOfBestFit(mcpLine)}</span>
        <span id="best-fit-wasm" className="wasm">{renderLineOfBestFit(wasmLine)}</span>
        <span id="r2-title" className="title">Goodness of fit (R<sup>2</sup>)</span>
        <span id="r2-mcp" className="mcp">{String(mcpLine.r).substr(0,5)}</span>
        <span id="r2-wasm" className="wasm">{String(wasmLine.r).substr(0,5)}</span>
        <span id="comparison-title" className="title"></span>
        <div id="comparison">
          <span id="comparison-mcp" className="mcp">{String(mcpLine.m).substr(0, 6)}</span>
          <span id="comparison-wasm" className="wasm">{String(wasmLine.m).substr(0, 6)}</span>
          <span id="comparison-result" className="result">= {String(mcpLine.m/wasmLine.m).substr(0,4)}x &nbsp; Wasm speedup</span>
        </div>
      </section>
    </div>
  )
})