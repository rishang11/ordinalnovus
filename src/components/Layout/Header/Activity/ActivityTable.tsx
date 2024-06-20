import React from "react";
import { IActivity } from "@/types";
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
import { formatNumber, shortenString } from "@/utils";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import moment from "moment";
import { FaBitcoin, FaDollarSign } from "react-icons/fa";
import { PendingIcon } from "@/components/elements/BuyInscriptionCardButton";

interface ActivityTableProps {
  activities: IActivity[] | null;
  fetchMoreData: () => void;
  hasMore: boolean;
  loading: boolean;
  myAddress: string[];
}

const ActivityTable: React.FC<ActivityTableProps> = ({
  activities,
  fetchMoreData,
  hasMore,
  loading,
  myAddress,
}) => {
  const handleTxClick = (txid: string) => {
    window.open(`https://mempool.space/tx/${txid}`, "_blank");
  };
  const currency = useSelector((state: RootState) => state.general.currency);

  return (
    <TableContainer
      component={Paper}
      sx={{
        bgcolor: "transparent",
        color: "white",
        border: "3px",
        borderColor: "rgba(145, 2, 240, 0.50)",
        maxHeight: "80vh",
      }}
      className="small-scrollbar"
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ bgcolor: "rgba(145, 2, 240, 0.12)", color: "white" }}>
          <TableRow>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Inscription
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Type
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Seller
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Buyer
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Price
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Transaction ID
            </TableCell>
            <TableCell
              sx={{ fontWeight: "bold", fontSize: "1rem", color: "#84848a" }}
            >
              Timestamp
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody sx={{ color: "white" }}>
          {activities && activities.length ? (
            <>
              {activities.map((activity) => {
                let bg = " bg-gray-600 ";
                switch (activity.type) {
                  case "delist":
                    bg = " bg-red-600 ";
                    break;

                  case "list":
                    bg = " bg-indigo-600 ";
                    break;

                  case "buy":
                    bg = " bg-green-600 ";
                    break;

                  case "update-listing":
                    bg = " bg-slate-600 ";
                    break;

                  case "prepare":
                    bg = " bg-blue-600 ";
                    break;

                  default:
                    break;
                }
                return (
                  <TableRow
                    key={activity._id}
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
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      {shortenString(activity?.inscription_id || "-") || "-"}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      <span
                        className={`text-xs ${bg} text-white font-bold rounded px-3 py-1 tracking-wider`}
                      >
                        {activity.type}
                      </span>
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      {shortenString(
                        activity.seller
                          ? myAddress.includes(activity.seller)
                            ? "ME"
                            : activity.seller
                          : "-"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      {shortenString(
                        activity.buyer
                          ? myAddress.includes(activity.buyer)
                            ? "ME"
                            : activity.buyer
                          : "-"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      {activity?.price_usd && activity?.price_sat ? (
                        currency === "USD" ? (
                          <div className="flex items-center justify-start">
                            {" "}
                            <div className="mr-2 text-green-500">
                              <FaDollarSign className="" />
                            </div>
                            {formatNumber(Number(activity.price_usd))}
                          </div>
                        ) : (
                          <div className="flex items-center justify-start">
                            {" "}
                            <div className="mr-2 text-bitcoin">
                              <FaBitcoin className="" />
                            </div>
                            {formatNumber(
                              Number(activity.price_sat / 100_000_000)
                            )}
                          </div>
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "uppercase",
                      }}
                    >
                      {activity?.tx_status ? (
                        <div className="center">
                          <button
                            onClick={() =>
                              activity.txid && handleTxClick(activity.txid)
                            }
                            className="text-blue-500 flex items-center justify-center"
                          >
                            {shortenString(activity?.txid || "-")}

                            {activity.tx_status === "pending" && (
                              <div className="">
                                <PendingIcon />
                              </div>
                            )}
                          </button>
                        </div>
                      ) : (
                        <>-</>
                      )}
                    </TableCell>
                    <TableCell
                      sx={{
                        textAlign: "start",
                        color: "white",
                        textTransform: "lowercase",
                      }}
                    >
                      {moment(activity.createdAt).fromNow()}
                    </TableCell>
                  </TableRow>
                );
              })}

              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="text-white w-full center py-6">
                      <CircularProgress size={20} color="inherit" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {hasMore && (
                    <TableRow sx={{ border: 0 }}>
                      <TableCell colSpan={7}>
                        <p
                          onClick={fetchMoreData}
                          style={{ textAlign: "center" }}
                          className="py-4 text-blue-400 lowercase text-sm cursor-pointer"
                        >
                          View More
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <div className="text-white w-full center py-16">
                      <CircularProgress size={20} color="inherit" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  <TableRow>
                    <TableCell colSpan={7}>
                      <p
                        style={{ textAlign: "center" }}
                        className="py-4 text-gray-400 lowercase text-sm"
                      >
                        No more activities
                      </p>
                    </TableCell>
                  </TableRow>
                </>
              )}
            </>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default ActivityTable;
