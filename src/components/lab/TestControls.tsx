import React from "react"
import { ITestControlsState, IMapTestState, ITestControlsProps } from "../../util/interfaces";
import { Subject, defer, from, concat, empty, of, Observable } from "rxjs";
import { take, concatMap, map, switchMap, delay, concatAll } from 'rxjs/operators';

const BOUNDS_ALL_POINTS = Object.freeze({ south: 43.3413947, west: -79.94704530000001, north: 43.9865649, east: -78.8772558 });
const INTIAL_CENTER = Object.freeze({ center: { lat: 43.6358644, lng: -79.4673894 }, zoom: 8 });
const COOLDOWN_WAIT_TIME = 1000;

class TestControls extends React.Component<ITestControlsProps, ITestControlsState> {

  wasmState: Subject<IMapTestState> = new Subject();
  mcpState: Subject<IMapTestState> = new Subject();

  constructor(props: ITestControlsProps) {
    super(props);
    this.state = {
      minZoom: 7,
      maxZoom: 14,
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
    if (event && event.target) {
      let value = Number(event.target.value);
      value = value > 19 ? 19 : value < 1 ? 1 : value;
      this.setState({ [event.target.id]: value });
    }
  }
  
  startTest = () => {
    let maxZoom = Math.max(this.state.maxZoom, this.state.minZoom);
    let minZoom = Math.min(this.state.maxZoom, this.state.minZoom);
    let zooms = Array(maxZoom - minZoom + 1).fill(0).map((_, i) => minZoom + i);
    this.props.setParentState({syncMap: false});

    let center = Object.assign({}, INTIAL_CENTER);
    console.log(center);
    

    from(zooms).pipe(
      concatMap(
        (zoom) => {
          return concat(
            defer(() => {
              console.log("wasm zoom ", zoom);
              this.props.setParentState((currentState: any) => {
                return {
                  ...currentState,
                  wasmMapState: {
                    zoom, center: INTIAL_CENTER.center
                  }
                };
              });
              return this.wasmState.pipe(
                take(1),
                delay(COOLDOWN_WAIT_TIME),
                map(state => {
                  console.log("wasm", state);
                  return zoom;
                }),
              );
            }),
            defer(() => {
              console.log("mcp zoom ", zoom);
              this.props.setParentState((currentState: any) => {
                return {
                  ...currentState,
                  mcpMapState: {
                    zoom, center: INTIAL_CENTER.center
                  }
                };
              });
              return this.mcpState.pipe(
                take(1),
                delay(COOLDOWN_WAIT_TIME),
                map(state => {
                  console.log("mcp", state);
                  return zoom;
                }),
              );
            })
          );
        },
      )
    ).subscribe(zoom => console.log("done ", zoom));


    // For each zoom:
    // move map1
    // wait for clustering time, and marker count
    // wait a bit more
    // move map1
    // wait for clustering time, and marker count
    // wait a bit more
    // check if all markers clustered,
    //   if true, choose new zoom, return to center
    //   if false, choose new center
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
          <button className="button" onClick={this.startTest}>Start</button>
        </div>
      </div>
    )
  }
}

export default TestControls;