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

You can start `console.time()` calls in your Javascript and end them "in WASM" by using web_sys to call out to `console.timeEnd()`. And vice versa: starting a timer "in" WASM, and ending it from your regular javascript. Neato.

There is some limit happening for how much info can be passed into WASM. With 100,000 points, and clustering into a single point, this is the clustered "point":
```json
[
  {
    "count": 0,
    "center_lat": null,
    "center_lng": null
  },
  {
    "count": 34464,
    "center_lat": 1,
    "center_lng": 2
  }
]
```
Aha! It was because the `count` was a `u16`... 34464 = 100,000 - 2^16

## Premature Porting Problems

Google maps is obviously a very visual page element, and therefore deeply tied into the DOM. A lot of the logic of MCP is reliant on some of the objects and methods of the Maps API. This makes it difficult to draw the line for the WASM/JS boundary. What can we move into WASM and what should stay? Ideally any calculations should be in WASM and what should be returned to JS is just cluster data to be rendered.

When porting an existing library, it's tempting to try to copy it over line by line. This path is futile, however, due to the fundamental differences in the JS and WASM paradigms. For example, MCP frequently calls or extends Google's Maps API and its objects while making it's calculations. We want to avoid frequent calls across the JS/WASM boundary, and thus have to find alternatives to these calls, such as using a custom implementation of `.getProjection()` that can convert between lat/lng and pixels using a Web Mercator projection.

## v0.0.5 webassembly-marker-clusterer

This is the first version that produces multiple clusters instead of a single cluster. At a low zoom (zoomed out to view all or most points), it performs approximately 100x faster than MCP. However, it is still missing a lot of MCPs optimizations, such as ignoring points outside of the displayed map bounds. Therefore when we zoom-in more, the WASM version is much slower, as it is iterating over many more clusters.

## OOM?

```
RangeError: WebAssembly.instantiate(): Out of memory: wasm memory
```

Chrome bug with dev tools open
https://stackoverflow.com/questions/55039923/why-does-chrome-eventually-throw-out-of-memory-wasm-memory-after-repeatedly-r
