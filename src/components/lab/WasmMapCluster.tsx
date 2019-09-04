import React from "react"
import { IWasmCluster } from "../../util/interfaces";

class WasmMapCluster extends React.Component<IWasmCluster & { lat: number, lng: number, onClick: (cluster: IWasmCluster) => void }> {

  getCluster: () => IWasmCluster = () => {
    return { 
      count: this.props.count,
      center_lat: this.props.center_lat,
      center_lng: this.props.center_lng,
      bounds: this.props.bounds,
      uuid: this.props.uuid,
      points: this.props.points.slice(0, 10),
    };
  }

  render() {
    return this.props.count !== 1 ? (
      <div className="wasm-cluster" >
        <img src={'/images/m' + String(this.props.count).length + '.png'} alt=''  
          onClick={this.props.onClick.bind(this, this.getCluster())}/>
        <span onClick={this.props.onClick.bind(this, this.getCluster())}>{this.props.count}</span>
      </div>
    ) : (
      <img className="wasm-marker" src='/images/marker.png' alt='' onClick={this.props.onClick.bind(this, this.getCluster())}/>
    )
  }
}

export default WasmMapCluster;