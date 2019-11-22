import React from 'react';
import ClusteringStats from "./ClusteringStats";
import { IMapWrapperProps } from "../../util/interfaces";
import RenderIndicator from './RenderIndicator';

import './MapWrapper.scss';

export default function MapWrapper(props: IMapWrapperProps) {
  return (
    <span className="map-and-stats">
      <h3>{props.title}</h3>
      <ClusteringStats {...props.clustererStats} {...props.mapState} comparisonTime={props.comparisonTime}></ClusteringStats>
      { props.showIndicator && <RenderIndicator leftOffset={props.renderIndicatorPercent}/> }
      <div className="gmap">
        {props.children}
      </div>
      <details>
        <summary>Clicked cluster details</summary>
        <pre>{JSON.stringify(props.clickedCluster, null, 2)}</pre>
      </details>
    </span>
  )
}