// app/api/v2/create-dummy-utxos-psbt
import { NextRequest, NextResponse } from "next/server";
import { getUtxosByAddress } from "@/utils/Marketplace";
import {
  DUMMY_UTXO_VALUE,
  generateUnsignedCreateDummyUtxoPSBTBase64,
  selectPaymentUTXOs,
} from "@/utils/Marketplace/Buying";

interface OrderInput {
  pay_address: string;
  publickey: string;
  fee_rate: number;
  wallet: string;
  amount: number;
}

// Validate the POST method and necessary fields in the request
function validateRequest(body: OrderInput): string[] {
  const requiredFields = ["publickey", "pay_address", "wallet", "fee_rate"];
  const missingFields = requiredFields.filter((field) => {
    //@ts-ignore
    const value = body[field];
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (typeof value === "string" && value.trim() === "")
    );
  });

  return missingFields;
}

// Fetch and process the ordItem data
async function dummyUtxoPSBTCreate(
  pay_address: string,
  publickey: string,
  wallet: string,
  fee_rate: number,
  amount: number
) {
  let payerUtxos = await getUtxosByAddress(pay_address);
  let minimumValueRequired: number;
  let vins: number;
  let vouts: number;

  console.log("Lacking dummy utxos");
  let numberOfDummyUtxosToCreate = amount;
  console.log({ numberOfDummyUtxosToCreate });
  minimumValueRequired = numberOfDummyUtxosToCreate * DUMMY_UTXO_VALUE;
  vins = 0;
  vouts = numberOfDummyUtxosToCreate;

  const taprootAddress =
    pay_address.startsWith("bc1p") || pay_address.startsWith("tb1p");
  const paymentUtxos = await selectPaymentUTXOs(
    payerUtxos,
    minimumValueRequired,
    vins,
    vouts,
    fee_rate,
    taprootAddress
  );
  const psbt = await generateUnsignedCreateDummyUtxoPSBTBase64(
    pay_address,
    publickey,
    paymentUtxos,
    fee_rate,
    wallet,
    numberOfDummyUtxosToCreate
  );
  console.log({ psbt });
  return psbt;
}

export async function POST(
  req: NextRequest,
  res: NextResponse<{
    ok: Boolean;
    inscription_id?: string;
    price?: number;
    receive_address?: string;
    pay_address?: string;
    unsigned_psbt_base64?: string;
    input_length: number;
    message: string;
    for?: string;
  }>
) {
  console.log("***** CREATE UNSIGNED DUMMY UTXO PSBT API CALLED *****");

  try {
    const body: OrderInput = await req.json();
    const missingFields = validateRequest(body);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log({ body });
    const result = await dummyUtxoPSBTCreate(
      body.pay_address,
      body.publickey,
      body.wallet,
      body.fee_rate,
      body?.amount || 2
    );

    //buy psbt || dummy utxo psbt
    const psbt = result;

    return NextResponse.json({
      ok: true,
      unsigned_psbt_base64: psbt,
      message: "Success",
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      {
        ok: false,
        message: error.message || error,
      },
      { status: 500 }
    );
  }
}
