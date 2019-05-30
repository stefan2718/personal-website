import React from "react"
import { Link } from 'gatsby'

export default function (props) {
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