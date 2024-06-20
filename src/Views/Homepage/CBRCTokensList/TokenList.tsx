import { ICbrcToken } from "@/types/CBRC";
import { useRouter } from "next/navigation";
import React, { useCallback } from "react";
import { FaArrowDown, FaBitcoin, FaDollarSign } from "react-icons/fa";

import {
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { convertSatToBtc, formatNumber, formatSmallNumber } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { TiArrowSortedUp, TiArrowSortedDown } from "react-icons/ti";

type HeroProps = {
  tokens: ICbrcToken[];
  loading: boolean;
};
function TokenList({ tokens, loading }: HeroProps) {
  const router = useRouter();

  const handleListingClick = (id: string) => {
    router.push(`/cbrc-20/${id}`);
  };

  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const allowed_cbrcs = useSelector(
    (state: RootState) => state.general.allowed_cbrcs
  );

  const currency = useSelector((state: RootState) => state.general.currency);
  return (
    <div className="py-2">
      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "transparent",
          color: "white",
          border: "3px",
          borderColor: "rgba(145, 2, 240, 0.50)",
        }}
      >
        <Table sx={{ minWidth: 650 }} aria-label="cbrc-20 table">
          <TableHead
            sx={{ bgcolor: "rgba(145, 2, 240, 0.12)", color: "white" }}
          >
            <TableRow>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                TICKER
              </TableCell>
              {/* <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                STATUS
              </TableCell> */}
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                PRICE
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                24H %
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                7D %
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                MARKET CAP
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                <div className="flex items-center">
                  NOVUS VOLUME (24h) <FaArrowDown className="ml-2" />
                </div>
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                Volume (24h)
              </TableCell>
              <TableCell
                sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
              >
                SUPPLY
              </TableCell>
            </TableRow>
          </TableHead>
          <>
            {tokens && tokens.length ? (
              <TableBody sx={{ color: "white" }}>
                {tokens?.map((item: ICbrcToken) => {
                  const price = item.price; // in $

                  const volume =
                    ((item?.on_volume || 0) / 100_000_000) * btcPrice;
                  return (
                    <TableRow
                      onClick={() => handleListingClick(item.tick)}
                      key={item.tick}
                      sx={{
                        bgcolor: allowed_cbrcs?.includes(item.checksum)
                          ? ""
                          : "#4d4d4d",
                        "&:last-child td, &:last-child th": {
                          border: "3px",
                          borderColor: "rgba(145, 2, 240, 0.50)",
                        },
                        "&:hover": { bgcolor: "rgba(145, 2, 240, 0.12)" },
                        color: "white",
                        cursor: "pointer",
                      }}
                    >
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "start",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
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
                          <p className="text-left pl-3 font-bold tracking-wide uppercase">
                            {item.tick}{" "}
                            {(() => {
                              const formatted = formatSmallNumber(
                                item.price,
                                btcPrice,
                                "SATS"
                              );
                              return formatted.unit
                                ? ` (${formatted.unit}) `
                                : "";
                            })()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "start",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        <p className="text-start flex items-center">
                          <span className="text-green-500 pr-1 text-md">
                            <FaDollarSign />
                          </span>{" "}
                          {price
                            ? formatSmallNumber(price, btcPrice, "USD").price
                            : " - "}
                        </p>
                      </TableCell>
                      <TableCell sx={{ color: "white", textAlign: "start" }}>
                        {item?._24h_price_change === 0 ? (
                          <> - </>
                        ) : item._24h_price_change > 0 ? (
                          <div className="flex items-center justify-start text-green-400">
                            <TiArrowSortedUp className="mr-2 text-lg" />
                            {`${item._24h_price_change}%`}
                          </div>
                        ) : item._24h_price_change < 0 ? (
                          <div className="flex items-center justify-start text-red-400">
                            <TiArrowSortedDown className="mr-2 text-lg" />
                            {`${item._24h_price_change}%`}
                          </div>
                        ) : (
                          <span style={{ color: "white" }}> - </span>
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          textAlign: "start",
                          color: "white",
                        }}
                      >
                        {item?._7d_price_change ? (
                          item._7d_price_change >= 0 ? (
                            <div className="flex justify-start items-center text-green-400">
                              <TiArrowSortedUp className="mr-2 text-lg" />
                              {`${item._7d_price_change}%`}
                            </div>
                          ) : (
                            <div className="flex justify-start items-center text-red-400">
                              <TiArrowSortedDown className="mr-2 text-lg" />
                              {`${item._7d_price_change}%`}
                            </div>
                          )
                        ) : (
                          <span style={{ color: "white" }}> - </span>
                        )}
                      </TableCell>

                      <TableCell
                        sx={{
                          textAlign: "start",
                          color: "white",
                        }}
                      >
                        <div className="flex items-center">
                          {currency === "USD" ? (
                            <div className="text-green-500 pr-1">
                              {" "}
                              <FaDollarSign />
                            </div>
                          ) : (
                            <div className="text-bitcoin pr-1">
                              {" "}
                              <FaBitcoin />
                            </div>
                          )}
                          <p className="text-start">
                            {item?.price
                              ? currency === "USD"
                                ? ` ${formatNumber(
                                    item.supply *
                                      (item.price / 100_000_000) *
                                      btcPrice
                                  )}`
                                : ` ${formatNumber(
                                    item.supply * (item.price / 100_000_000)
                                  )}`
                              : "-"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "start",
                          color: "white",
                        }}
                      >
                        {" "}
                        {currency === "USD" ? (
                          <p className="text-center flex items-center">
                            <span className="text-md text-green-500 pr-1">
                              <FaDollarSign />
                            </span>
                            {volume
                              ? ` ${formatNumber(Number(volume.toFixed(0)))}`
                              : "-"}
                          </p>
                        ) : (
                          <>
                            <p className="flex items-center pb-2">
                              <span className="text-md text-bitcoin pr-1">
                                <FaBitcoin />
                              </span>
                              {convertSatToBtc(item.on_volume)}
                            </p>
                          </>
                        )}
                      </TableCell>
                      <TableCell
                        component="th"
                        scope="row"
                        sx={{
                          textAlign: "start",
                          color: "white",
                          textTransform: "uppercase",
                        }}
                      >
                        {currency === "USD" ? (
                          <p className="text-left uppercase flex items-center">
                            <span className="text-md text-green-500 pr-1">
                              <FaDollarSign />
                            </span>{" "}
                            {formatNumber(
                              (item.volume / 100_000_000) * btcPrice
                            )}
                          </p>
                        ) : (
                          <p className="flex items-center pb-2">
                            <span className="text-md text-bitcoin pr-1">
                              <FaBitcoin />
                            </span>
                            {convertSatToBtc(item.volume)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell
                        sx={{
                          textAlign: "start",
                          color: "white",
                        }}
                      >
                        <p className="flex items-center">
                          {" "}
                          {formatNumber(item.supply)}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            ) : loading ? (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    style={{ textAlign: "center", color: "white" }}
                  >
                    <CircularProgress color="inherit" size={40} />
                  </TableCell>
                </TableRow>
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell
                    colSpan={8}
                    style={{ textAlign: "center", color: "white" }}
                  >
                    No DATA Found
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </>
        </Table>
      </TableContainer>
    </div>
  );
}

export default TokenList;
