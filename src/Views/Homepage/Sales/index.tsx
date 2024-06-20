"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CustomPaginationComponent from "@/components/elements/CustomPagination";

import CustomSearch from "@/components/elements/CustomSearch";

import { FaSearch } from "react-icons/fa";
import { ISale } from "@/types";
import { fetchTxes } from "@/apiHelper/fetchTxes";
import moment from "moment";
import { RootState } from "@/stores";

import { FaBitcoin, FaDollarSign } from "react-icons/fa";
import { formatSmallNumber, shortenString } from "@/utils";
import CustomSelector from "@/components/elements/CustomSelector";
import InscriptionImage from "./InscriptionImage";

const options = [
  { value: "timestamp:-1", label: "Latest Sales" },
  { value: "price:1", label: "Low Price" },
  { value: "inscription_number:1", label: "Low Number" },
];

function Sales() {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page_size, setPage_size] = useState(10);

  const [tick, setTick] = useState("");

  const [sort, setSort] = useState<string>("timestamp:-1");
  const [txs, setTxs] = useState<ISale[] | null>(null);

  const fetchTxData = useCallback(async () => {
    setLoading(true);
    setTxs(null);
    const q = {
      page_size,
      page,
      sort,
    };
    const result = await fetchTxes(q);

    if (result && result.data) {
      setTxs(result.data.sales);
      setTotalCount(result.data.pagination.total);
    }
    setLoading(false);
  }, [sort, page_size, page, tick]);

  useEffect(() => {
    fetchTxData();
  }, [sort, page_size, page]);

  const handleTxClick = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`, "_blank");
  };

  const handleSearchChange = (value: string) => {
    setTick(value);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  const renderPagination = () =>
    txs &&
    txs?.length > 0 && (
      <div className="w-full lg:w-auto center">
        <CustomPaginationComponent
          count={Math.ceil(totalCount / page_size)}
          onChange={handlePageChange}
          page={page}
        />
      </div>
    );

  const currency = useSelector((state: RootState) => state.general.currency);

  return (
    <section className="cbrc-sales w-full">
      <div className="SortSearchPages pb-6 flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSelector
              label="Sort"
              value={sort}
              options={options}
              onChange={setSort}
            />
          </div>
          <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
            <CustomSearch
              placeholder="Ticker"
              value={tick}
              onChange={handleSearchChange}
              icon={FaSearch}
              end={true}
              onIconClick={fetchTxData}
            />
          </div>
        </div>
        {/* {txs && txs?.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )} */}
        {renderPagination()}
      </div>
      {!txs || !txs?.length ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No Recent Sales Found</p>
          )}
        </>
      ) : (
        <div className="pt-3">
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "transparent",
              color: "white",
              border: "3px",
              borderColor: "rgba(145, 2, 240, 0.50)",
            }}
          >
            <Table
              size={"small"}
              sx={{ minWidth: 650 }}
              aria-label="cbrc-20 table"
            >
              <TableHead
                sx={{ bgcolor: "rgba(145, 2, 240, 0.12)", color: "white" }}
              >
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TYPE
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    INSCRIPTION / TOKEN
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    FROM
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TO
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    PRICE (TOTAL)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    PRICE (PER TOKEN)
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    AMOUNT
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: "bold",
                      fontSize: "1rem",
                      color: "#84848a",
                    }}
                  >
                    TIMESTAMP
                  </TableCell>
                </TableRow>
              </TableHead>
              <>
                {txs && txs.length ? (
                  <TableBody sx={{ bgcolor: "", color: "white" }}>
                    {txs?.map((item: ISale) => {
                      const token = item.token;
                      const amount = item.amount;
                      return (
                        <TableRow
                          onClick={() => handleTxClick(item.txid)}
                          key={item.txid}
                          sx={{
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
                              color: "white",
                              textTransform: "uppercase",
                            }}
                          >
                            <div className="font-bold">
                              {" "}
                              <span
                                className={`px-2 py-1 rounded${
                                  item.type === "cbrc"
                                    ? " bg-yellow-500 text-yellow-900"
                                    : " bg-green-500 text-green-900"
                                }`}
                              >
                                {item.official_collections.length
                                  ? item.official_collections[0].name.substring(
                                      0,
                                      20
                                    )
                                  : item.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {item.type === "cbrc" &&
                            item.token &&
                            item.sat_per_token ? (
                              <span className="px-2 py-1 rounded ">
                                {/* <div>
                                    <img
                                      className="w-16 h-16 pixelated"
                                      src={`${
                                        process.env.NEXT_PUBLIC_CDN
                                      }/tokens/${item.token.toLowerCase()}`}
                                      alt={item.token}
                                    />
                                  </div>{" "} */}
                                {token}{" "}
                                {(() => {
                                  const formatted = formatSmallNumber(
                                    item.sat_per_token,
                                    btcPrice,
                                    "SATS"
                                  );
                                  return formatted.unit
                                    ? `(${formatted.unit})`
                                    : "";
                                })()}
                              </span>
                            ) : (
                              <InscriptionImage
                                inscriptionId={item.inscription_ids[0]}
                              />
                            )}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {shortenString(item.from)}
                          </TableCell>{" "}
                          <TableCell sx={{ color: "white" }}>
                            {shortenString(item.to)}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            <div>
                              {currency === "USD" ? (
                                <div className="flex items-center ">
                                  <div className="mr-2 text-green-500">
                                    <FaDollarSign className="" />
                                  </div>
                                  {
                                    formatSmallNumber(
                                      item.price_sat,
                                      btcPrice,
                                      "USD"
                                    ).price
                                  }
                                </div>
                              ) : (
                                <div className="flex items-center pb-1">
                                  <div className="mr-2 text-bitcoin">
                                    <FaBitcoin className="" />
                                  </div>
                                  {
                                    formatSmallNumber(
                                      item.price_sat,
                                      btcPrice,
                                      "BTC"
                                    ).price
                                  }
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {item.sat_per_token && token ? (
                              <div>
                                {currency === "USD" ? (
                                  <div className="flex items-center ">
                                    <div className="mr-2 text-green-500">
                                      <FaDollarSign className="" />
                                    </div>
                                    {
                                      formatSmallNumber(
                                        item.sat_per_token,
                                        btcPrice,
                                        "USD"
                                      ).price
                                    }
                                    {(() => {
                                      const formatted = formatSmallNumber(
                                        item.sat_per_token,
                                        btcPrice,
                                        "SATS"
                                      );
                                      return formatted.unit
                                        ? ` (${formatted.unit} ${token} ) `
                                        : "";
                                    })()}
                                  </div>
                                ) : (
                                  <div className="flex items-center pb-1">
                                    <div className="mr-2 text-bitcoin">
                                      <FaBitcoin className="" />
                                    </div>
                                    {
                                      formatSmallNumber(
                                        item.sat_per_token,
                                        btcPrice,
                                        "SATS"
                                      ).price
                                    }{" "}
                                    SATS
                                    {(() => {
                                      const formatted = formatSmallNumber(
                                        item.sat_per_token,
                                        btcPrice,
                                        "SATS"
                                      );
                                      return formatted.unit
                                        ? ` (${formatted.unit} ${token} ) `
                                        : " /  " + token.toUpperCase();
                                    })()}
                                  </div>
                                )}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {amount}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            <div className="flex justify-start items-center">
                              {moment(item.timestamp).fromNow()}{" "}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                ) : (
                  <TableBody>
                    <TableRow>
                      <TableCell
                        colSpan={4}
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
      )}
      <div className="flex justify-end w-full pt-10">{renderPagination()}</div>
    </section>
  );
}

export default Sales;
