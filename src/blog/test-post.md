---
path: "/blog/webassembly-marker-clusterer"
date: "2019-05-29T00:00:00Z"
title: "WebAssembly VS JavaScript - A comparison of clustering map points."
description: ""
tags:
  - test
  - syntax highlighting
---

A work in progress article comparing two implementations of map point clustering <!-- end -->

I'm working towards a side-by-side comparison of the popular [MarkerClusterPlus for Google Maps](https://github.com/googlemaps/v3-utility-library/tree/master/markerclustererplus) library and a [WebAssembly](https://developer.mozilla.org/en-US/docs/WebAssembly) implementation. MarkerClusterPlus clusters map points together when you have too many to display. This can become fairly CPU intensive when you have thousands of map points. I'd like to see what benefits there will be from moving this clustering logic into a WebAssembly module. Hopefully, by running it outside of the main JavaScript event loop, it will take less time, and allow the page to keep rendering without blocking.

[My progress is here](/lab/webassembly-marker-clusterer) 