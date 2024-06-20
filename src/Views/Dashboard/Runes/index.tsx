"use client";
import { fetchRunesBalance } from "@/apiHelper/fetchRunesBalance";
import { formatNumber } from "@/utils";
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
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useCallback, useEffect, useState } from "react";

function Runes() {
  const [runes, setRunes] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const walletDetails = useWalletAddress();

  const fetchCbrcBrc20 = useCallback(async () => {
    try {
      if (!walletDetails?.ordinal_address) return;
      const params = {
        addresses: [
          walletDetails.ordinal_address,
          walletDetails.cardinal_address,
        ],
      };

      const result = await fetchRunesBalance(params);
      if (result && result.data) {
        setRunes(result.data);
        setLoading(false);
      }
    } catch (e: any) {}
  }, [walletDetails]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchCbrcBrc20();
    }
  }, [walletDetails]);

  return (
    <div className="w-full">
      <div className="w-full">
        {walletDetails?.connected ? (
          <div className="w-full">
            <div className="py-16">
              <div className="flex justify-between items-end flex-wrap pb-6">
                <div>
                  <h2 className="font-bold text-2xl pb-2">Balance</h2>
                  <p className="text-sm py-2">Your Runes Balance</p>
                </div>
              </div>
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
                  <div className="w-full">
                    {runes ? (
                      <div className="w-full">
                        {Object.entries(runes)?.map(
                          ([address, response]: any) => {
                            if (response.success)
                              return (
                                <div className="w-full">
                                  <h2 className="text-lg  text-gray-500 pt-16 py-4">
                                    {address}
                                  </h2>

                                  <Table
                                    sx={{ minWidth: 650, width: "100%" }}
                                    aria-label="runes table"
                                  >
                                    <TableHead
                                      sx={{
                                        minWidth: "100%",
                                        bgcolor: "rgba(145, 2, 240, 0.12)",
                                        color: "white",
                                      }}
                                    >
                                      <TableRow>
                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "1rem",
                                            color: "#84848a",
                                          }}
                                          component="th"
                                          scope="row"
                                        >
                                          TICKER
                                        </TableCell>

                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "1rem",
                                            color: "#84848a",
                                          }}
                                        >
                                          Symbol
                                        </TableCell>

                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "1rem",
                                            color: "#84848a",
                                          }}
                                        >
                                          Amount
                                        </TableCell>

                                        <TableCell
                                          sx={{
                                            fontWeight: "bold",
                                            fontSize: "1rem",
                                            color: "#84848a",
                                          }}
                                        >
                                          Divisibility
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody sx={{ color: "white" }}>
                                      {Object.entries(response.data).map(
                                        ([runeName, aggregation]: any) => (
                                          <TableRow
                                            // onClick={() => handleListingClick(item.tick)}
                                            key={runeName}
                                            sx={{
                                              "&:last-child td, &:last-child th":
                                                {
                                                  border: "3px",
                                                  borderColor:
                                                    "rgba(145, 2, 240, 0.50)",
                                                },
                                              "&:hover": {
                                                bgcolor:
                                                  "rgba(145, 2, 240, 0.12)",
                                              },
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
                                                {aggregation.icon ? (
                                                  <div className=" rounded-full w-7 h-7 border border-white">
                                                    <img
                                                      src={aggregation.icon}
                                                      alt="Icon"
                                                      className=" object-cover w-full h-full overflow-none rounded-full " // Adjust width and height as needed
                                                    />
                                                  </div>
                                                ) : (
                                                  <div className="">
                                                    <div
                                                      className="rounded-full w-7 h-7 border border-white flex justify-center items-center bg-accent" // Use your secondary color here
                                                      style={{
                                                        lineHeight: "1.5rem",
                                                      }} // Adjust line height to match your text size
                                                    >
                                                      {runeName
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                    </div>
                                                  </div>
                                                )}
                                                <p className="text-left pl-3 font-bold tracking-wide uppercase">
                                                  {runeName}
                                                </p>
                                              </div>
                                            </TableCell>

                                            <TableCell
                                              sx={{
                                                textAlign: "start",
                                                color: "white",
                                              }}
                                            >
                                              <div className="flex items-center">
                                                <p className="text-start">
                                                  {aggregation?.symbol
                                                    ? ` ${aggregation.symbol}`
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
                                              <div className="flex items-center">
                                                <p className="text-start">
                                                  {aggregation.totalAmount
                                                    ? ` ${formatNumber(
                                                        aggregation.totalAmount
                                                      )}`
                                                    : "0"}
                                                </p>
                                              </div>
                                            </TableCell>

                                            <TableCell
                                              sx={{
                                                textAlign: "start",
                                                color: "white",
                                              }}
                                            >
                                              <div className="flex items-center">
                                                <p className="text-start">
                                                  {aggregation.divisibility
                                                    ? ` ${formatNumber(
                                                        aggregation.divisibility
                                                      )}`
                                                    : "0"}
                                                </p>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              );
                          }
                        )}
                      </div>
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
                  </div>
                </TableContainer>
              </div>
            </div>
          </div>
        ) : (
          <>
            {" "}
            <div className="text-white center py-16">Wallet not connected</div>
          </>
        )}
      </div>
    </div>
  );
}

export default Runes;
