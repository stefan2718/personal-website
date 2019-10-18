import React from "react"
import { ITestControlsState, IMapTestState, ITestControlsProps, IMapState, Direction, ITestResults, IKeyedMapTestState, ITestSummary, ISpiralState, MapType, ICombinedResult } from "../../util/interfaces";
import { Subject, defer, concat, Observable, } from "rxjs";
import { concatMap, map, delay, reduce, tap, first, } from 'rxjs/operators';
import { INTIAL_MAP_STATE } from "../../util/constants";
import { IMarker, IBounds } from "wasm-marker-clusterer";

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

  onRepeatChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && ["runs", "maxPans"].includes(event.target.id)) {
      let value = Number(event.target.value);
      value = value > 100 ? 100 : value < 1 ? 1 : value;
      this.setState({ [event.target.id]: value });
    }
  }

  onZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target && ["minZoom", "maxZoom"].includes(event.target.id)) {
      let value = Number(event.target.value);
      value = value > 19 ? 19 : value < 1 ? 1 : value;
      this.setState({ [event.target.id]: value });
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
    this.props.setParentState({syncMap: false, testIsRunning: true});
    this.setState({ running: true });

    let initialTestState = getTestInitialState(zoomsPerRun * this.state.runs, this.props.getMapState("mcp"));
    let initialCenter = Object.freeze(Object.assign({}, initialTestState.mapState.center));
    initialTestState.mapState.zoom = minZoom;

    this.centerMapHere.pipe(
      concatMap((testState) =>
        concat(
          this.setMapStateAndWaitForResults("wasm", this.wasmState, testState.mapState),
          this.setMapStateAndWaitForResults("mcp", this.mcpState, testState.mapState)
        ).pipe(
          reduce((acc, curr) => {
            if (curr.key === "mcp") {
              acc.mcpResults[testState.currentIndex].push(this.summarizeTestResults(curr.state));
            } else {
              acc.wasmResults[testState.currentIndex].push(this.summarizeTestResults(curr.state));
            }
            return acc;
          }, testState)
        )
      ),
      map(testState => ({ testState, completion: this.getTestCompletionState(testState, maxZoom) })),
      tap(state => this.triggerNextTestStep(state.completion, state.testState, minZoom, initialCenter)),
      first(state => state.completion === TestCompletionState.COMPLETE)
    ).subscribe(
      result => this.resultsToData(result.testState),
      err => console.error("Uh-oh!", err),
      () => {
        this.props.setParentState({syncMap: true, testIsRunning: false});
        this.setState({ running: false });
      }
    );

    this.centerMapHere.next(initialTestState);
  }

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
    let totalResults: ICombinedResult[] = [];
    if (wasmResults.length !== mcpResults.length) {
      throw new Error(`Length of Wasm results (${wasmResults.length}) not equal to MCP results (${mcpResults.length})`);
    }
    mcpResults.forEach((_, i) => {
      if (mcpResults[i].newMarkersClustered === wasmResults[i].newMarkersClustered && mcpResults[i].clusterCount === wasmResults[i].clusterCount) {
        totalResults.push({
          clusterCount: mcpResults[i].clusterCount,
          newMarkersClustered: mcpResults[i].newMarkersClustered,
          mcpClusterTime: mcpResults[i].clusterTime,
          wasmClusterTime: wasmResults[i].clusterTime,
        });
      } else {
        totalResults.push({
          clusterCount: mcpResults[i].clusterCount,
          newMarkersClustered: mcpResults[i].newMarkersClustered,
          mcpClusterTime: mcpResults[i].clusterTime,
        });
        totalResults.push({
          clusterCount: wasmResults[i].clusterCount,
          newMarkersClustered: wasmResults[i].newMarkersClustered,
          wasmClusterTime: wasmResults[i].clusterTime,
        });
      }
    });
    console.log('New Markers Clustered, Clusters, Wasm Cluster Time, MCP Cluster Time\n' +
      totalResults.map(row => `${row.newMarkersClustered},${row.clusterCount},` +
        `${row.wasmClusterTime ? this.round(row.wasmClusterTime) : ''},` +
        `${row.mcpClusterTime  ? this.round(row.mcpClusterTime)  : ''}`)
        .join('\n')
    );
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
      this.props.setParentState((currentState: any) => {
        return {
          ...currentState,
          [`${key}MapState`]: mapState
        };
      });
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
        console.error("Unknown 'Direction':", direction);
    }
  }

  render() {
    return (
      <div className="test-controls">
        <h4>Automated Performance Test</h4>
        <div className="inputs">
          <label htmlFor="minZoom">Min zoom<br/>
            <input id="minZoom" type="number" min="3" max="19" disabled={this.state.running} value={this.state.minZoom} onChange={this.onZoomChange}/>
          </label>
          <label htmlFor="maxZoom">Max zoom<br/>
            <input id="maxZoom" type="number" min="3" max="19" disabled={this.state.running} value={this.state.maxZoom} onChange={this.onZoomChange}/>
          </label>
          <label htmlFor="runs">Runs<br/>
            <input id="runs" type="number" min="1" max="100" disabled={this.state.running} value={this.state.runs} onChange={this.onRepeatChange}/>
          </label>
          <label htmlFor="maxPans">Max pans per zoom<br/>
            <input id="maxPans" type="number" min="1" max="100" disabled={this.state.running} value={this.state.maxPans} onChange={this.onRepeatChange}/>
          </label>
          <button className="button" onClick={this.startTest} disabled={this.state.running}>{ this.state.running ? 'Running...' : 'Start' }</button>
        </div>
      </div>
    )
  }
}

export default TestControls;