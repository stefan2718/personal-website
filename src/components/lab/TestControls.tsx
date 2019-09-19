import React from "react"
import { ITestControlsState, IMapTestState, ITestControlsProps, IMapState, Direction, IPoint, IBounds, ITestResults, IKeyedMapTestState, ITestSummary, ISpiralState } from "../../util/interfaces";
import { Subject, defer, concat, Observable, BehaviorSubject, } from "rxjs";
import { take, concatMap, map, delay, reduce, filter, } from 'rxjs/operators';
import { INTIAL_MAP_STATE } from "../../util/constants";

const COOLDOWN_WAIT_TIME = 300;
const INITIAL_SPIRAL_STATE = Object.freeze({
  stepsLeft: 1,
  totalSteps: 1,
  direction: Direction.south,
  isFirstOfTwoDirections: true,
});
const TOTAL_MARKERS = 10000;

const getTestInitialState = (zoomLevels: number): ITestResults => ({
  mapState: Object.assign({}, INTIAL_MAP_STATE),
  spiralState: Object.assign({}, INITIAL_SPIRAL_STATE),
  mcpResults: Array(zoomLevels).fill(0).map(() => []),
  wasmResults: Array(zoomLevels).fill(0).map(() => []),
});

class TestControls extends React.Component<ITestControlsProps, ITestControlsState> {

  wasmState: Subject<IMapTestState> = new Subject();
  mcpState: Subject<IMapTestState> = new Subject();
  centerMapHere: BehaviorSubject<ITestResults> = new BehaviorSubject(getTestInitialState(0));

  constructor(props: ITestControlsProps) {
    super(props);
    this.state = {
      minZoom: 7,
      maxZoom: 14,
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
    this.props.setParentState({syncMap: false});
    this.setState({ running: true });

    let initialTestState = getTestInitialState(maxZoom - minZoom + 1);
    initialTestState.mapState.zoom = minZoom;
    this.centerMapHere.next(initialTestState);

    this.centerMapHere.pipe(
      concatMap((testState) =>
        concat(
          this.setMapStateAndWaitForResults("wasm", this.wasmState, testState.mapState),
          this.setMapStateAndWaitForResults("mcp", this.mcpState, testState.mapState)
        ).pipe(
          reduce((acc, curr) => {
            if (curr.key === "mcp") {
              acc.mcpResults[testState.mapState.zoom - minZoom].push(this.summarizeTestResults(curr.state));
            } else {
              acc.wasmResults[testState.mapState.zoom - minZoom].push(this.summarizeTestResults(curr.state));
            }
            return acc;
          }, testState)
        )
      ),
      filter(testState => {
        let wasmZoomResults = testState.wasmResults[testState.mapState.zoom - minZoom];
        let mcpZoomResults = testState.mcpResults[testState.mapState.zoom - minZoom];
        let allMarkersClustered =
          wasmZoomResults[wasmZoomResults.length - 1].markerCount >= TOTAL_MARKERS &&
          mcpZoomResults[mcpZoomResults.length - 1].markerCount >= TOTAL_MARKERS;

        if (testState.mapState.zoom === maxZoom && allMarkersClustered) {
          return true;
        }

        if (allMarkersClustered) {
          testState.mapState.zoom++;
          testState.mapState.center = Object.assign({}, INTIAL_MAP_STATE.center);
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
        this.props.setParentState({syncMap: true});
        this.setState({ running: false });
      }
    );
  }

  resultsToData = (results: ITestResults) => {
    this.testResultsToData("wasm", results.wasmResults);
    this.testResultsToData("mcp", results.mcpResults);
  }

  testResultsToData = (type: string, results: ITestSummary[][]) => {
    let totalResults = results.reduce((accResults, zoomResults) => {
      let transposedArray = zoomResults.reduce((accTime, time) => {
        accTime.newMarkersClustered.push(accTime.newMarkersClustered.length === 0 ? time.markerCount : 
          time.markerCount - accTime.markerCount[accTime.markerCount.length - 1]);
        accTime.markerCount.push(time.markerCount);
        accTime.clusterTime.push(time.clusterTime);
        return accTime;
      }, { clusterTime: [], markerCount: [], newMarkersClustered: []});
      accResults.clusterTime.push(...transposedArray.clusterTime);
      accResults.newMarkersClustered.push(...transposedArray.newMarkersClustered);
      return accResults;
    }, {clusterTime: [], newMarkersClustered: []});
    console.log(type + "\n" +
      totalResults.clusterTime.join(", ") + "\n" +
      totalResults.newMarkersClustered.join(", ") + "\n"
    );
  }

  resultsToCsv = (results: ITestResults) => {
    this.testResultsToCsv("wasm", results.wasmResults);
    this.testResultsToCsv("mcp", results.mcpResults);
  }

  testResultsToCsv = (type: string, results: ITestSummary[][]) => {
    let str = type + "\n" + results.reduce((accResults, zoomResults) => {
      let transposedArray = zoomResults.reduce((accTime, time) => {
        accTime.newMarkersClustered.push(accTime.newMarkersClustered.length === 0 ? time.markerCount : 
          time.markerCount - accTime.markerCount[accTime.markerCount.length - 1]);
        accTime.clusterCount.push(time.clusterCount);
        accTime.markerCount.push(time.markerCount);
        accTime.clusterTime.push(time.clusterTime);
        return accTime;
      }, { clusterTime: [], clusterCount: [], markerCount: [], newMarkersClustered: []});
      return accResults + "\n" + 
        transposedArray.clusterTime.join(", ") + "\n" +
        transposedArray.clusterCount.join(", ") + "\n" +
        transposedArray.markerCount.join(", ") + "\n" + 
        transposedArray.newMarkersClustered.join(", ") + "\n";
    }, "");
    console.log(str);
  }

  setMapStateAndWaitForResults = (key: "mcp" | "wasm", resultSubject: Subject<IMapTestState>, mapState: IMapState): Observable<IKeyedMapTestState> => {
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
          <label htmlFor="minZoom">Min Zoom<br/>
            <input id="minZoom" type="number" min="3" max="19" value={this.state.minZoom} onChange={this.onZoomChange}/>
          </label>
          <label htmlFor="maxZoom">Max Zoom<br/>
            <input id="maxZoom" type="number" min="3" max="19" value={this.state.maxZoom} onChange={this.onZoomChange}/>
          </label>
          <button className="button" onClick={this.startTest} disabled={this.state.running}>{ this.state.running ? 'Running...' : 'Start' }</button>
        </div>
      </div>
    )
  }
}

export default TestControls;