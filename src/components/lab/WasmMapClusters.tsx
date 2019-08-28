import React from "react"
import { IWasmCluster } from "../../util/interfaces";

export default function (props: Partial<IWasmCluster> & { lat: number, lng: number }) {
  return (
    <div className="wasm-cluster" >
      <img src={'/images/m' + String(props.count).length + '.png'} alt=''/>
      <span>{props.count}</span>
    </div>
  )
}