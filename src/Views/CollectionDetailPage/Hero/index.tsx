"use client";
import { ICollection } from "@/types";
import React, { useCallback } from "react";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaBitcoin, FaDiscord, FaDollarSign, FaGlobe } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";
import mixpanel from "mixpanel-browser";
import { formatNumber } from "@/utils";
import { useMediaQuery } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
type HeroProps = {
  data: ICollection;
};
function Hero({ data }: HeroProps) {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const currency = useSelector((state: RootState) => state.general.currency);
  // creating an object for required data in row-col section
  const rowData = Object.assign(
    {},
    data.supply ? { Supply: formatNumber(data.supply) } : {},
    // data?.royalty_bp && data?.royalty_bp > 0
    //   ? { Royalty: `${(data.royalty_bp / 100).toFixed(2)} %` }
    //   : {},
    data?.max && data.max > 0 ? { Max: data.max } : {},

    data?.min && !isNaN(data?.min) ? { Min: data.min } : {},
    data.fp
      ? {
          Price:
            currency === "USD" ? (
              <div className="center">
                <div className="text-green-500 pr-1">
                  <FaDollarSign />
                </div>
                {formatNumber((data?.fp / 100_000_000) * btcPrice)}
              </div>
            ) : (
              <div className="center">
                <div className="text-bitcoin pr-1">
                  <FaBitcoin />
                </div>
                {formatNumber(data?.fp / 100_000_000)}
              </div>
            ),
        }
      : {},
    data.fp && data.supply
      ? {
          "Market Cap":
            currency === "USD" ? (
              <div className="center">
                <div className="text-green-500 pr-1">
                  <FaDollarSign />
                </div>
                {formatNumber(
                  (data?.fp / 100_000_000) * btcPrice * data.supply
                )}
              </div>
            ) : (
              <div className="center">
                <div className="text-bitcoin pr-1">
                  <FaBitcoin />
                </div>
                {formatNumber((data?.fp / 100_000_000) * data.supply)}
              </div>
            ),
        }
      : {},
    data?.listed !== undefined && data.listed > 0
      ? { Listed: data.listed }
      : {},

    data?.volume
      ? {
          Volume:
            currency === "USD" ? (
              <div className="center">
                <div className="text-green-500 pr-1">
                  <FaDollarSign />
                </div>
                <div className="flex gap-2 items-center">
                  {formatNumber(Number((data.volume / 100_000_000) * btcPrice))}
                </div>
              </div>
            ) : (
              <div className="center">
                <div className="text-bitcoin pr-1">
                  <FaBitcoin />
                </div>
                <div className="flex gap-2 items-center">
                  {formatNumber(Number(data.volume / 100_000_000))}
                </div>
              </div>
            ),
        }
      : {}
    // data?.in_mempool && data.in_mempool > 0 ? { Pending: data.in_mempool } : {}
  );

  function handleSocialClick(platform: string, url: string) {
    mixpanel.track("Social Media Click", {
      referrer: document.referrer,
      platform: platform,
      url,
      collection: data.name, // Additional properties
    });
  }

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

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#9102F080] bg-secondary p-4 md:p-[30px] mt-7 mb-12">
      <div className="md:flex justify-between items-start h-full w-full">
        <div className="w-[270px] center m-auto md:mr-7 pb-[30px] md:pb-0">
          <div className="bg-gray-700 overflow-hidden rounded-lg text-secondary center h-[270px] uppercase text-3xl font-bold w-[270px] m-auto md:mr-auto">
            {data?.inscription_icon?.inscription_id ? (
              <div className="bg-gray-700 rounded-lg text-secondary center h-[270px] uppercase text-3xl font-bold w-[270px] md:mr-auto">
                <CardContent
                  inscriptionId={data.inscription_icon.inscription_id}
                  content_type={data.inscription_icon.content_type}
                  inscription={data.inscription_icon}
                />
              </div>
            ) : (
              <div className="bg-gray-700 rounded-lg text-secondary center h-[270px] uppercase text-3xl font-bold w-[270px] md:mr-auto">
                <img src={data?.icon ?? "/logo_default.png"} />
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 w-full h-full min-h-[270px]">
          <div className="detailPanel w-full">
            <div className="flex justify-between mb-5">
              <h1 className="text-white text-xl md:text-3xl font-bold uppercase flex items-start">
                {data.name}
                {data.verified && (
                  <AiFillCheckCircle className="ml-2 text-yellow-500" />
                )}
              </h1>
              {data?.tags && data.tags.length > 0 && (
                <div className="tags flex items-center justify-start text-xs gap-[15px]">
                  {data?.tags?.map((item, idx) => {
                    if (idx < 2 && !item.includes(";"))
                      return (
                        <span key={item}>
                          <span className="bg-bitcoin text-xs font-bold px-[10px] py-[4px] rounded text-[#513500] uppercase ">
                            {item}
                          </span>
                        </span>
                      );
                  })}
                </div>
              )}
            </div>
            <p className="text-light_gray text-sm">{data?.description}</p>
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
              {data.twitter_link && (
                <a
                  href={data.twitter_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  onClick={() =>
                    handleSocialClick("x", data.twitter_link || "")
                  }
                >
                  <FaXTwitter size={24} color="white" />
                </a>
              )}
              {data.discord_link && (
                <a
                  href={data.discord_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  onClick={() =>
                    handleSocialClick("discord", data.discord_link || "")
                  }
                >
                  <FaDiscord size={24} color="white" />
                </a>
              )}
              {data.website_link && (
                <a
                  href={data.website_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#ffffff1a] aspect-square center relative py-[9px] px-[7px] overflow-hidden accent_transition z-[2] rounded"
                  data-platform="Website"
                  onClick={() =>
                    handleSocialClick("website", data.website_link || "")
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
