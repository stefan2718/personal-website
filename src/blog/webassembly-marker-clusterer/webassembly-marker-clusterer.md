---
path: "/blog/webassembly-marker-clusterer"
publishedDate: "2019-05-29T00:00:00Z"
updatedDate: "2019-05-29T00:00:00Z"
title: "WebAssembly VS JavaScript - A side-by-side comparison at clustering map markers"
description: "How much faster is WebAssembly? By porting the MarkerClustererPlus JS library to Wasm (compiled from Rust) you get a 5-15 times speedup"
draft: false
---

Sometimes you have a solution in search of a problem. WebAssembly has a lot of potential uses, but are any of them reasonable in the average modern web app?

If you're like me, you've heard that WebAssembly is a lot faster than JavaScript, but you haven't seen an apples-to-apples comparison of the two languages performing the same task. Maybe you know of cool Wasm usages like the new [Google Earth](https://earth.google.com), 

TODO: MORE examples

## The Motivation

So what real world app examples can we use Wasm for? Well a while back I was working on real estate website for a client who needed to display a lot of home listings on a map. There were so many markers that they needed to be clustered. We ended up using MarkerClustererPlus (MCP from here on) to do this. At the time, I realized this might be a perfect opportunity to use WebAssembly, for a few reasons:

- Clustering markers is a lot of math (calculating distances between lat/lng coordinates)
- This math could be isolated from DOM manipulations
- The naive MCP clustering algorithm is expensive (polynomial time) TODO Fact check

However, the team didn't have the requisite knowledge, budget or time to implement this, so we stuck with MCP, and I shelved the idea.

In my spare time, I finally developed a library to do this, [wasm-marker-clusterer](https://github.com/stefan2718/wasm-marker-clusterer).

## The Results

Depending on the OS and browser, the Wasm implementation is approximately **5-15 times faster** than the JS version. The precise results also depend on the the input, like the zoom, grid size and particular set of markers in the viewport. Here are examples from a few different cases:

Looking at the graphs, you can notice that the JS results vary widely for the same **x** value, which we can attribute to the JIT interpreted nature of JS compared to Wasm

## When to use Wasm
Wasm isn't going to replace JavaScript for the tasks that JavaScript was invented for: small user interactions, quick DOM manipulations and simple scripts. But it is much better at heavy processing. 

## Lessons learned

### 1. Wasm runs on the main thread.

When I first learned about how Wasm modules are sandboxed, I presumed that meant that they don't run on the main thread. Even after I loaded my module, I thought it was running in another thread, because everything seemed so snappy still. It turns out that was just because Wasm is fast, and was quickly returning results before I could notice any unresponsiveness. It wasn't I accidentally ran the **dev** compiled Wasm module instead of the **prod** compiled one that I noticed the page was unresponsive while waiting for results. I also could profile it with Chrome's "Performance" tab which shows background CPU usage with striped fill-in. TODO image

As it is, Wasm modules need to be loaded in Web Workers in order to run off the main thread. This isn't very difficult though because the sandboxed nature of Wasm modules make them easy to slot into a Web Worker without having to remove DOM manipulation code. TODO: Write article about this

### 2. It's important to consider the Wasm/JS boundary

In an early iteration [(v0.0.4)](https://github.com/stefan2718/wasm-marker-clusterer/blob/v0.0.4/src/lib.rs) of wasm-marker-clusterer, I was passing in _all_ the markers every time I wanted to calculate clusters. It turned out that serializing all the data in took almost 10x more time than clustering it once it was in Wasm. So instead I only serialized the markers once, and stored them on the Wasm side.

Similarly, serializing data back to JS takes time as well. Comparing MCP vs Wasm, I noticed that Wasm performed worse when just panning the map a small amount. Because this didn't require any additional clusters to be calculated, MCP already had the results, but the Wasm version still needed to serialize the existing clusters back to JS, so it was slower. In the next iteration [(v0.0.9)](https://github.com/stefan2718/wasm-marker-clusterer/blob/v0.1.0/js/index.ts) I fixed this by adding a JS wrapper to the Wasm module so it could store the previously calculated clusters on the JS side and only serialize them when they are modified.

### 3. Webpack can't load Wasm synchronously _(yet)_

When I created this library (Oct-Dec 2019), Wasm could not be loaded synchronously using Webpack. This led to some challenges bundling the package in an easily consumable way.

Most developers are used to just running `npm install package` and then `import`ing the package to use wherever they want. From my experience, it's rare for a developer to manually handle a [dynamic, asynchronous import](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Dynamic_Imports) and I don't want to scare library users off, so I want to avoid making a developer have to do that.

Webpack v4 can export libraries to be "universally" consumable using the `output.libraryTarget: 'umd'` option. Libraries exported like this can be used in projects that don't use Webpack (and of course, ones that do). This is laudable because we shouldn't assume all developers use Webpack.

In order to make the package simple to install and use, I wanted to abstract the Wasm modules async load by wrapping it in a regular promise. With this strategy, a developer would bundle a small JS wrapper that is loaded synchronously with that relevant code, and this wrapper would handle loading the Wasm module.

However, Webpack v4 can't do this in a way that other Webpack apps can consume (see [issue #7843](https://github.com/webpack/webpack/issues/7843) and [issue 6818](https://github.com/webpack/webpack/issues/6818)). It also wouldn't allow you to just output one bundle to be loaded async that would include your Wasm module. If you tried, you'd get this error:

> WebAssembly module is included in initial chunk.
> This is not allowed, because WebAssembly download and compilation must happen asynchronous.
> Add an async splitpoint (i. e. import()) somewhere between your entrypoint and the WebAssembly module

Webpack v5 is [supposed to be able to do this.](https://github.com/webpack/webpack/issues/6615#issuecomment-576280946) But it seemed like there was no way to use v4 to bundle my Wasm module for other Webpack apps to use, so I had resigned myself to exporting the code without a bundler (which worked! You don't always need a bundler, see [v0.1.3](https://github.com/stefan2718/wasm-marker-clusterer/tree/v0.1.3))

So it was, until I decided to load the Wasm module inside a Web Worker. Using [GoogleChromeLabs/worker-plugin](https://github.com/GoogleChromeLabs/worker-plugin) did some Webpack magic that made it possible to do exactly what I wanted: abstract the async load of the Wasm module behind a standard promise. This is why `worker-plugin` is a peer dependency of the library. However, if a library user doesn't want to use Webpack, it should still work because the library still loads the Worker using the standard `new Worker("./worker")` constructor, as long as it can find and load the `"./worker"` file.

## Conclusion

Wasm isn't always the solution to web app performance, but if you keep your mind open, you may find that it's the perfect tool to speed up heavy computation on the front end.

## Other articles I will write

- How to easily put your Wasm module in a Web Worker
- How to automate Wasm unit tests with Cypress
- Benchmarking Rust Wasm