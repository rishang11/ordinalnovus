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

import { ISale } from "@/types";
import { fetchTxes } from "@/apiHelper/fetchTxes";
import moment from "moment";
import { RootState } from "@/stores";

import { FaBitcoin, FaDollarSign } from "react-icons/fa";
import { formatNumber, formatSmallNumber, shortenString } from "@/utils";
import CustomSelector from "@/components/elements/CustomSelector";

const options = [
  { value: "timestamp:-1", label: "Latest Sales" },
  { value: "price:1", label: "Low Price" },
  { value: "inscription_number:1", label: "Low Number" },
];

function CBRCSales({ tick }: { tick: string }) {
  const currency = useSelector((state: RootState) => state.general.currency);
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page_size, setPage_size] = useState(10);

  const [sort, setSort] = useState<string>("timestamp:-1");
  const [txs, setTxs] = useState<ISale[] | null>(null);

  const fetchTxData = useCallback(async () => {
    setLoading(true);
    setTxs(null);
    const q = {
      parsed: true,
      sort,
      page_size,
      page,
      tag: "sale",
      marketplace: "ordinalnovus",
      ...(tick ? { tick } : { metaprotocol: "transfer" }),
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

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };

  return (
    <section className="pt-6 w-full">
      <div className="SortSearchPages flex flex-wrap justify-between">
        <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
          <div className="w-full center pb-4 lg:pb-0 lg:w-auto">
            <CustomSelector
              label="Sort"
              value={sort}
              options={options}
              onChange={setSort}
            />
          </div>
        </div>
        {txs && txs?.length > 0 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(totalCount / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
      </div>
      {!txs || !txs?.length ? (
        <>
          {loading ? (
            <div className="text-white center py-16">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <p className="min-h-[20vh] center"> No CBRC Sales Found</p>
          )}
        </>
      ) : (
        <div className="pt-3">
          <TableContainer
            component={Paper}
            sx={{
              bgcolor: "#3d0263",
              color: "white",
              border: "3px",
              borderColor: "#3d0263",
            }}
          >
            <Table sx={{ minWidth: 650 }} aria-label="cbrc-20 table">
              <TableHead sx={{ bgcolor: "#84848a", color: "white" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    FROM
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    TO
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    PRICE (TOTAL)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    PRICE (PER TOKEN)
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    AMOUNT
                  </TableCell>
                  <TableCell sx={{ fontWeight: "bold", fontSize: "1rem" }}>
                    TIMESTAMP
                  </TableCell>
                </TableRow>
              </TableHead>
              <>
                {txs && txs.length ? (
                  <TableBody sx={{ bgcolor: "#3d0263", color: "white" }}>
                    {txs?.map((item: ISale) => {
                      return (
                        <TableRow
                          onClick={() => handleTxClick(item.txid)}
                          key={item.txid}
                          sx={{
                            "&:last-child td, &:last-child th": { border: 0 },
                            "&:hover": { bgcolor: "#1f1d3e" },
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
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
                            {item.sat_per_token && item.token && (
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
                                        ? ` (${formatted.unit} ${item.token} ) `
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
                                        ? ` (${formatted.unit} ${item.token} ) `
                                        : " /  " + item.token.toUpperCase();
                                    })()}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell sx={{ color: "white" }}>
                            {item.amount && formatNumber(item.amount)}
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
    </section>
  );
}

export default CBRCSales;
