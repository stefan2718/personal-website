import React from 'react'

class Clusterer extends React.Component {
  clusterer = null;

  componentDidMount() {
    import("@stefan2718/webassembly-marker-clusterer").then(lib => {
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
    // TODO
    return (
      <div>
        <h3>WebAssembly Experiment</h3>
        <button className="button" onClick={() => this.greet('and the Wasm module calls Javascript\'s alert() function')}>This button calls a function in a Wasm module.</button>
      </div>
    )
  }
}

export default Clusterer