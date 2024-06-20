// import { getCache, setCache } from "@/lib/cache";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const testnet = process.env.NEXT_PUBLIC_NETWORK?.includes("testnet")
      ? true
      : false;
    console.log("***** BALANCE API CALLED *****");
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "write",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    console.log(req.nextUrl.searchParams.get("address"), "SEARCH_PARAMS");
    const address = req.nextUrl.searchParams.get("address");
    if (!address) {
      return NextResponse.json(
        { message: "No Address Found" },
        { status: 404 }
      );
    }

    const url = testnet
      ? `https://mempool.space/testnet/api/address/${address}`
      : `https://mempool-api.ordinalnovus.com/address/${address}`;

    console.log({ url });

    // Proceed to fetch new balance data
    const { data } = await axios.get(url);
    console.log({ data });
    if (data) {
      const newBal =
        data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      const newMempoolBal =
        data.mempool_stats.funded_txo_sum - data.mempool_stats.spent_txo_sum;

      let txids = [];

      const url = testnet
        ? `https://mempool.space/testnet/api/address/${address}/txs/mempool`
        : `https://mempool-api.ordinalnovus.com/address/${address}/txs/mempool`;

      if (newMempoolBal) {
        const { data: mempool_txs } = await axios.get(url);

        txids = mempool_txs.map((a: { txid: string }) => a.txid);
      }

      const result = {
        balance: newBal,
        mempool_balance: newMempoolBal,
        txids,
      };
      return NextResponse.json(result);
    }
  } catch (err) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
