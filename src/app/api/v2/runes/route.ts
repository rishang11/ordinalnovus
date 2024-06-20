import { NextRequest, NextResponse } from "next/server";
import { Rune, TestnetRune } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import moment from "moment";
import { getCache, setCache } from "@/lib/cache";

const fetchRunes = async (query: any, network: "mainnet" | "testnet") => {
  console.log({ network });
  console.dir(query, { depth: null });

  if (network === "testnet") {
    return await TestnetRune.find(query.find)
      .where(query.where)
      .sort(query.sort)
      .skip(query.start)
      .limit(query.limit)
      .lean()
      .exec();
  }
  return await Rune.find(query.find)
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countRunes = async (query: any, network: "mainnet" | "testnet") => {
  if (network === "testnet")
    return await TestnetRune.countDocuments(
      { ...query.find },
      { limit: 100000 }
    );

  return await Rune.countDocuments({ ...query.find }, { limit: 100000 });
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** RUNE API CALLED *****");
  const startTime = Date.now(); // Record the start time

  const network: any = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  try {
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }
    const query = convertParams(TestnetRune, req.nextUrl);

    const cacheKey = `${network}_runes:${JSON.stringify(query)}`;
    // Try to fetch the result from Redis first
    let cachedResult =
      process.env.NODE_ENV === "production" ? await getCache(cacheKey) : null;

    if (cachedResult) {
      console.debug("using cache to return /runes");
      return NextResponse.json(cachedResult);
    }

    await dbConnect();
    const runes = await fetchRunes(query, network);
    console.log({ runes });

    const totalCount = await countRunes(query, network);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    const result = {
      runes,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    };

    await setCache(cacheKey, result, 10);
    return NextResponse.json(result);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching runes" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
