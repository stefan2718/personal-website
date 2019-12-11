import React from "react"
import { ITestControlsState, IMapTestState, ITestControlsProps, IMapState, Direction, ITestResults, IKeyedMapTestState, ITestSummary, ISpiralState, MapType, ICombinedResult, ITestControlsStateNumbers } from "../../util/interfaces";
import { Subject, defer, concat, Observable, forkJoin, } from "rxjs";
import { concatMap, map, delay, reduce, tap, first, } from 'rxjs/operators';
import { INTIAL_MAP_STATE } from "../../util/constants";
import { IMarker, IBounds } from "wasm-marker-clusterer";
import { WasmTestRequest } from "../../../shared/shared";
import ReactModal from 'react-modal';

import './TestControls.scss';
import { Graph } from "./Graph";
import { combineTestResults } from "../../util/helpers";

const COOLDOWN_WAIT_TIME = 300;
const INITIAL_SPIRAL_STATE: ISpiralState = Object.freeze({
  totalPansPerZoom: 1,
  stepsLeft: 1,
  totalSteps: 1,
  direction: Direction.south,
  isFirstOfTwoDirections: true,
});
const TOTAL_MARKERS = 10000;

const getTestInitialState = (zoomLevels: number, initialMapState: IMapState = INTIAL_MAP_STATE): ITestResults => ({
  currentIndex: 0,
  runCount: 1,
  mapState: Object.assign({}, initialMapState),
  spiralState: Object.assign({}, INITIAL_SPIRAL_STATE),
  mcpResults: Array(zoomLevels).fill(0).map(() => []),
  wasmResults: Array(zoomLevels).fill(0).map(() => []),
});

enum TestCompletionState {
  COMPLETE, DONE_RUN, DONE_AT_ZOOM, NEXT_PAN
}

const minMax: {[key in keyof ITestControlsStateNumbers] : {min: number, max: number}} = {
  minZoom: { min: 1, max: 19 },
  maxZoom: { min: 1, max: 19 },
  maxPans: { min: 1, max: 100 },
  runs: { min: 1, max: 100 },
}

const numKeys: (keyof ITestControlsStateNumbers)[] = [ "runs", "maxPans", "minZoom", "maxZoom" ];

const isNumKey = (key: string): key is keyof ITestControlsStateNumbers => {
  return numKeys.includes(key as any);
}

ReactModal.setAppElement('#___gatsby');

class TestControls extends React.Component<ITestControlsProps, ITestControlsState> {

  wasmState: Subject<IMapTestState> = new Subject();
  mcpState: Subject<IMapTestState> = new Subject();
  centerMapHere: Subject<ITestResults> = new Subject();

  constructor(props: ITestControlsProps) {
    super(props);
    this.state = {
      minZoom: 7,
      maxZoom: 14,
      maxPans: 5,
      runs: 1,
      running: false,
      submitResults: true,
      showModal: false,
      latestMcpResults: [{"clusterTime":1643,"markerCount":10000,"clusterCount":1,"newMarkersClustered":10000},{"clusterTime":1096,"markerCount":10000,"clusterCount":6,"newMarkersClustered":10000},{"clusterTime":900,"markerCount":10000,"clusterCount":16,"newMarkersClustered":10000}],
      latestWasmResults: [{"clusterTime":790,"markerCount":10000,"clusterCount":1,"newMarkersClustered":10000},{"clusterTime":252,"markerCount":10000,"clusterCount":6,"newMarkersClustered":10000},{"clusterTime":185,"markerCount":10000,"clusterCount":16,"newMarkersClustered":10000}],
    }
  }

  componentDidUpdate(prevProps: ITestControlsProps, prevState: ITestControlsState) {
    if (this.props.wasmState.clusterEnd != prevProps.wasmState.clusterEnd) {
      this.wasmState.next(this.props.wasmState);
    }
    if (this.props.mcpState.clusterEnd != prevProps.mcpState.clusterEnd) {
      this.mcpState.next(this.props.mcpState);
    }
  }

  onNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target) {
      let id = event.target.id;
      if (isNumKey(id)) {
        let value = Number(event.target.value);
        value = value > minMax[id].max ? minMax[id].max : value < minMax[id].min ? minMax[id].min : value;
        this.setState({ [id]: value } as { [key in keyof ITestControlsStateNumbers]: number });
      }
    }
  }

  summarizeTestResults = (testState: IMapTestState): ITestSummary => {
    delete testState.clusterEnd;
    return testState;
  }
  
  startTest = () => {
    let maxZoom = Math.max(this.state.maxZoom, this.state.minZoom);
    let minZoom = Math.min(this.state.maxZoom, this.state.minZoom);
    let zoomsPerRun = maxZoom - minZoom + 1;
    this.props.setSyncMap(false);
    this.props.setTestIsRunning(true);
    this.setState({ running: true });

    let initialMapState = this.props.getMapState("mcp");
    let initialTestState = getTestInitialState(zoomsPerRun * this.state.runs, initialMapState);
    let initialCenter = Object.freeze(Object.assign({}, initialTestState.mapState.center));
    initialTestState.mapState.zoom = minZoom;

    this.centerMapHere.pipe(
      concatMap((testState) =>
        concat(
          this.setMapStateAndWaitForResults("wasm", this.wasmState, testState.mapState),
          this.setMapStateAndWaitForResults("mcp", this.mcpState, testState.mapState)
        ).pipe(
          reduce(this.getTestReducerFn(testState), testState)
        )
      ),
      map(testState => ({ testState, completion: this.getTestCompletionState(testState, maxZoom) })),
      tap(state => this.triggerNextTestStep(state.completion, state.testState, minZoom, initialCenter)),
      first(state => state.completion === TestCompletionState.COMPLETE)
    ).subscribe(
      result => this.resultsToData(result.testState),
      err => console.error("Uh-oh!", err),
      () => {
        this.props.setSyncMap(true);
        this.props.setTestIsRunning(false);
        this.setState({ running: false });
      }
    );

    // If the current zoom equals the first test zoom, zoom out once, then start.
    if (initialMapState.zoom === minZoom) {
      initialTestState.mapState.zoom--;
      forkJoin(
        this.setMapStateAndWaitForResults("wasm", this.wasmState, initialTestState.mapState),
        this.setMapStateAndWaitForResults("mcp", this.mcpState, initialTestState.mapState)
      ).subscribe(() => {
        initialTestState.mapState.zoom++;
        this.centerMapHere.next(initialTestState);
      });
    } else {
      this.centerMapHere.next(initialTestState);
    }
  }

  getTestReducerFn = (testState: ITestResults) => (acc: ITestResults, curr: IKeyedMapTestState) => {
    if (curr.key === "mcp") {
      acc.mcpResults[testState.currentIndex].push(this.summarizeTestResults(curr.state));
    } else {
      acc.wasmResults[testState.currentIndex].push(this.summarizeTestResults(curr.state));
    }
    return acc;
  };

  getTestCompletionState = (testState: ITestResults, maxZoom: number): TestCompletionState => {
    let wasmZoomResults = testState.wasmResults[testState.currentIndex];
    let mcpZoomResults = testState.mcpResults[testState.currentIndex];
    let allMarkersClustered =
      wasmZoomResults[wasmZoomResults.length - 1].markerCount >= TOTAL_MARKERS &&
      mcpZoomResults[mcpZoomResults.length - 1].markerCount >= TOTAL_MARKERS;

    let doneAtZoomLevel = allMarkersClustered || (testState.spiralState.totalPansPerZoom === this.state.maxPans);

    if (doneAtZoomLevel) {
      if (testState.mapState.zoom === maxZoom) {
        if (testState.runCount === this.state.runs) {
          return TestCompletionState.COMPLETE;
        } else {
          return TestCompletionState.DONE_RUN;
        }
      } else {
        return TestCompletionState.DONE_AT_ZOOM;
      }
    } else {
      return TestCompletionState.NEXT_PAN;
    }
  }

  triggerNextTestStep = (testCompletion: TestCompletionState, testState: ITestResults, minZoom: number, initialCenter: IMarker): void => {
    switch (testCompletion) {
      case TestCompletionState.COMPLETE:
        return;
      case TestCompletionState.DONE_RUN:
        testState.runCount++;
        testState.mapState.zoom = minZoom - 1;
      case TestCompletionState.DONE_AT_ZOOM:
        testState.currentIndex++;
        testState.mapState.zoom++;
        testState.mapState.center = Object.assign({}, initialCenter);
        testState.spiralState = Object.assign({}, INITIAL_SPIRAL_STATE);
        this.centerMapHere.next(testState);
        break;
      case TestCompletionState.NEXT_PAN:
        testState.mapState.center = this.calculateNextCenter(testState.mapState.center, this.props.bounds, testState.spiralState.direction);
        testState.spiralState = this.getNextSpiralStep(testState.spiralState);
        this.centerMapHere.next(testState);
        break;
    }
  }

  resultsToData = (results: ITestResults) => {
    let wasmResults = this.flattenTestResults(results.wasmResults);
    let mcpResults = this.flattenTestResults(results.mcpResults);

    if (wasmResults.length !== mcpResults.length) {
      throw new Error(`Length of Wasm results (${wasmResults.length}) not equal to MCP results (${mcpResults.length})`);
    }
    if (this.state.submitResults) {
      this.postTestResults(wasmResults, mcpResults);
    }

    this.setState({
      latestMcpResults: mcpResults,
      latestWasmResults: wasmResults,
      showModal: true,
    });

    let totalResults = combineTestResults(mcpResults, wasmResults);

    console.log('New Markers Clustered, Clusters, Wasm Cluster Time, MCP Cluster Time\n' +
      totalResults.map(row => `${row.newMarkersClustered},${row.clusterCount},` +
        `${row.wasmClusterTime ? this.round(row.wasmClusterTime) : ''},` +
        `${row.mcpClusterTime  ? this.round(row.mcpClusterTime)  : ''}`)
        .join('\n')
    );
  }

  postTestResults = async (wasmResults: ITestSummary[], mcpResults: ITestSummary[]) => {
    const body: WasmTestRequest = {
      wasmResults,
      mcpResults,
      gridSize: this.props.gridSize,
      maxPans: this.state.maxPans,
      maxZoom: this.state.maxZoom,
      minZoom: this.state.minZoom,
      runs: this.state.runs,
    };
    const response = await fetch(`${process.env.API_ENDPOINT}/lab/wasm-marker-clusterer/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      let text = await response.text();
      console.error(`Sending test data failed with ${response.status}.\n${text}`);
    }
  }

  flattenTestResults = (results: ITestSummary[][]): ITestSummary[] => {
    let totalResults = results.reduce((accResults, zoomResults) => {
      zoomResults.forEach((time, index) => {
        time.newMarkersClustered = index === 0 ? time.markerCount : time.markerCount - zoomResults[index - 1].markerCount;
      });
      accResults.push(...zoomResults);
      return accResults;
    }, []);
    return totalResults;
  }

  round = (num: number): number => {
    return Math.round(num * 10000) / 10000;
  }

  setMapStateAndWaitForResults = (key: MapType, resultSubject: Subject<IMapTestState>, mapState: IMapState): Observable<IKeyedMapTestState> => {
    return defer(() => {
      if (key === "wasm") {
        this.props.setWasmMapState(mapState);
      } else {
        this.props.setMcpMapState(mapState);
      }
      return resultSubject.pipe(
        map(state => ({ key, state })),
        first(),
        delay(COOLDOWN_WAIT_TIME),
      );
    });
  }

  getNextSpiralStep = (lastStep: ISpiralState): ISpiralState => {
    let noStepsLeft = (lastStep.stepsLeft - 1) === 0;
    return {
      totalPansPerZoom: lastStep.totalPansPerZoom + 1,
      stepsLeft: !noStepsLeft ? lastStep.stepsLeft - 1 : lastStep.isFirstOfTwoDirections ? lastStep.totalSteps : lastStep.totalSteps + 1,
      direction: noStepsLeft ? this.incrementDirection(lastStep.direction) : lastStep.direction,
      totalSteps: noStepsLeft && !lastStep.isFirstOfTwoDirections ? lastStep.totalSteps + 1 : lastStep.totalSteps,
      isFirstOfTwoDirections: noStepsLeft ? !lastStep.isFirstOfTwoDirections : lastStep.isFirstOfTwoDirections,
    };
  }

  incrementDirection = (direction: Direction): Direction => {
    return (++direction % 4);
  }

  calculateNextCenter = (center: IMarker, bounds: IBounds, direction: Direction): IMarker => {
    switch (direction) {
      case Direction.north:
        return {
          lat: bounds.north,
          lng: center.lng
        };
      case Direction.east:
        return {
          lat: center.lat,
          lng: bounds.east
        };
      case Direction.south:
        return {
          lat: bounds.south,
          lng: center.lng
        };
      case Direction.west:
        return {
          lat: center.lat,
          lng: bounds.west
        };
      default:
        throw new Error(`Unknown 'Direction': ${direction}`);
    }
  }

  setBoolean = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ submitResults: event.target.checked });
  }

  render() {
    return (
      <div className="test-controls">
        <h4>Automated Test Settings</h4>
        <div className="inputs">
          <label htmlFor="minZoom" title="The most zoomed out level, where the test will start">Min zoom<br/>
            <input id="minZoom" type="number" min={minMax["minZoom"].min} max={minMax["minZoom"].max} disabled={this.state.running} value={this.state.minZoom} onChange={this.onNumberChange}/>
          </label>
          <label htmlFor="maxZoom" title="The most zoomed in level, where the test will end">Max zoom<br/>
            <input id="maxZoom" type="number" min={minMax["maxZoom"].min} max={minMax["maxZoom"].max} disabled={this.state.running} value={this.state.maxZoom} onChange={this.onNumberChange}/>
          </label>
          <label htmlFor="runs" title="How many iterations going from minZoom to maxZoom">Runs<br/>
            <input id="runs" type="number" min={minMax["runs"].min} max={minMax["runs"].max} disabled={this.state.running} value={this.state.runs} onChange={this.onNumberChange}/>
          </label>
          <label htmlFor="maxPans" title="How many times the map will pan in any direction at the same zoom level. Only is involved if all markers are not already clustered at the given zoom level">Max pans per zoom<br/>
            <input id="maxPans" type="number" min={minMax["maxPans"].min} max={minMax["maxPans"].max} disabled={this.state.running} value={this.state.maxPans} onChange={this.onNumberChange}/>
          </label>
          <span title="If checked, your test results will be sent to a database to draw aggregated graphs for different browsers and OS's. No personal information is involved at all.">
            <input id="submitResults" name="submitResults" type="checkbox" checked={this.state.submitResults} onChange={this.setBoolean}/>
            <label htmlFor="submitResults">Submit results</label>
          </span>
          <button className="button" onClick={this.startTest} disabled={this.state.running}>{ this.state.running ? 'Running...' : 'Start' }</button>
          {/* <button className="button" onClick={() => this.setState({ showModal: !this.state.showModal })}>Toggle modal</button> */}
          <ReactModal isOpen={this.state.showModal} onRequestClose={() => this.setState({ showModal: false })} className="graph-modal">
            <Graph latestMcpResults={this.state.latestMcpResults} latestWasmResults={this.state.latestWasmResults}></Graph>
            <button className="button close" onClick={() => this.setState({ showModal: false })}>Close</button>
          </ReactModal>
        </div>
      </div>
    )
  }
}

export default TestControls;