"use client";
import React, { useCallback } from "react";
import { ICbrcToken } from "@/types/CBRC";
import { formatNumber, formatSmallNumber } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { FaDiscord, FaDollarSign, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import mixpanel from "mixpanel-browser";
import { useMediaQuery } from "@mui/material";
type HeroProps = {
  data: ICbrcToken;
};
function Hero({ data }: HeroProps) {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  // creating an object for required data in row-col section
  const rowData = Object.assign(
    {},
    data.supply ? { Supply: formatNumber(data.supply) } : {},
    data.price
      ? {
          "Market Cap": (
            <div className="center">
              <div className="text-green-500 pr-1">
                <FaDollarSign />
              </div>
              {formatNumber(
                (data?.price / 100_000_000) * btcPrice * data.supply
              )}
            </div>
          ),
        }
      : { "Market Cap": 0 },
    data.listed ? { Listed: data.listed } : {},
    data.checksum ? { Checksum: data.checksum } : {},
    data.volume
      ? {
          Volume: (
            <div className="center">
              <div className="text-green-500 pr-1">
                <FaDollarSign />
              </div>
              <div className="flex gap-2 items-center">
                {formatNumber(
                  Number(((data.volume / 100_000_000) * btcPrice)?.toFixed(3))
                )}
                <div className="hidden md:block">
                  [&nbsp;
                  {formatNumber(
                    Number((data.volume / 100_000_000)?.toFixed(3))
                  )}{" "}
                  <span className="text-bitcoin">BTC</span>
                  &nbsp;]
                </div>
              </div>
            </div>
          ),
        }
      : {}
  );

  const isMediumScreen = useMediaQuery(
    "(min-width:768px) and (max-width:1023px)"
  );
  const isLargerScreen = useMediaQuery("(min-width:1024px)");

  // function for generating number of cols in each row based on different screen size
  const genNumberOfCol = useCallback(() => {
    if (isMediumScreen) return 3;
    if (isLargerScreen) return 0;
    return 2;
  }, [isMediumScreen, isLargerScreen]);

  // function for checking condition whether to show separator or not
  const numberOfColConditionals = useCallback(
    (position: number) => {
      const isLastElement = position === Object.keys(rowData).length;
      const dividerNum = genNumberOfCol();
      if (position % dividerNum === 0 || isLastElement) return false;
      else return true;
    },
    [isMediumScreen, isLargerScreen]
  );

  function handleSocialClick(platform: string, url: string) {
    mixpanel.track("Social Media Click", {
      referrer: document.referrer,
      platform: platform,
      url,
      cbrcToken: data.tick,
    });
  }
  return (
    <div className="relative rounded-xl overflow-hidden border border-[#9102F080] bg-secondary p-4 md:p-[30px] mt-7 ">
      <div className="md:flex justify-between items-start h-full w-full">
        <div className="w-[270px] center m-auto md:mr-7 pb-[30px] md:pb-0">
          <div className="bg-gray-700 overflow-hidden rounded-lg text-secondary center h-[270px] uppercase text-3xl font-bold w-[270px] m-auto md:mr-auto">
            {data.icon ? (
              <img
                src={data.icon}
                className="w-100 h-100"
                alt="cbrc token icon"
              />
            ) : (
              <div>{data.tick}</div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full h-full min-h-[270px]">
          <div className="detailPanel w-full">
            <h1 className="text-white mb-5 text-xl md:text-3xl font-bold uppercase flex flex-col md:flex-row gap-3 text-center md:text-left">
              {data.tick}
              {(() => {
                const formatted = formatSmallNumber(
                  data.price,
                  btcPrice,
                  "SATS"
                );
                return formatted.unit ? ` (${formatted.unit}) ` : "";
              })()}
              <div className="center md:border-l border-[#2B2337] md:pl-3 text-bitcoin">
                <div className="text-green-500 pr-1">
                  <FaDollarSign />
                </div>
                {formatSmallNumber(data?.price, btcPrice, "USD").price}
              </div>
            </h1>

            <p className="text-light_gray text-sm text-justify md:text-left">
              {data.description ||
                `${
                  data.tick
                } is a CBRC-20 Token on BTC Blockchain with a supply of ${formatNumber(
                  data.max
                )}`}
            </p>
          </div>

          <div className="flex flex-wrap gap-y-5">
            {Object.keys(rowData).map((dataKey, index) => (
              <div
                className="w-1/2 md:w-1/3 lg:w-[14.3%] min-w-fit px-3.5 relative flex items-center justify-center text-center"
                key={index}
              >
                <div className="w-full">
                  <div className=" text-dark_gray">{dataKey}</div>
                  <div className="text-white font-bold">{rowData[dataKey]}</div>
                </div>
                {numberOfColConditionals(index + 1) && (
                  <div
                    className="absolute top-0 bottom-0 right-0 left-auto bg-[#2B2337]"
                    style={{ width: "1px" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mt-auto">
            {data.in_mempool !== undefined && data.in_mempool > 0 && (
              <div className="flex items-center order-2 sm:order-1 m-auto sm:m-0">
                <span>
                  {data.in_mempool} Inscription
                  {data.in_mempool > 1 ? "s" : null} in mempool
                </span>
                <img
                  className="w-[34px] h-[34px] ml-2"
                  src="/static-assets/images/pending.gif"
                />
              </div>
            )}

            <ul className="flex items-center text-2xl gap-[15px] order-1 sm:order-2 m-auto sm:m-0 sm:ml-auto">
              {data.x_url && (
                <a
                  href={data.x_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  onClick={() => handleSocialClick("x", data.x_url || "")}
                >
                  <FaXTwitter size={24} color="white" />
                </a>
              )}
              {data.discord_url && (
                <a
                  href={data.discord_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  onClick={() =>
                    handleSocialClick("discord", data.discord_url || "")
                  }
                >
                  <FaDiscord size={24} color="white" />
                </a>
              )}
              {data.website_url && (
                <a
                  href={data.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  data-platform="Website"
                  onClick={() =>
                    handleSocialClick("website", data.website_url || "")
                  }
                >
                  <FaGlobe size={24} color="white" />
                </a>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Hero;
