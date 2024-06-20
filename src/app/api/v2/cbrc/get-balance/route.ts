import { getCache, setCache } from "@/lib/cache";
import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { CBRCToken } from "@/models";
import { CustomError, getBTCPriceInDollars } from "@/utils";
import convertParams from "@/utils/api/convertParams";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }
    console.log("***** FETCH CBRC BALANCE *****");
    const query = convertParams(CBRCToken, req.nextUrl);

    if (!query.address) {
      throw Error("Address is missing");
    }

    const cacheKey = `cbrc_balance:${query.address}`;

    console.log({ finalQueryCbrc: query });
    // Try to fetch the result from Redis first
    let cachedResult =
      process.env.NODE_ENV === "production" ? await getCache(cacheKey) : null;

    if (cachedResult) {
      console.debug("using cache");
      return NextResponse.json(cachedResult);
    }

    let url = `${process.env.NEXT_PUBLIC_CBRC_API}/balance/${query.address}`;
    const response = await axios.get(url);
    const token_balance = response.data;

    if (!token_balance || !token_balance.length) {
      throw new CustomError("This address has no CBRC Balance", 404);
    }

    await dbConnect();

    let btcPrice = 0;

    const btc_cache_key = "bitcoinPrice";
    const cache = await getCache(btc_cache_key);
    if (cache) btcPrice = cache;
    else {
      btcPrice = (await getBTCPriceInDollars()) || 0;
      await setCache(btc_cache_key, btcPrice, 120);
    }
    console.log({ btcPrice });

    // Filter out tokens where the sum of amt and lock is zero, then extract unique tick values
    const uniqueTicks = [
      ...new Set(
        token_balance
          .filter((token: any) => token.amt + token.lock !== 0)
          .map((token: any) => token.tick)
      ),
    ];

    // Create a query object to find all entries that match the ticks
    const token_price_query = { tick: { $in: uniqueTicks } };

    // Fetch the corresponding token data from the database
    const tokens = await CBRCToken.find(token_price_query);

    const tokenData = tokens.map((token) => {
      // Find the original token data from the token_balance array
      const originalToken = token_balance.find(
        (t: any) => t.tick === token.tick
      );
      const total = originalToken.amt + originalToken.lock;
      const pricePerSat = (token.price || 0) / 100_000_000; // Assuming price is in Satoshi units
      const total_sat_value = total * (token.price || 0); // Total value in SATs
      const total_usd_value = total * pricePerSat * btcPrice; // Total value in USD
      const total_btc_value = total * pricePerSat; // Total value in BTC

      return {
        icon: token.icon,
        tick: token.tick,
        amt: originalToken.amt,
        lock: originalToken.lock,
        mint: originalToken.mint,
        price: pricePerSat * btcPrice, // Price per token unit in USD
        total: total,
        total_usd_value,
        total_btc_value,
        total_sat_value,
      };
    });

    console.log(tokenData); // Logs the detailed info of tokens with additional data and calculations
    return NextResponse.json({
      tokenData: tokenData.sort(
        (a, b) => b.total_usd_value - a.total_usd_value
      ), // Sorting token data by total USD value descending
      stats: {
        total_tokens: tokenData.length,
        total_balance_in_usd: tokenData.reduce(
          (acc, curr) => acc + curr.total_usd_value,
          0
        ), // Summing up total USD value
        total_balance_in_sats: tokenData.reduce(
          (acc, curr) => acc + curr.total_sat_value,
          0
        ), // Summing up total SATs value
        total_balance_in_btc: tokenData.reduce(
          (acc, curr) => acc + curr.total_btc_value,
          0
        ), // Summing up total BTC value
      },
    });
  } catch (err: any) {
    console.error(err); // or use a more advanced error logging mechanism
    return NextResponse.json({ message: err.message || err }, { status: 500 });
  }
}
