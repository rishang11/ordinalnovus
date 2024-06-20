import { IInscription } from "@/types";
import React from "react";
type InscriptionProps = {
  data: IInscription;
};
function DisplayMetadata({ data }: InscriptionProps) {
  return (
    <div className="">
      {!data?.metadata["attributes"] ? (
        <>
          <p className="font-bold text-xl uppercase py-6">Metadata</p>
          {Object.entries(data?.metadata || {}).map(([key, value], idx) => (
            <div
              key={idx}
              className={`flex text-xs w-full justify-between items-center ${
                !key.toLowerCase().startsWith("attribute") && " bg-secondary "
              } py-2 px-4 rounded-xl my-2`}
            >
              {key.toLowerCase().startsWith("attribute") &&
              Array.isArray(value) ? (
                <div className="w-full">
                  <p className="font-bold text-xl uppercase py-6">
                    ATTRIBUTES (ONCHAIN)
                  </p>
                  {value.map((attr, attrIdx) => (
                    <div
                      key={attrIdx}
                      className="text-sm text-white w-full bg-secondary rounded-xl"
                    >
                      {Object.entries(attr).map(([attrKey, attrValue]) => (
                        <p
                          key={attrKey}
                          className={`flex text-xs w-full justify-between items-center py-2 border-b px-4 border-gray-600`}
                        >
                          <span className="font-bold uppercase">
                            {attrKey}:
                          </span>{" "}
                          {JSON.stringify(attrValue)}
                        </p>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                //@ts-ignore
                <>
                  <p className="uppercase">{key}</p>
                  <p className="text-sm text-white">{JSON.stringify(value)}</p>
                </>
              )}
            </div>
          ))}
        </>
      ) : (
        <>
          {!data.attributes && (
            <>
              {" "}
              <p className="font-bold text-xl uppercase py-6">
                Attributes (ONCHAIN)
              </p>
              {data?.metadata?.attributes?.map((item: any, idx: number) => (
                <div
                  key={idx}
                  className="flex text-xs w-full justify-between items-center bg-secondary py-2 px-4 rounded-xl my-2"
                >
                  <p className="uppercase">{item.trait_type}</p>
                  <p className="text-sm text-white">{item.value}</p>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default DisplayMetadata;
