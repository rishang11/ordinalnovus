import React, { useCallback, useEffect, useState } from "react";
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
import { FaDollarSign } from "react-icons/fa";
import { formatNumber } from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import { FetchCBRCBalance } from "@/apiHelper/getCBRCWalletBalance";

import { useRouter } from "next/navigation";
import Inscriptions from "./Inscriptions";
function Cbrc() {
  const router = useRouter();
  const [cbrc_stats, set_cbrcs_stats] = useState<any>(null);

  const [cbrcs, setCbrcs] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const walletDetails = useWalletAddress();

  const fetchCbrcBrc20 = useCallback(async () => {
    try {
      if (!walletDetails?.ordinal_address) return;
      const params = {
        address: walletDetails.ordinal_address,
      };

      const result = await FetchCBRCBalance(params);
      if (result && result.data) {
        setCbrcs(result.data.tokenData);
        set_cbrcs_stats(result.data.stats);
        setLoading(false);
      }
    } catch (e: any) {}
  }, [walletDetails]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchCbrcBrc20();
    }
  }, [walletDetails]);

  const handleListingClick = (id: string) => {
    router.push(`/cbrc-20/${id}`);
  };

  return (
    <div>
      {walletDetails?.connected ? (
        <>
          <Inscriptions cbrcs={cbrcs} />
          <div className="py-16">
            <div className="flex justify-between items-end flex-wrap pb-6">
              <div>
                <h2 className="font-bold text-2xl pb-2">Balance</h2>
                <p className="text-sm py-2">Your Valid CBRC-20 Balance</p>
              </div>

              {cbrc_stats?.total_balance_in_usd && (
                <div className="text-3xl center">
                  <span className="text-green-500 pr-1 text-md">
                    <FaDollarSign />
                  </span>{" "}
                  <p>
                    {formatNumber(
                      Number(cbrc_stats?.total_balance_in_usd.toFixed(2))
                    )}
                  </p>
                </div>
              )}
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
                <Table sx={{ minWidth: 650 }} aria-label="cbrc-20 table">
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
                        TICKER
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          color: "#84848a",
                        }}
                      >
                        Available
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          color: "#84848a",
                        }}
                      >
                        Transferrable
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          color: "#84848a",
                        }}
                      >
                        Price
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: "bold",
                          fontSize: "1rem",
                          color: "#84848a",
                        }}
                      >
                        Total
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <>
                    {cbrcs && cbrcs.length ? (
                      <TableBody sx={{ color: "white" }}>
                        {cbrcs?.map((item: any) => {
                          return (
                            <TableRow
                              onClick={() => handleListingClick(item.tick)}
                              key={item.tick}
                              sx={{
                                "&:last-child td, &:last-child th": {
                                  border: "3px",
                                  borderColor: "rgba(145, 2, 240, 0.50)",
                                },
                                "&:hover": {
                                  bgcolor: "rgba(145, 2, 240, 0.12)",
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
                                    {item.tick}
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
                                    {item?.amt
                                      ? ` ${formatNumber(item.amt)}`
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
                                    {item?.lock
                                      ? ` ${formatNumber(item.lock)}`
                                      : "0"}
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
                                  {item.price
                                    ? `$${
                                        item.price < 1
                                          ? item.price.toFixed(6)
                                          : item.price.toFixed(2)
                                      }`
                                    : " 0 "}
                                </p>
                              </TableCell>

                              <TableCell
                                sx={{
                                  textAlign: "start",
                                  color: "white",
                                }}
                              >
                                <div className="flex items-center">
                                  <div className="text-green-500 pr-1">
                                    {" "}
                                    <FaDollarSign />
                                  </div>
                                  <p className="text-start">
                                    {item?.total_usd_value
                                      ? ` ${formatNumber(
                                          Number(
                                            item.total_usd_value.toFixed(3)
                                          )
                                        )}`
                                      : "0"}
                                  </p>
                                </div>
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
          </div>
        </>
      ) : (
        <>
          {" "}
          <div className="text-white center py-16">Wallet not connected</div>
        </>
      )}
    </div>
  );
}

export default Cbrc;
