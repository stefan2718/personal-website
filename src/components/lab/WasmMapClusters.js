import React from "react"

export default function (props) {
  return (
    <div className="wasm-cluster" >
      <img src={'/images/m' + String(props.count).length + '.png'} alt=''/>
      <span>{props.count}</span>
    </div>
  )
}