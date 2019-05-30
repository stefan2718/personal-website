import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../../components/HomePageLayout';

class Clusterer extends React.Component {
  clusterer = null;

  componentDidMount() {
    import("@stefan2718/webassembly-marker-clusterer")
      .then(lib => this.clusterer = lib)
      .catch(err => {
        console.err(err);
        // TODO SetState error.
      });
  }

  greet = (str) => {
    this.clusterer.greet(str);
  }

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>WebAssembly Markerer Clusterer</title>
          <meta name="description" content="A side-by-side comparison of the popular MarkerClusterPlus for Google Maps and a WebAssembly port of the same logic." />
        </Helmet>
        <div id="main">
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
              <button className="button" onClick={() => this.greet('and the Wasm module calls Javascript\'s alert() function')}>This button calls a function in a Wasm module.</button>
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Clusterer