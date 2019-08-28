import React from 'react'
import wasmImg from '../assets/images/marker-clusterer-plus-example.png';
import LabTile from './LabTile';

const labTiles = [
  {
    title: 'WebAssembly Map Point Clustering',
    desc: 'A comparison of WebAssembly Vs JavaScript for clustering points on a map.',
    path: '/lab/webassembly-marker-clusterer',
    image: wasmImg,
    imageAlt: 'Example map with clustered points using Marker Clusterer Plus'
  }
];

export default function () {
  return (
    <React.Fragment>
      {labTiles.map(tile => (
        <LabTile key={tile.path} title={tile.title} image={tile.image} desc={tile.desc} path={tile.path} imageAlt={tile.imageAlt}></LabTile>
      ))}
    </React.Fragment>
  );
}