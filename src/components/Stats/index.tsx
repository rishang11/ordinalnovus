import { convertSatToBtc, formatNumber } from "@/utils";
import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import { FaDollarSign, FaBitcoin } from "react-icons/fa6";
import fetchStats from "@/apiHelper/fetchStats";
import { setStats } from "@/stores/reducers/generalReducer";

const Stats = () => {
  const dispatch = useDispatch();
  const currency = useSelector((state: RootState) => state.general.currency);

  const stats = useSelector((state: RootState) => state.general.stats);

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  ); // Retrieve BTC price from Redux store
  const fees = useSelector((state: RootState) => state.general.fees); // Retrieve fees from Redux store

  const fetchStatsFunction = useCallback(async () => {
    const stats = await fetchStats();
    dispatch(setStats(stats));
  }, []);

  useEffect(() => {
    if (!stats) {
      fetchStatsFunction();
      return;
    }

    const TEN_MINUTES = 10 * 60 * 1000; // 10 minutes in milliseconds

    const updatedAt = new Date(stats.updatedAt).getTime();
    const now = new Date().getTime();

    if (now - updatedAt > TEN_MINUTES) {
      fetchStatsFunction();
    }
  }, [stats]);

  return (
    <div className="pb-2">
      {stats ? (
        <div className="hidden lg:flex justify-between border-y border-y-light_gray border-opacity-20 items-center h-[50px]">
          <div className="flex">
            <p className="text-gray">Tokens :</p>
            <p className="pl-2 text-bitcoin">{stats.tokens}</p>
          </div>
          <div className="flex">
            <p className="text-gray">24Hr Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center ">
              {currency === "BTC" ? (
                <>
                  <span className="pr-1">
                    <FaBitcoin className="text-bitcoin " />
                  </span>
                  {convertSatToBtc(stats.dailyVolume).toFixed(3)}
                </>
              ) : (
                <>
                  <span className="pr-1">
                    <FaDollarSign className="text-green-500" />
                  </span>
                  {formatNumber(convertSatToBtc(stats.dailyVolume) * btcPrice)}
                </>
              )}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">30 Days Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center">
              {currency === "BTC" ? (
                <>
                  <span className="pr-1">
                    <FaBitcoin className="text-bitcoin " />
                  </span>
                  {convertSatToBtc(stats.monthlyVolume).toFixed(3)}
                </>
              ) : (
                <>
                  <span className="pr-1">
                    <FaDollarSign className="text-green-500" />
                  </span>
                  {formatNumber(
                    convertSatToBtc(stats.monthlyVolume) * btcPrice
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">All time Vol :</p>
            <p className="pl-2 text-bitcoin flex items-center">
              {currency === "BTC" ? (
                <>
                  <span className="pr-1">
                    <FaBitcoin className="text-bitcoin " />
                  </span>
                  {convertSatToBtc(stats.allTimeVolume).toFixed(3)}
                </>
              ) : (
                <>
                  <span className="pr-1">
                    <FaDollarSign className="text-green-500" />
                  </span>
                  {formatNumber(
                    convertSatToBtc(stats.allTimeVolume) * btcPrice
                  )}
                </>
              )}
            </p>
          </div>
          <div className="flex">
            <p className="text-gray">Fees :</p>
            <p className="pl-2 text-bitcoin">{fees?.fastestFee} sats/vB</p>
          </div>
          <div className="flex">
            <p className="text-gray">BTC :</p>
            <p className="pl-2 text-bitcoin flex items-center">
              <FaDollarSign className="text-green-500" />
              {btcPrice}
            </p>
          </div>
          <div className="flex items-center">
            <p className="text-gray">Latest height : </p>
            <p
              className={`px-2 font-medium text-white rounded-sm py-3 ${
                Math.abs(stats.btcHeight - stats.novusBtcHeight) > 2
                  ? "bg-red-500"
                  : ""
              }`}
            >
              {stats.btcHeight}
            </p>
          </div>
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};

export default Stats;
