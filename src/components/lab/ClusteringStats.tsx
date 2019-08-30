import React from "react"
import { IClustererStats } from "../../util/interfaces";

class ClusteringStats extends React.Component<IClustererStats & { comparisonTime: number }> {

  render() {
    let comparison = !this.props.comparisonTime || !this.props.clusterTime ? null : Math.round(this.props.comparisonTime / this.props.clusterTime * 100) / 100;
    let compStyles = !comparison ? {} : {
      color: comparison >= 1 ? 'lightgreen' : 'red'
    };

    return (
      <ul className="stats">
        <li><span>
          <span>Clusters created: </span>
          <span className="stat-value">{this.props.totalClusters}</span>
        </span></li>
        <li><span>
          <span>Speed comparison</span>
          <span className="stat-value" style={compStyles}>{ !!comparison ? `${comparison}x` : '...waiting'}</span>
        </span></li>
        <li><span>
          <span>Clustering time (ms): </span>
          <span className="stat-value">{!!this.props.clusterTime ? this.props.clusterTime : '...waiting'}</span>
        </span></li>
        <li><span>
          <span>Worst time (ms): </span>
          <span className="stat-value">{this.props.worstTime}</span>
        </span></li>
      </ul>
    )
  }
}

export default ClusteringStats;