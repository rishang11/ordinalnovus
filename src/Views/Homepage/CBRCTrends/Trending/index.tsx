import { RootState } from "@/stores";
import { IStats } from "@/types";
import { formatNumber, formatSmallNumber } from "@/utils";
import Link from "next/link";
import React, { useCallback } from "react";
import { FaDollarSign } from "react-icons/fa";
import { useSelector } from "react-redux";

const Trending = ({ data }: { data: IStats }) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  return (
    <div className="py-8 px-6 rounded-lg bg-primary h-full border-transparent hover:border-accent border-[1px] transition-all duration-700">
      <div className="flex items-center pb-4">
        <div>
          <img src="/static-assets/images/trending.png" />
        </div>
        <div>
          <p className="font-semibold text-xl text-white pl-2 ">Trending</p>
        </div>
      </div>
      {data.tokensTrend.map((item, index) => {
        return (
          <div key={index} className=" py-3  flex justify-between items-center">
            <div>
              <div className=" uppercase flex items-center  text-white font-medium">
                <Link shallow href={`/cbrc-20/${item.tick}`}>
                  <div className="flex items-center ">
                    {item.icon ? (
                      <div className=" rounded-full w-7 h-7 border border-white">
                        <img
                          src={item.icon}
                          alt="Icon"
                          className=" object-cover w-full h-full overflow-none rounded-full " // Adjust width and height as needed
                        />
                      </div>
                    ) : (
                      <div className="">
                        <div
                          className="rounded-full w-7 h-7 border border-white flex justify-center items-center bg-accent" // Use your secondary color here
                          style={{ lineHeight: "1.5rem" }} // Adjust line height to match your text size
                        >
                          {item.tick.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    )}
                    <div className="pl-3"> {item.tick}</div>
                    {(() => {
                      const formatted = formatSmallNumber(
                        item.price,
                        btcPrice,
                        "SATS"
                      );
                      return formatted.unit ? ` (${formatted.unit}) ` : "";
                    })()}
                  </div>
                </Link>
              </div>
            </div>
            <div className="">
              {/* {isPositive ? <BiSolidUpArrow /> : <BiSolidDownArrow />} */}
              <p className="pl-2 flex items-center">
                <FaDollarSign className="text-green-500" />
                <span className="pl-1">
                  {formatSmallNumber(item.price, btcPrice, "USD").price}
                </span>
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default Trending;
