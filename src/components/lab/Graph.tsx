import React, { useState } from 'react';
import { IGraphProps, ITestSummary, MapType, ILocalResults } from '../../util/interfaces';
import { ResponsiveContainer, XAxis, YAxis, Scatter, ComposedChart, Line, Dot, Legend } from "recharts";

import './Graph.scss';
import { combineTestResults } from '../../util/helpers';
import { LOCAL_RESULTS_KEY_MCP, LOCAL_RESULTS_KEY_WASM } from '../../util/constants';

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

export const Graph: React.FC<IGraphProps> = (props) => {
  let [displayLocal, setDisplayLocal] = useState(true);

  // TODO: memoize
  let mcpRes  = displayLocal ? mergeResults(props.latestMcpResults, LOCAL_RESULTS_KEY_MCP) : props.latestMcpResults.results;
  let mcpData = divideResultsPerCluster(mcpRes);
  let mcpLine = getBestFitLinePoints(mcpData, 'mcp');

  let wasmRes  = displayLocal ? mergeResults(props.latestWasmResults, LOCAL_RESULTS_KEY_WASM) : props.latestWasmResults.results;
  let wasmData = divideResultsPerCluster(wasmRes);
  let wasmLine = getBestFitLinePoints(wasmData, 'wasm');

  let data = combineTestResults(mcpData, wasmData);
  (data as any[]).push(...mcpLine.points, ...wasmLine.points);

  return (
    <div className="graph-wrapper">
      <ResponsiveContainer height="75%">
        <ComposedChart data={data} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
          <Legend verticalAlign="top"/>
          <XAxis dataKey="newMarkersClustered" label={{ value: "New markers clustered (per cluster)", position: "bottom" }}
            type="number" domain={[0, 'dataMax']} allowDecimals={false} allowDataOverflow={true} padding={{ right: 10, left: 0}}/>
          <YAxis label={{ value: "Cluster time (per cluster)", angle: -90, position: "left" }} unit="ms" type="number"/>
          <Scatter name="MCP" dataKey="mcpClusterTime" fill="red" shape={<Dot r={2}/>}/>
          <Scatter name="Wasm" dataKey="wasmClusterTime" fill="blue" shape={<Dot r={2}/>}/>
          <Line dataKey="wasm" stroke="blue" dot={false} legendType="none" strokeWidth="2"/>
          <Line dataKey="mcp" stroke="red" dot={false} legendType="none" strokeWidth="2"/>
        </ComposedChart>
      </ResponsiveContainer>
      {/* TODO: redo this table with Grid */}
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>Line of best fit</th>
            <th>Goodness of fit (R<sup>2</sup>)</th>
            <th style={{ textAlign: "left", paddingLeft: "2em"}}>Comparison</th>
          </tr>
          <tr className="mcp">
            <td>MCP</td>
            <td>{`y = ${String(mcpLine.m).substr(0, 6)}x ${mcpLine.plus} ${String(mcpLine.b).substr(0, 6)}`}</td>
            <td className="graph-r">{String(mcpLine.r).substr(0,5)}</td>
            <td rowSpan={2}>
              <div className="division">
                <span className="divisor">
                  <div>{String(mcpLine.m).substr(0, 6)}</div>
                  <div className="wasm">{String(wasmLine.m).substr(0, 6)}</div>
                </span>
                <span style={{ color: "black" }}>= {String(mcpLine.m/wasmLine.m).substr(0,4)}x &nbsp; Wasm speedup</span>
              </div>
            </td>
          </tr>
          <tr className="wasm">
            <td>Wasm</td>
            <td>{`y = ${String(wasmLine.m).substr(0, 6)}x ${wasmLine.plus} ${String(wasmLine.b).substr(0, 6)}`}</td>
            <td className="graph-r">{String(wasmLine.r).substr(0,5)}</td>
          </tr>
        </tbody>
      </table>
      <div className="graph-options">
        <span title="Display all the results from previous tests you've run on this device.">
          <input id="displayLocal" name="displayLocal" type="checkbox" checked={displayLocal} onChange={e => setDisplayLocal(e.target.checked)}/>
          <label htmlFor="displayLocal">Display all saved results</label>
        </span>
      </div>
    </div>
  )
}