/* global google */
import React from 'react';
import Helmet from 'react-helmet';
import HomePageLayout from '../../components/HomePageLayout';
import pointData from '../../assets/json/points.json';
import GoogleMapReact from 'google-map-react';
import MarkerClusterer from '../../assets/markerclusterer';

class Clusterer extends React.Component {
  clusterer = null;
  markerClusterer = null;
  torontoPoints = null;

  constructor() {
    super();

    this.state = {
      loadWasmFailure: false,
      loadDataFailure: false,
      numberOfPoints: 1,
      points: [{lat: 1, lng: 2, price: 3}],
      clusters: [],
    };
  }

  componentDidMount() {
    import("@stefan2718/webassembly-marker-clusterer")
      .then(lib => this.clusterer = lib)
      .catch(err => {
        console.error(err);
        this.setState({ loadWasmFailure: true });
      });
    this.torontoPoints = pointData.map(pointStr => {
      let pointObj = pointStr.split(";");
      return { lat: Number(pointObj[0]), lng: Number(pointObj[1]), price: Number(pointObj[2]) };
    });
    // this.setState({})
  }

  clusterPoints = () => {
    console.time("into-wasm");
    let a = this.clusterer.parse_and_cluster_points(this.torontoPoints);
    console.timeEnd("out-of-wasm");
    this.setState({ clusters: a });
  }

  changeNumberOfPoints = (event) => {
    // console.log(this.torontoPoints);
    let size = 0;
    if (event.target.value > 0) {
      size = event.target.value; 
    }
    this.setState({
      numberOfPoints: size,
      points: Array(Number(size)).fill({ lat: 1, lng: 2, price: 3 }),
    });
  }

  handleApiLoaded = (map, maps) => {
    let markers = this.torontoPoints.map(pnt => new google.maps.Marker({
      position: new google.maps.LatLng(pnt.lat, pnt.lng)
    }));
    this.markerClusterer = new MarkerClusterer(map, markers);
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
                  <div className="gmap">
                    <GoogleMapReact 
                      bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
                      defaultCenter={{ lat: 43.6532, lng: -79.3832 }}
                      defaultZoom={8}
                      yesIWantToUseGoogleMapApiInternals
                      onGoogleApiLoaded={({ map, maps }) => this.handleApiLoaded(map, maps)}
                    ></GoogleMapReact>
                  </div>
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