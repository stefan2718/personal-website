import React, { useState, useEffect } from 'react';
import { IMapProps } from "../../util/interfaces";
import MapWrapper from "./MapWrapper";
import MarkerClusterer from "@google/markerclustererplus"
import GoogleMapReact, { ChangeEventValue, Maps } from "google-map-react";
import { ICluster } from "wasm-marker-clusterer";
import { boundsToIBounds } from "../../util/helpers";

const getClusterData = (clusterer: MarkerClusterer, cluster: Cluster, getBounds: boolean = false, sliceTo: number = -1): ICluster => ({
  size: cluster.getSize(),
  center: cluster.getCenter().toJSON(),
  bounds: getBounds ? clusterer.getExtendedBounds(new google.maps.LatLngBounds(cluster.getCenter(), cluster.getCenter())).toJSON() : null,
  // TODO: simplify if too slow? all I need is a count?
  markers: (sliceTo === -1 ? cluster.getMarkers() : cluster.getMarkers().slice(0,sliceTo)).map(m => m.getPosition().toJSON()),
});

export default function McpMap(props: IMapProps) {
  let [clickedCluster, setClickedCluster] = useState<ICluster>();
  let [clusterer, setClusterer] = useState<MarkerClusterer>();
  let [clusters, setClusters] = useState<ICluster[]>([]);

  let [clusterStart, setClusterStart] = useState<number>(0);
  let [clusterEnd, setClusterEnd] = useState<number>(0);
  let [clusterTime, setClusterTime] = useState<number>(0);
  let [worstTime, setWorstTime] = useState<number>(0);
  let [markerCount, setMarkerCount] = useState<number>(0);

  useEffect(() => {
    let listeners: google.maps.MapsEventListener[] = [];
    if (clusterer) {
      listeners.push(
        clusterer.addListener('clusteringbegin', mcpMap => {
          setClusterStart(performance.now());
          setClusterTime(0);
        }),
        clusterer.addListener('clusteringend', (mcpMap: MarkerClusterer) => {
          setClusterEnd(performance.now());
        }),
        clusterer.addListener('click', (cluster: Cluster) => {
          setClickedCluster(getClusterData(clusterer, cluster, true, 10));
        }),
      );
    }
    return () => {
      listeners.forEach(listener => listener.remove());
    };
  }, [clusterer]);

  useEffect(() => {
    if (clusterer) {
      let clusterTime = clusterEnd - clusterStart;
      let markerCount = clusterer.getClusters().reduce((acc, curr) => acc + curr.getSize(), 0);
      setWorstTime(Math.max(clusterTime, worstTime));
      setClusterTime(clusterTime);
      setMarkerCount(markerCount);
      props.setMapTestState({
        clusterTime,
        clusterEnd,
        markerCount,
        clusterCount: clusterer.getTotalClusters()
      });
      setClusters(clusterer.getClusters().map(cluster => getClusterData(clusterer, cluster as any)))
    };
  }, [clusterer, clusterEnd]);

  useEffect(() => {
    if (clusterer) {
      clusterer.setGridSize(props.gridSize);
      clusterer.repaint();
    }
  }, [props.gridSize]);

  const handleMcpMapLoaded = (map: google.maps.Map, maps: Maps) => {
    let markers = props.allMarkers.map(pnt => {
      let marker = new google.maps.Marker({
        position: new google.maps.LatLng(pnt.lat, pnt.lng)
      });
      marker.addListener('click', () => {
        setClickedCluster({
          size: 1,
          center: { lat: pnt.lat, lng: pnt.lng },
          markers: [{ lat: pnt.lat, lng: pnt.lng }]
        });
      });
      return marker;
    });
    setClusterer(new MarkerClusterer(map, markers, { imagePath: "/images/m", zoomOnClick: false, gridSize: props.gridSize }));
  }

  // TODO ? instead of using GoogleMapReact's 'onChanged', hook into gmaps actual events for faster response
  const handleMcpMapChange = ({ center, zoom, bounds, marginBounds, size }: ChangeEventValue) => {
    let newMapState = { center, zoom, bounds: boundsToIBounds(bounds) };
    props.setMapState(newMapState);
    if (props.syncMap) {
      props.setOtherMapState(newMapState);
    }
  }

  return (
    <MapWrapper
      title={"Javascript"}
      link={"https://github.com/googlemaps/v3-utility-library/tree/%40google/markerclustererplus%405.0.3/packages/markerclustererplus"}
      clickedCluster={clickedCluster}
      mapState={props.mapState}
      renderIndicatorPercent={props.renderIndicatorPercent}
      showIndicator={props.showIndicator}
      comparisonTime={props.comparisonTime}
      clustererStats={{
        clusterCount: clusters.length,
        clusterEnd,
        clusterStart,
        clusterTime,
        markerCount,
        worstTime,
      }}>
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
        zoom={props.mapState.zoom}
        center={props.mapState.center}
        onChange={handleMcpMapChange}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }) => handleMcpMapLoaded(map, maps)}
      ></GoogleMapReact>
    </MapWrapper>
  )

}