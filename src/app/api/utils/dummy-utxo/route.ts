import apiKeyMiddleware from "@/middlewares/apikeyMiddleware";
import { countDummyUtxos } from "@/utils/serverUtils/countDummyUtxos";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("***** Dummy UTXO API CALLED *****");

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
    const dummyUtxos = await countDummyUtxos(address);

    const result = {
      dummyUtxos,
    };
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Server Error" }, { status: 500 });
  }
}
