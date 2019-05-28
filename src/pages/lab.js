import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../components/HomePageLayout'

const js = import("@stefan2718/webassembly-marker-clusterer");

class Lab extends React.Component {
  clusterer = null;

  componentDidMount() {
    js.then(lib => {
      this.clusterer = lib;
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
    const siteTitle = "Stefan Battiston"
    const siteDescription = "Site description"

    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>{siteTitle}</title>
          <meta name="description" content={siteDescription} />
        </Helmet>
        <div id="main">
          <h1>The Lab</h1>
          <main>
            <h3>WebAssembly Experiment</h3>
            <button className="button" onClick={() => this.greet('and the Wasm module calls Javascript\'s alert() function')}>This button calls a function in a Wasm module.</button>
          </main>
        </div>
      </HomePageLayout>
    )
  }
}

export default Lab