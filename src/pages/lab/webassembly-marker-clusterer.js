import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../../components/HomePageLayout';

class Clusterer extends React.Component {
  clusterer = null;

  constructor() {
    super();

    this.state = {
      loadWasmFailure: false,
      numberOfPoints: 1,
      points: [{lat: 1, lng: 2, price: 3}],
      clusters: [],
    };
  }

  componentDidMount() {
    import("@stefan2718/webassembly-marker-clusterer")
      .then(lib => this.clusterer = lib)
      .catch(err => {
        console.err(err);
        this.setState({ loadWasmFailure: true });
      });
  }

  clusterPoints = () => {
    console.time("into wasm");
    let a = this.clusterer.parse_and_cluster_points(this.state.points);
    console.timeEnd("out of wasm");
    this.setState({ clusters: a });
  }

  changeNumberOfPoints = (event) => {
    let size = 0;
    if (event.target.value > 0) {
      size = event.target.value; 
    }
    this.setState({
      numberOfPoints: size,
      points: Array(Number(size)).fill({ lat: 1, lng: 2, price: 3 }),
    });
  }

  render() {
    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>WebAssembly Markerer Clusterer</title>
          <meta name="description" content="A side-by-side comparison of the popular MarkerClusterPlus for Google Maps and a WebAssembly port of the same logic." />
        </Helmet>
        <div id="main" className="wasm-lab">
          <div className="inner-main">
            <h1>WebAssembly Experiment</h1>
            <p>I'm working towards a side-by-side comparison of the popular&nbsp;
              <a href="https://github.com/googlemaps/v3-utility-library/tree/master/markerclustererplus">MarkerClusterPlus for Google Maps</a>
              &nbsp;library and a <a href="https://developer.mozilla.org/en-US/docs/WebAssembly">WebAssembly</a> 
              &nbsp;implementation. MarkerClusterPlus clusters map points together when you have too many to display. This can become fairly CPU intensive when 
              you have thousands of map points. I'd like to see what benefits there will be from moving this clustering logic into
              a WebAssembly module. Hopefully, by running it outside of the main JavaScript event loop, it will take less time, and
              allow the page to keep rendering without blocking.
            </p>
            <main>
              <label htmlFor="numPoints">Number of points
                <input id="numPoints" type="number" value={this.state.numberOfPoints} onChange={this.changeNumberOfPoints}/>
              </label>
              <div>
                <button className="button" onClick={this.clusterPoints}>Cluster all points - in WASM!</button>
                <span>See console for performance timings</span>
              </div>
              { !!this.state.loadWasmFailure ? "Wasm file failed to load :(" : ""}
              <div className="point-comparison">
                <span>
                  <h4>Original points</h4>
                  <pre>{ JSON.stringify(this.state.points, null, 2) }</pre>
                </span>
                <span>
                  <h4>"Clustered" points</h4>
                  <pre>{ JSON.stringify(this.state.clusters, null, 2) }</pre>
                </span>
              </div>
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Clusterer