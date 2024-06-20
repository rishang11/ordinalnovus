import dbConnect from "@/lib/dbConnect";
import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { Wallet } from "@/models";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  console.log("***** COLLECTING WALLET INFO API CALLED *****");
  const middlewareResponse = await apiKeyMiddleware(
    ["inscription"],
    "read",
    []
  )(req);

  if (middlewareResponse) {
    return middlewareResponse;
  }
  const body = await req.json();
  const apiKeyInfo = req.apiKeyInfo;
  if (apiKeyInfo?.userType === "admin") {
    await dbConnect();
    let user = await Wallet.findOne({
      ordinal_address: body.ordinal_address,
    });
    // If user does not exist, create new and assign it to `user`
    if (!user) {
      user = await Wallet.create({
        ...body,
        apikey: apiKeyInfo._id,
        tag: apiKeyInfo.tag,
      });
    }
    return NextResponse.json({ ok: true, user });
  } else {
    return NextResponse.json({ ok: false });
  }
};
