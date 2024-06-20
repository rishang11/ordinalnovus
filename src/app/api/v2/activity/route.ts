import { NextRequest, NextResponse } from "next/server";
import { Activity, Wallet } from "@/models";
import dbConnect from "@/lib/dbConnect";
import convertParams from "@/utils/api/convertParams";

import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";

import moment from "moment";

import { getCache, setCache } from "@/lib/cache";

const fetchActivities = async (query: any) => {
  return await Activity.find({
    ...query.find,
  })
    .populate("user")
    .where(query.where)
    .sort(query.sort)
    .skip(query.start)
    .limit(query.limit)
    .lean()
    .exec();
};

const countActivities = async (query: any) => {
  return await Activity.countDocuments(
    {
      ...query.find,
    },
    { limit: 100000 }
  );
};

export async function GET(req: NextRequest, res: NextResponse) {
  console.log("***** Activities API CALLED *****");
  const startTime = Date.now(); // Record the start time

  try {
    let cacheKey = "";
    const middlewareResponse = await apiKeyMiddleware(
      ["inscription"],
      "read",
      []
    )(req);

    if (middlewareResponse) {
      return middlewareResponse;
    }

    const query = convertParams(Activity, req.nextUrl);
    console.dir(query, { depth: null });

    cacheKey = `activities:${req.nextUrl.toString()}`;

    // Try to get cached data
    let cachedData = await getCache(cacheKey);
    if (cachedData && !process.env.NEXT_PUBLIC_URL?.includes("localhost")) {
      console.log("Responding from cache");
      return NextResponse.json(JSON.parse(cachedData));
    }

    await dbConnect();
    const addresses = query.addresses.split("|");
    if (query.addresses) {
      const user = await Wallet.findOne({
        $or: [
          { ordinal_address: { $in: addresses } },
          { cardinal_address: { $in: addresses } },
        ],
      }).select("_id");

      console.log({ user });

      query.find["user"] = user._id;
    }
    const Activities = await fetchActivities(query);

    const totalCount = await countActivities(query);
    const endTime = Date.now(); // Record the end time
    const timeTaken = endTime - startTime; // Calculate the elapsed time
    console.debug(
      "Time Taken to process this: ",
      moment.duration(timeTaken).humanize()
    );

    const responseData = {
      activities: Activities,
      pagination: {
        page: query.start / query.limit + 1,
        limit: query.limit,
        total: totalCount,
      },
      time_taken_to_process: moment.duration(timeTaken).humanize(),
      processing_time: timeTaken,
    };
    // Cache the result
    // 5s
    await setCache(cacheKey, JSON.stringify(responseData), 5);

    return NextResponse.json(responseData);
  } catch (error: any) {
    if (!error?.status) console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || error || "Error fetching Activitys" },
      { status: error.status || 500 }
    );
  }
}

export const dynamic = "force-dynamic";
