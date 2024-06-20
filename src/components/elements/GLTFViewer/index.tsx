//@ts-nocheck

"use client";
import "@google/model-viewer";
import React from "react";
function GLTF({ url }: { url: string }) {
  // console.log({ url });
  return (
    <div className=" h-full center">
      <model-viewer
        ar
        className="w-full h-full"
        // camera-orbit="calc(-1.5rad + env(window-scroll-y) * 4rad) calc(0deg + env(window-scroll-y) * 180deg) calc(4m - env(window-scroll-y) * 10m)"
        camera-controls={true}
        src={url}
        auto-rotate={true}
        touchAction="pan-y"
      ></model-viewer>
    </div>
  );
}

export default GLTF;
