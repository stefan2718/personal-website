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

** [My progress is here](/lab/webassembly-marker-clusterer) **

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

This is the first version that produces multiple clusters instead of a single cluster. At a low zoom (zoomed out to view all or most points), it performs approximately 30x-100x faster than MCP. However, it is still missing a lot of MCPs optimizations, such as ignoring points outside of the displayed map bounds. Therefore when we zoom-in more, the WASM version is much slower, as it is iterating over many more clusters.

## OOM?

```
RangeError: WebAssembly.instantiate(): Out of memory: wasm memory
```

Looks like a Chrome bug with dev tools open
https://stackoverflow.com/questions/55039923/why-does-chrome-eventually-throw-out-of-memory-wasm-memory-after-repeatedly-r

## Cluster state and clustering idempotency

When you pan the map around at a consistent zoom level, MCP maintains the calculated state of existing clusters. This means when you partially move the map, markers that should now be visible will either be added to existing clusters, or trigger the creation of a new cluster. This creates a better user experience by preventing existing clusters from disappearing during panning, but it has the side effect of preventing the clustering process from being idempotent. For example, picture 3 nearby coordinates, A, B, and C. If you create initial clusters at A, then pan to B, you will end up with different resulting clusters than if you create intial clusters at C, then pan to B.

HELPFUL EXPLANATORY IMAGE??

## v0.0.6 webassembly-marker-clusterer

The difference in clusters between MCP and v0.0.5 was due to the v0.0.5 averaging the center of a cluster as points are added to it, which is non-default behaviour for MCP. Before I realized this, I had thought that the difference may have been caused by the difference between Google's `getProjection()` function and the custom implementation available in the `googleprojection` [cargo package](https://crates.io/crates/googleprojection). This package is an implementation of a Web Mercator project that may have matched Google's functionality when it was written 3 years ago, but now has minor variance (0.1% difference at high zooms, much less at lower zooms), likely due to the major updates to Google Maps in 2018, when it began showing a spherical globe. 

## v0.0.7 webassembly-marker-clusterer

Maintaining state of previous clusters definitely slows the WASM clustering down a bit. Previously the runtime would be O(n), where n is the number of markers. After maintaining state, it's now O(n^2), because we have to check the marker-to-be-clustered against the already-clustered markers to see if it's already been added.

## v0.0.8 webassembly-marker-clusterer

Scratch that, the small projection errors were due [to rounding in the googleprojection-rs library](https://github.com/Mange/googleprojection-rs/issues/4). Removing the rounding gives bounds and clusters that are identical to MCP.

With this release, the WASM clusterer presents virtually identical clusters, at a fraction of the compute time.