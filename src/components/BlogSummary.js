import React from "react"
import { Link } from 'gatsby'

export default function Template(props) {
  return (
    <article style={{marginBottom:'50px'}}>
      <div style={{display:'flex', marginBottom:'10px'}}>
        <span style={{flex:'1 0 auto', fontSize:'130%'}}>
          <Link to={props.path}>{props.title}</Link>
        </span>
        <time dateTime={props.dateISO}>{props.date}</time>
      </div>
      <summary>{props.excerpt}</summary>
    </article>
  )
}