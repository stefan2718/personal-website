import React from "react"
import { ITestState } from "../../util/interfaces";

const BOUNDS_ALL_POINTS = { south: 43.3413947, west: -79.94704530000001, north: 43.9865649, east: -78.8772558 };
class TestControls extends React.Component<{}, ITestState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      minZoom: 7,
      maxZoom: 19,
    }
  }

  onZoomChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event && event.target) {
      let value = Number(event.target.value);
      value = value > 19 ? 19 : value < 3 ? 3 : value;
      this.setState({ [event.target.id]: value });
    }
  }
  
  startTest = () => {
    let maxZoom = Math.max(this.state.maxZoom, this.state.minZoom);
    let minZoom = Math.max(this.state.maxZoom, this.state.minZoom);
    let zooms = [...Array(maxZoom - minZoom + 1)].map((_, i) => minZoom + i);
    
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