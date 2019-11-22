import React from "react"
import { Link } from 'gatsby'
import { ILabTile } from "../util/interfaces";

import './LabTile.scss';

export default function (props: ILabTile) {
  return (
    <Link className="lab-tile" to={props.path}>
      <div className="tile-top">
        <h3 className="tile-title">{props.title}</h3>
        <h4>{props.desc}</h4>
      </div>
      <img src={props.image} alt={props.imageAlt}/>
    </Link>
  )
}