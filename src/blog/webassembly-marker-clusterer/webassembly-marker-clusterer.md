---
path: "/blog/webassembly-marker-clusterer"
date: "2019-05-29T00:00:00Z"
title: "WebAssembly VS JavaScript - A side-by-side comparison at clustering map markers"
description: "How much faster is WebAssembly? By porting the MarkerClustererPlus JS library to Wasm (compiled from Rust) you get a 5-15 times speedup"
draft: false
---

Sometimes you have a solution in search of a problem. WebAssembly has a lot of potential uses, but are any of them reasonable in the average modern web app?

If you're like me, you've heard that WebAssembly is a lot faster than JavaScript, but you haven't seen an apples-to-apples comparison of the two languages performing the same task. Maybe you know of cool Wasm usages like the new [Google Earth](https://earth.google.com), TODO: MORE examples

## The Motivation

So what real world app examples can we use Wasm for? Well a while back I was working on real estate website for a client who needed to display a lot of home listings on a map. There were so many points that they needed to be clustered. We ended up using MarkerClustererPlus (MCP from here on) to do this. At the time, I realized this might be a perfect opportunity to use WebAssembly, for a few reasons:

- Clustering markers is a lot of math (calculating distances between lat/lng coordinates)
- This math could be isolated from DOM manipulations
- The naive MCP clustering algorithm is expensive (polynomial time) TODO Fact check

However, the team didn't have the requisite knowledge, budget or time to implement this, so we stuck with MCP, and I shelved the idea.

In my spare time, I finally developed a library to do this, [wasm-marker-clusterer](https://github.com/stefan2718/wasm-marker-clusterer).

## The Results

Depending on the OS and browser, the Wasm implementation is approximately 5-15 times faster than the JS version. The precise results also depend on the the input, like the zoom, grid size and particular set of markers in the viewport. Here are examples from a few different cases:

Looking at the graphs, you can notice that the JS results vary widely for the same **x** value, which we can attribute to the JIT interpreted nature of JS compared to Wasm

## When to use Wasm
Wasm isn't going to replace JavaScript for the tasks that JavaScript was invented for: small user interactions, quick DOM manipulations and simple scripts. But it is much better at heavy processing. 

## Lessons learned

1. Wasm runs on the main thread 
1. Important to consider the Wasm/JS boundary
1. Wasm must be loaded async


## Other articles I will write

- How to easily put your Wasm module in a Web Worker
- How to automate Wasm unit tests with Cypress
- Benchmarking Rust Wasm