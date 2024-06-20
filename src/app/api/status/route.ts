import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import { Block, InscriptionJob, Tx } from "@/models";
import axios from "axios";
import moment from "moment";
import { NextRequest, NextResponse } from "next/server";

interface IStatus {
  latest_mempool_block: number | null;
  latest_inscription_block: number | null;
  latest_tx_block: number | null;
  unparsed_txs: number;
  unparsed_inscription_blocks: number;
  is_ord_online: boolean;
  is_ord1_online: boolean;
  is_ord2_online: boolean;
  is_mempool_online: boolean;
  is_mempool_api_online: boolean;
  timestamp: string;
}

export async function GET(req: NextRequest) {
  try {
    console.log("****** STATUS api called ******");
    await dbConnect();
    const cacheKey = "status:";

    let data: any = await getCache(cacheKey);
    if (data) {
      console.log("returning from cache");
      return new NextResponse(data, {
        headers: {
          "Content-Type": "text/html",
        },
      });
    }

    const fiveMinutesAgo = moment().subtract(5, "minutes").toDate();
    // Perform all API calls in parallel
    const [
      latestMempoolBlockResponse,
      latestInscriptionJob,
      latestTxBlock,
      unparsed_txs,
      unparsed_inscription_blocks,
      isOrdOnlineResponse,
      isOrd1OnlineResponse,
      isOrd2OnlineResponse,
      isMempoolOnlineResponse,
      isMempoolApiOnlineResponse,
    ] = await Promise.all([
      axios
        .get("https://mempool.ordinalnovus.com/api/blocks/tip/height")
        .catch(() => null),
      InscriptionJob.findOne({}).sort({ height: -1 }),
      Block.findOne({}).sort({ height: -1 }),
      Tx.countDocuments({ parsed: false, updatedAt: { $lte: fiveMinutesAgo } }),
      InscriptionJob.countDocuments({ done: false }),
      axios.head("https://ord.ordinalnovus.com").catch(() => null),
      axios.head("http://64.227.138.124:8080").catch(() => null),
      axios.head("http://64.227.138.124:8081").catch(() => null),
      axios.head("https://mempool.ordinalnovus.com").catch(() => null),
      axios
        .get("https://mempool-api.ordinalnovus.com/mempool/txids")
        .catch(() => null),
    ]);

    const latest_mempool_block = latestMempoolBlockResponse
      ? latestMempoolBlockResponse.data
      : null;
    const latest_inscription_block = latestInscriptionJob
      ? latestInscriptionJob.height
      : null;
    const latest_tx_block = latestTxBlock ? latestTxBlock.height : null;

    const is_ord_online = !!isOrdOnlineResponse;
    const is_ord1_online = !!isOrd1OnlineResponse;
    const is_ord2_online = !!isOrd2OnlineResponse;
    const is_mempool_online = !!isMempoolOnlineResponse;
    const is_mempool_api_online = !!isMempoolApiOnlineResponse;

    const status: IStatus = {
      latest_mempool_block,
      latest_inscription_block,
      latest_tx_block,
      unparsed_txs,
      unparsed_inscription_blocks,
      is_ord_online,
      is_ord1_online,
      is_ord2_online,
      is_mempool_online,
      is_mempool_api_online,
      timestamp: moment().format("MMMM Do YYYY, h:mm:ss a"),
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Status Dashboard</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f4f4f9;
              color: #333;
              margin: 0;
              padding: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
            }
            .container {
              background: #fff;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
              border-radius: 8px;
              max-width: 600px;
              width: 100%;
              padding: 20px;
              text-align: center;
            }
            .status-item {
              margin: 10px 0;
              padding: 10px;
              border-bottom: 1px solid #e0e0e0;
            }
            .status-item:last-child {
              border-bottom: none;
            }
            .status-label {
              font-weight: bold;
            }
            .status-value {
              margin-left: 10px;
              color: #007bff;
            }
            .online {
              color: green;
            }
            .offline {
              color: red;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Status Dashboard</h1>
            <div class="status-item">
              <span class="status-label">Latest Mempool Block:</span>
              <span class="status-value">${
                status.latest_mempool_block ?? "N/A"
              }</span>
            </div>
            <div class="status-item">
              <span class="status-label">Latest Inscription Block:</span>
              <span class="status-value">${
                status.latest_inscription_block ?? "N/A"
              }</span>
            </div>
            <div class="status-item">
              <span class="status-label">Latest TX Block:</span>
              <span class="status-value">${
                status.latest_tx_block ?? "N/A"
              }</span>
            </div>
            <div class="status-item">
              <span class="status-label">Unparsed TXs:</span>
              <span class="status-value">${status.unparsed_txs}</span>
            </div>
            <div class="status-item">
              <span class="status-label">Unparsed Inscription Blocks:</span>
              <span class="status-value">${
                status.unparsed_inscription_blocks
              }</span>
            </div>
            <div class="status-item">
              <span class="status-label">ORD Status:</span>
              <span class="status-value ${
                status.is_ord_online ? "online" : "offline"
              }">
                ${status.is_ord_online ? "Online" : "Offline"}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">ORD 1 Status:</span>
              <span class="status-value ${
                status.is_ord1_online ? "online" : "offline"
              }">
                ${status.is_ord1_online ? "Online" : "Offline"}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">ORD 2 Status:</span>
              <span class="status-value ${
                status.is_ord2_online ? "online" : "offline"
              }">
                ${status.is_ord2_online ? "Online" : "Offline"}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">Mempool Status:</span>
              <span class="status-value ${
                status.is_mempool_online ? "online" : "offline"
              }">
                ${status.is_mempool_online ? "Online" : "Offline"}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">Mempool API Status:</span>
              <span class="status-value ${
                status.is_mempool_api_online ? "online" : "offline"
              }">
                ${status.is_mempool_api_online ? "Online" : "Offline"}
              </span>
            </div>
            <div class="status-item">
              <span class="status-label">Current Time:</span>
              <span class="status-value">${status.timestamp}</span>
            </div>
          </div>
        </body>
      </html>
    `;

    setCache(cacheKey, htmlContent, 10);
    return new NextResponse(htmlContent, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: any) {
    console.error({ error }, "STATUS ERR");
    return NextResponse.json({
      status: 500,
      body: { error: "Unexpected error occurred" },
    });
  }
}

export const dynamic = "force-dynamic";
