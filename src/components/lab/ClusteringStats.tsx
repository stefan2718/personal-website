import React from "react"
import { IClustererStats, IMapState } from "../../util/interfaces";

import './ClusteringStats.scss';

const COORD_ROUND = 10000000;

class ClusteringStats extends React.PureComponent<IClustererStats & { comparisonTime: number } & IMapState> {

  render() {
    let comparison = !this.props.comparisonTime || !this.props.clusterTime ? null : Math.round(this.props.comparisonTime / this.props.clusterTime * 100) / 100;
    let compStyles = !comparison ? {} : {
      color: comparison >= 1 ? 'lightgreen' : 'red'
    };

    return (
      <React.Fragment>
        <ul className="stats">
          <li><span>
            <span>Speed comparison</span>
            <span className="stat-value" style={compStyles}>{ !!comparison ? `${comparison}x` : '...waiting'}</span>
          </span></li>
          <li><span>
            <span>Clustering time (ms): </span>
            <span className="stat-value">{!!this.props.clusterTime ? Math.round(this.props.clusterTime) : '...waiting'}</span>
          </span></li>
          <li><span>
            <span>Worst time (ms): </span>
            <span className="stat-value">{Math.round(this.props.worstTime)}</span>
          </span></li>
        </ul>
        <details className="stats">
          <summary>Map state</summary>
          <ul>
            <li><span>
              <span>Clusters created: </span>
              <span className="stat-value">{this.props.clusterCount}</span>
            </span></li>
            <li><span>
              <span>Markers clustered: </span>
              <span className="stat-value">{this.props.markerCount}</span>
            </span></li>
            <li><span>
              <span>Zoom: </span>
              <span className="stat-value">{this.props.zoom} </span>
            </span></li>
            <li><span>
              <span>Center lat: </span>
              <span className="stat-value">{Math.round(this.props.center.lat * COORD_ROUND) / COORD_ROUND}</span>
            </span></li>
            <li><span>
              <span>Center lng: </span>
              <span className="stat-value">{Math.round(this.props.center.lng * COORD_ROUND) / COORD_ROUND}</span>
            </span></li>
          </ul>
        </details>
      </React.Fragment>
    )
  }
}

export default ClusteringStats;