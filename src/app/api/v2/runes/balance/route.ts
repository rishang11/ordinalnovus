import { NextRequest, NextResponse } from "next/server";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";
import { getCache, setCache } from "@/lib/cache";
import { Inscription } from "@/models";
import { getUtxosByAddress } from "@/utils/Marketplace";
import { doesUtxoContainRunes } from "@/utils/serverUtils/doesUtxoContainRunes";

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** RUNES BALANCE API CALLED *****");
  const startTime = Date.now(); // Record the start time

  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Inscription, req.nextUrl);

    const cacheKey = `runes_balance:${JSON.stringify(query)}`;
    // Try to fetch the result from Redis first
    let cachedResult = await getCache(cacheKey);

    if (cachedResult) {
      console.debug("using cache to return /inscriptions");
      return NextResponse.json(cachedResult);
    }
    console.log({ query });

    const addresses = [];
    if (query.find && query.find.address) {
      addresses.push(query.find.address);
    }

    if (query.addresses) {
      const addressesInQuery = query.addresses.split("|");
      addresses.push(...addressesInQuery); // This spreads and adds all elements from addressesInQuery to addresses
    }

    if (!addresses.length) {
      throw Error("No address in query");
    }

    const result = await fetchAndAggregateRunesForAddresses(addresses);

    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    await setCache(cacheKey, result, 120);
    return NextResponse.json(result);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching inscriptions" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";

async function fetchAndAggregateRunesForAddresses(addresses: string[]) {
  const results = {};

  for (const address of addresses) {
    if (!address) {
      continue; // Skip any undefined or null addresses
    }

    try {
      // Fetch UTXOs for the specified address
      const addressUtxos = await getUtxosByAddress(address);
      const runes = [];

      // Loop through each UTXO to check and collect rune data
      for (const utxo of addressUtxos) {
        const runedata = await doesUtxoContainRunes(utxo);
        if (runedata) {
          runes.push(runedata);
        }
      }

      // Aggregate the collected rune data
      const aggregatedRunes = aggregateRunes(runes);
      // @ts-ignore
      results[address] = {
        success: true,
        data: aggregatedRunes,
      };
    } catch (error: any) {
      // @ts-ignore
      results[address] = {
        success: false,
        message: error.message,
      };
    }
  }

  return results;
}

function aggregateRunes(runes: any) {
  const aggregation = {};

  runes.forEach((runeArray: any[][]) => {
    const rune = runeArray[0][0];
    const details = runeArray[0][1];

    //@ts-ignore
    if (!aggregation[rune]) {
      // Initialize the rune in the aggregation object if it doesn't already exist
      // @ts-ignore
      aggregation[rune] = {
        totalAmount: 0,
        occurrences: 0,
        divisibility: details.divisibility,
        symbol: details.symbol,
      };
    }

    // Sum the amounts and count the occurrences
    //@ts-ignore
    aggregation[rune].totalAmount += details.amount;
    //@ts-ignore
    aggregation[rune].occurrences += 1;
  });

  return aggregation;
}
