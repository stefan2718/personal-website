---
path: "/blog/webassembly-marker-clusterer"
date: "2019-05-29T00:00:00Z"
title: "WebAssembly VS JavaScript - A comparison of clustering map points."
description: ""
draft: true
tags:
  - test
  - syntax highlighting
---

A work in progress article comparing two implementations of map point clustering <!-- end -->

I'm working towards a side-by-side comparison of the popular [MarkerClusterPlus for Google Maps](https://github.com/googlemaps/v3-utility-library/tree/master/markerclustererplus) library and a [WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) implementation. MarkerClusterPlus clusters map points together when you have too many to display. This can become fairly CPU intensive when you have thousands of map points. I'd like to see what benefits there will be from moving this clustering logic into a WebAssembly module. Hopefully, by running it outside of the main JavaScript event loop, it will take less time, and allow the page to keep rendering without blocking.

[My progress is here](/lab/webassembly-marker-clusterer) 

## Progress notes

The first major roadblock I hit was the fact that it is not straight-forward to pass data across the wasm/JS boundary. At least with wasm-pack, only a limited number of data types can natively be passed across the wasm/JS boundary, including ints and floats of differing lengths, as well as arrays of these types. In this manner, you're basically passing raw bytes back and forth and having wasm and JS interpret them.

For objects and data of arbitrary complexity, you can use Serde to serialize/deserialize from JSON across this boundary.

With this in mind, you have to figure out how to minimize data transfering across this boundary, because it is slow. 


## Fighting the borrow checker

What is the difference between these lines?
```rust
pub fn add_to_closest_cluster(clusters: &mut Vec<Cluster>, new_point: &Point) {}
// An immutable reference to a mutable Vector?
pub fn add_to_closest_cluster(mut clusters: Vec<Cluster>, new_point: &Point) {}
// A mutable reference to an immutable Vector?
```

## Performance

You can start `console.time()` calls in your Javascript and end them in WASM! And vice versa!