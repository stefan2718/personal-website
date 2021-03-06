import React, { useState, useEffect } from 'react';
import GoogleMapReact, { Maps, ChangeEventValue } from "google-map-react";
import WasmMapCluster from "./WasmMapCluster";
import { IMapProps, IClustererStats } from "../../util/interfaces";
import MapWrapper from "./MapWrapper";
import { ICluster, WasmMarkerClusterer } from "wasm-marker-clusterer";
import { iBoundsToBounds, boundsToIBounds } from "../../util/helpers";
import { INITIAL_STATS } from "../../util/constants";

export default function WasmMap(props: IMapProps) {
  let [clickedCluster, setClickedCluster] = useState<ICluster>();
  let [clusterer, setClusterer] = useState<WasmMarkerClusterer>();
  let [clusters, setClusters] = useState<ICluster[]>([]);
  let [stats, setStats] = useState<IClustererStats>(INITIAL_STATS);
  let [map, setMap] = useState<google.maps.Map>();
  let [loadWasmFailure, setLoadWasmFailure] = useState<boolean>(false);

  useEffect(() => {
    let clusterer = new WasmMarkerClusterer();
    clusterer.configure({
        logTime: true,
        onlyReturnModifiedClusters: true,
        gridSize: props.gridSize,
      })
      .then(() => setClusterer(clusterer))
      .catch(err => {
        console.error(err);
        setLoadWasmFailure(true);
      });
  }, []);

  useEffect(() => {
    if (clusterer) {
      clusterer.addMarkers(props.allMarkers)
        .then(() => updateWasmMap(map));
    }
    return () => clusterer && clusterer.clear();
  }, [clusterer]);

  useEffect(() => {
    if (clusterer) {
      clusterer.configure({ gridSize: props.gridSize })
        .then(() => updateWasmMap(map));
    }
  }, [props.gridSize]);

  const handleWasmMapLoaded = (map: google.maps.Map, maps: Maps) => {
    setMap(map);
    updateWasmMap(map);
  }

  const updateWasmMap = (map: google.maps.Map) => {
    if (map) {
      handleWasmMapChange({
        center: { lat: map.getCenter().lat(), lng: map.getCenter().lng() },
        zoom: map.getZoom(),
        bounds: iBoundsToBounds(map.getBounds().toJSON())
      });
    }
  }

  const handleWasmMapChange = async ({ center, zoom, bounds, marginBounds, size }: Partial<ChangeEventValue>) => {
    if (!clusterer || !bounds || !zoom) return;

    let clusterStart = performance.now();
    setStats({ ...stats, clusterStart, clusterTime: 0 });

    let wasmClusters = await clusterer.clusterMarkersInBounds(boundsToIBounds(bounds), zoom);

    let clusterEnd = performance.now();
    let clusterTime = clusterEnd - clusterStart;
    let worstTime = Math.max(clusterTime, stats.worstTime);
    let newMapState = { center, zoom, bounds: boundsToIBounds(bounds) };
    let markerCount = wasmClusters.reduce((acc, curr) => acc + curr.markers.length, 0);

    setStats({
      ...stats,
      worstTime,
      clusterTime,
      clusterEnd,
      markerCount,
      clusterCount: wasmClusters.length
    });
    setClusters(wasmClusters);
    props.setMapState(newMapState);
    props.setMapTestState({
      clusterTime, markerCount, clusterEnd,
      clusterCount: wasmClusters.length
    });

    if (props.syncMap) {
      props.setOtherMapState(newMapState);
    }
  }

  return (
    <MapWrapper
      title={"Wasm"}
      link={"https://github.com/stefan2718/wasm-marker-clusterer"}
      clickedCluster={clickedCluster}
      clustererStats={stats}
      mapState={props.mapState}
      renderIndicatorPercent={props.renderIndicatorPercent}
      showIndicator={props.showIndicator}
      comparisonTime={props.comparisonTime}>
      { !!loadWasmFailure && (<span className="error">Wasm file failed to load :(</span>)}
      <GoogleMapReact
        bootstrapURLKeys={{ key: process.env.GMAP_API_KEY }}
        zoom={props.mapState.zoom}
        center={props.mapState.center}
        onChange={handleWasmMapChange}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={({ map, maps }) => handleWasmMapLoaded(map, maps)}
      >
        {clusters.map(c =>
          <WasmMapCluster
            onClick={setClickedCluster}
            {...c}
            key={c.uuid}
            lat={c.center.lat}
            lng={c.center.lng}
          ></WasmMapCluster>
        )}
      </GoogleMapReact>
    </MapWrapper>
  )
}