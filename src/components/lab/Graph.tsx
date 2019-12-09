import React from 'react';
import { IGraphProps, ITestSummary, ICombinedResult, MapType } from '../../util/interfaces';
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, Scatter, ComposedChart, Line } from "recharts";

import './Graph.scss';
import { combineTestResults } from '../../util/helpers';

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
  return [
    {
      [`${key}Slope`]: 0, 
      newMarkersClustered: -b/m
    },
    {
      [`${key}Slope`]: (m * maxX + b), 
      newMarkersClustered: maxX
    }
  ];
}

export const Graph: React.FC<IGraphProps> = (props) => {
  let mcpData = divideResultsPerCluster(props.latestMcpResults);
  let wasmData = divideResultsPerCluster(props.latestWasmResults);
  let data = combineTestResults(mcpData, wasmData);
  (data as any).push(...getBestFitLinePoints(mcpData, 'mcp'));
  (data as any).push(...getBestFitLinePoints(wasmData, 'wasm'));
  console.log(JSON.stringify(data));

  return (
    <ResponsiveContainer className="graph-wrapper" width="100%" height="90%" >
      <ComposedChart data={data} margin={{ top: 30, right: 30, bottom: 30, left: 30 }}>
        <XAxis dataKey="newMarkersClustered" name="New markers per cluster" type="number"/>
        <YAxis name="Cluster time per cluster" unit="ms" type="number"/>
        <Scatter name="MCP" dataKey="mcpClusterTime" fill="red"/>
        <Scatter name="Wasm" dataKey="wasmClusterTime" fill="blue"/>
        <Line dataKey="wasmSlope" stroke="blue" dot={false}/>
        <Line dataKey="mcpSlope" stroke="red" dot={false}/>
      </ComposedChart>
    </ResponsiveContainer>
  )
}