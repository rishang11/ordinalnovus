import React from "react";
//@ts-ignore
import { StlViewer } from "react-stl-viewer";
function STL({ url }: { url: string }) {
  // console.log(url, "STL_URL");
  return (
    <div className="h-full center ">
      <StlViewer
        style={{
          top: 0,
          left: 0,
          height: "500px",
          width: "500px",
          // display: "flex",
          // justifyContent: "center",
          // alignItems: "center",
        }}
        orbitControls
        shadows
        url={url}
      />
    </div>
  );
}

export default STL;
