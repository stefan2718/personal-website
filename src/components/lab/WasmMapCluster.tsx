import React from "react"
import { ICluster } from "wasm-marker-clusterer";

class WasmMapCluster extends React.Component<ICluster & { lat: number, lng: number, onClick: (cluster: ICluster) => void }> {

  getCluster: () => ICluster = () => {
    return { 
      size: this.props.size,
      center: this.props.center,
      bounds: this.props.bounds,
      uuid: this.props.uuid,
      markers: this.props.markers.slice(0, 10),
    };
  }

  render() {
    return this.props.size !== 1 ? (
      <div className="wasm-cluster" >
        <img src={'/images/m' + String(this.props.size).length + '.png'} alt=''  
          onClick={this.props.onClick.bind(this, this.getCluster())}/>
        <span onClick={this.props.onClick.bind(this, this.getCluster())}>{this.props.size}</span>
      </div>
    ) : (
      <img className="wasm-marker" src='/images/marker.png' alt='' onClick={this.props.onClick.bind(this, this.getCluster())}/>
    )
  }
}

export default WasmMapCluster;