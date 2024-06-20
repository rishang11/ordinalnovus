"use server";
import axios from "axios";

interface createDummyUtxoPsbt {
  pay_address: string;
  publickey: string;
  wallet: string;
  fee_rate: number;
  amount: number;
}

async function getUnsignedDummyPSBT(data: createDummyUtxoPsbt): Promise<{
  ok: boolean;
  message: string;
  for?: string;
  unsigned_psbt_base64?: string;
  input_length?: number;
}> {
  try {
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_URL}/api/v2/create-dummy-utxos-psbt`,
      data,
      {
        headers: {
          "x-api-key": process.env.API_KEY, // Add your API key here in the headers
          // You can add other headers here if needed
        },
      }
    );

    if (response.status === 200) {
      return {
        ok: response.data.ok,
        message: response.data.message,
        unsigned_psbt_base64: response.data.unsigned_psbt_base64,
      };
    } else {
      throw new Error("Error generating unsigned PSBT");
    }
  } catch (error: any) {
    console.error(error.response.data.message, "error");
    return {
      ok: false,
      message: error.response.data.message || "Error generating unsigned PSBT",
    };
  }
}

export default getUnsignedDummyPSBT;
