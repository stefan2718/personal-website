import React from "react"
import { Link } from 'gatsby'
import { IBlogSummary } from "../util/interfaces";

export default function Template(props: IBlogSummary) {
  return (
    <article style={{marginBottom:'50px'}}>
      <div style={{display:'flex', justifyContent: 'space-between', marginBottom:'10px'}}>
        <span style={{flex:'1 1 auto', fontSize:'130%'}}>
          <Link to={props.path}>{props.title}</Link>
        </span>
        <time style={{ flex:'0 0 auto', marginLeft: '1em' }} dateTime={props.dateISO}>{props.date}</time>
      </div>
      <summary>{props.excerpt}</summary>
    </article>
  )
}