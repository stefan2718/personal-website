import React from "react"
import { ITestControlsState, IMapTestState, ITestControlsProps, IMapState, Direction, IPoint, IBounds, ITestResults, IKeyedMapTestState, ITestSummary, ISpiralState, MapType } from "../../util/interfaces";
import { Subject, defer, concat, Observable } from "rxjs";
import { take, concatMap, map, delay, reduce, filter, } from 'rxjs/operators';
import { INTIAL_MAP_STATE } from "../../util/constants";

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

class TestControls extends React.Component<ITestControlsProps, ITestControlsState> {

  wasmState: Subject<IMapTestState> = new Subject();
  mcpState: Subject<IMapTestState> = new Subject();
  centerMapHere: Subject<ITestResults> = new Subject();

  constructor(props: ITestControlsProps) {
    super(props);
    this.state = {
      minZoom: 7,
      maxZoom: 14,
      maxPans: 20,
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
    return {
      clusterTime: testState.clusterTime,
      clusterCount: testState.clusters.length,
      markerCount: testState.clusters.reduce((acc, curr) => acc + curr.markers.length, 0)
    }
  }
  
  startTest = () => {
    let maxZoom = Math.max(this.state.maxZoom, this.state.minZoom);
    let minZoom = Math.min(this.state.maxZoom, this.state.minZoom);
    let zoomsPerRun = maxZoom - minZoom + 1;
    this.props.setParentState({syncMap: false, testIsRunning: true});
    this.setState({ running: true });

    let initialTestState = getTestInitialState(zoomsPerRun * this.state.runs, Object.assign({},this.props.getMapState("mcp")));
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
      filter(testState => {
        let wasmZoomResults = testState.wasmResults[testState.currentIndex];
        let mcpZoomResults = testState.mcpResults[testState.currentIndex];
        let allMarkersClustered =
          wasmZoomResults[wasmZoomResults.length - 1].markerCount >= TOTAL_MARKERS &&
          mcpZoomResults[mcpZoomResults.length - 1].markerCount >= TOTAL_MARKERS;

        let doneAtZoomLevel = allMarkersClustered || (testState.spiralState.totalPansPerZoom === this.state.maxPans);

        if (testState.mapState.zoom === maxZoom && doneAtZoomLevel) {
          if (testState.runCount === this.state.runs) {
            return true;
          } else {
            testState.runCount++;
            testState.mapState.zoom = minZoom - 1;
          }
        }

        if (doneAtZoomLevel) {
          testState.currentIndex++;
          testState.mapState.zoom++;
          testState.mapState.center = Object.assign({}, initialTestState.mapState.center);
          testState.spiralState = Object.assign({}, INITIAL_SPIRAL_STATE);
        } else {
          testState.mapState.center = this.calculateNextCenter(testState.mapState.center, this.props.bounds, testState.spiralState.direction);
          testState.spiralState = this.getNextSpiralStep(testState.spiralState);
        }
        this.centerMapHere.next(testState);
        return false;
      }),
      take(1)
    ).subscribe(
      result => this.resultsToData(result),
      err => console.error("Uh-oh!", err),
      () => {
        this.props.setParentState({syncMap: true, testIsRunning: false});
        this.setState({ running: false });
      }
    );

    this.centerMapHere.next(initialTestState);
  }

  resultsToData = (results: ITestResults) => {
    this.testResultsToData("wasm", results.wasmResults);
    this.testResultsToData("mcp", results.mcpResults);
  }

  testResultsToData = (type: MapType, results: ITestSummary[][]) => {
    let totalResults = results.reduce((accResults, zoomResults) => {
      zoomResults.forEach((time, index) => {
        time.newMarkersClustered = index === 0 || type === "wasm" ? time.markerCount : 
          time.markerCount - zoomResults[index - 1].markerCount;
      });
      accResults.push(...zoomResults);
      return accResults;
    }, []);
    console.log(type + "\nnewMarkers,clusterCount,clusterTime\n" +
      totalResults.map((row) => `${row.newMarkersClustered},${row.clusterCount},${this.round(row.clusterTime)}`).join('\n')
    );
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
        take(1),
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

  calculateNextCenter = (center: IPoint, bounds: IBounds, direction: Direction): IPoint => {
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
            <input id="minZoom" type="number" min="3" max="19" value={this.state.minZoom} onChange={this.onZoomChange}/>
          </label>
          <label htmlFor="maxZoom">Max zoom<br/>
            <input id="maxZoom" type="number" min="3" max="19" value={this.state.maxZoom} onChange={this.onZoomChange}/>
          </label>
          <label htmlFor="runs">Runs<br/>
            <input id="runs" type="number" min="1" max="100" value={this.state.runs} onChange={this.onRepeatChange}/>
          </label>
          <label htmlFor="maxPans">Max pans per zoom<br/>
            <input id="maxPans" type="number" min="1" max="100" value={this.state.maxPans} onChange={this.onRepeatChange}/>
          </label>
          <button className="button" onClick={this.startTest} disabled={this.state.running}>{ this.state.running ? 'Running...' : 'Start' }</button>
        </div>
      </div>
    )
  }
}

export default TestControls;