// app/api/v2/runes/mint/route.ts
import { NextRequest, NextResponse } from "next/server";
//@ts-ignore
import { v4 as uuidv4 } from "uuid";
import { CustomError, getBTCPriceInDollars } from "@/utils";
import axios from "axios";

import * as cryptoUtils from "@cmdcode/crypto-utils";
import { Tap, Script, Address, Signer, Tx } from "@cmdcode/tapscript";
import {
  bytesToHex,
  generateUnsignedPsbtForRuneMint,
  satsToDollars,
} from "@/utils/Inscribe";
import { AddressTxsUtxo } from "cryptic-mempool/lib/interfaces/bitcoin/addresses";
import { getUtxosByAddress } from "@/utils/Marketplace";
import { selectPaymentUTXOs } from "@/utils/Marketplace/Buying";
import dbConnect from "@/lib/dbConnect";
import { ExecuteRuneOrder, RuneOrder, Wallet } from "@/models";
import { createActivity } from "@/utils/serverUtils/createActivity";
import { getCache, setCache } from "@/lib/cache";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const BASE_SIZE = 160;
const PADDING = 1000;
const PREFIX = 160;
const MINIMUM_FEE = 5000;

export async function POST(req: NextRequest) {
  try {
    console.log("***** MINT RUNE PSBT API ********");
    let {
      network = "mainnet",
      receive_address,
      fee_rate,
      webhook_url,
      referrer,
      referral_fee,
      referral_fee_percent,
      wallet,
      payment_address,
      publickey,
      tick,
      rep,
    } = await req.json();

    const order_id = uuidv4();

    if (referrer && !referral_fee && !referral_fee_percent) {
      throw new CustomError(
        "Referral address has been used. Please provide referral_fee.",
        400
      );
    }

    if (!receive_address || !fee_rate) {
      throw new CustomError("Fee or address missing", 400);
    }

    const url =
      network === "testnet"
        ? `http://64.20.33.102:56018/rune/${tick}`
        : `${process.env.NEXT_PUBLIC_PROVIDER}/rune/${tick}`;

    const { data: token_info } = await axios
      .get(url, {
        headers: {
          Accept: "application/json",
        },
      })
      .catch((err) => {
        console.log(err.response.data, "ERROR IN FETCHING RUNE");
        throw Error("Failed to get data of this rune");
      });

    if (!token_info.mintable) {
      throw new CustomError("Token is not mintable", 404);
    }

    const [block, txNo] = token_info.id.split(":");
    const hex = encodeData([20, Number(block), 20, Number(txNo)]);

    const tokens: any[] = await processMints(
      order_id,
      hex,
      network,
      fee_rate,
      rep,
      receive_address
    );

    let total_fees = calculateTotalFees(tokens);

    let service_fee = calculateServiceFee(total_fees, tokens);

    const data: any = {
      order_id,
      receive_address,
      chain_fee: total_fees,
      service_fee,
      referral_fee,
      referrer,
      txid: "",
      psbt: "",
      status: "payment pending",
    };

    const { psbt } = await generateUnsignedPsbtForInscription(
      payment_address,
      publickey,
      fee_rate,
      wallet,
      data,
      tokens
    );

    console.log({ psbt });
    data.psbt = psbt;

    await dbConnect();
    // Create the document
    const newDocument = await RuneOrder.create(data);

    // Retrieve the ObjectId of the newly created document
    const object_id = newDocument._id;
    // Update the array with new ObjectIds
    const bulkOperations = tokens.map((inscription) => {
      inscription.order = object_id;

      return {
        insertOne: {
          document: inscription,
        },
      };
    });

    const final_response = await constructResponse(
      tokens,
      total_fees,
      service_fee,
      0,
      psbt
    );

    // Perform the bulk write
    await ExecuteRuneOrder.bulkWrite(bulkOperations);

    const user = await Wallet.findOne({
      ordinal_address: receive_address,
    });
    if (user) {
      let btcPrice = 0;

      const btc_cache_key = "bitcoinPrice";
      const cache = await getCache(btc_cache_key);
      if (cache) btcPrice = cache;
      else {
        btcPrice = (await getBTCPriceInDollars()) || 0;
        await setCache(btc_cache_key, btcPrice, 120);
      }
      // console.log({ btcPrice });
      createActivity({
        type: "mint-rune",
        status: "payment pending",
        user: user._id,
        price_usd: ((total_fees + service_fee) / 100_000_000) * btcPrice,
        price_sat: total_fees + service_fee,
        order_id,
      });
    }
    return NextResponse.json(final_response);
  } catch (error: any) {
    console.error("Catch Error: ", error);
    const status = error?.status || 500;
    const message = error.message || "Error creating inscribe order";
    return NextResponse.json({ message }, { status });
  }
}
async function constructResponse(
  tokens: any[],
  total_fees: number,
  service_fee: number,
  referral_fee: number | undefined,
  psbt: string
) {
  return {
    tokens: tokens,
    chain_fee: total_fees,
    service_fee: service_fee,
    referral_fee: referral_fee,
    total_fee: total_fees + service_fee + (referral_fee || 0),
    total_fees_in_dollars: await satsToDollars(
      total_fees + service_fee + (referral_fee || 0)
    ),
    psbt,
  };
}

export async function generateUnsignedPsbtForInscription(
  payment_address: string,
  publickey: string | undefined,
  fee_rate: number,
  wallet: string,
  order: any,
  tokens: any[]
) {
  let payerUtxos: AddressTxsUtxo[];
  let paymentUtxos: AddressTxsUtxo[] | undefined;
  try {
    payerUtxos = await getUtxosByAddress(payment_address);
  } catch (e) {
    console.error(e);
    return Promise.reject("Mempool error");
  }

  try {
    paymentUtxos = await selectPaymentUTXOs(
      payerUtxos,
      order.chain_fee + order.service_fee + 10000,
      Math.floor(Math.random() * 3) + 3, // number between 3-5
      tokens.length + 2,
      fee_rate,
      true
    );

    if (!paymentUtxos) throw Error("Balance not enough");

    let psbt = null;
    let inputs = null; // Assuming inputs is not declared elsewhere

    psbt = await generateUnsignedPsbtForRuneMint(
      payment_address,
      publickey,
      paymentUtxos,
      fee_rate,
      wallet,
      tokens,
      order
    );
    console.log({ psbt, inputs });
    return { psbt, inputs };
  } catch (err: any) {
    throw Error(err);
  }
}

function calculateServiceFee(total_fees: number, tokens: any[]) {
  let service_fee = Math.max(
    Math.ceil(total_fees * 0.05),
    2000 * tokens.length,
    MINIMUM_FEE
  );

  return service_fee;
}

function calculateTotalFees(inscriptions: any[]) {
  let total_fee = inscriptions.reduce((acc, ins) => acc + ins.tx_fee, 0);

  return total_fee;
}

async function processMints(
  order_id: string,
  hex: string,
  network: "testnet" | "mainnet",
  fee_rate: number,
  rep: number,
  receive_address: string
) {
  let runes: any = [];

  let total_fee = 0;
  await Promise.all(
    new Array(rep).fill(1).map(async () => {
      const privkey = await generatePrivateKey();
      // Generate pubkey and seckey from privkey
      const KeyPair = cryptoUtils.KeyPair;
      const seckey = new KeyPair(privkey);
      const pubkey = seckey.pub.rawX;
      console.log({
        fee_rate,
      });

      // create the script using our derived info
      const script = [pubkey, "OP_CHECKSIG"];

      // create leaf and tapkey and cblock
      const leaf = Tap.tree.getLeaf(Script.encode(script));
      const [tapkey, cblock] = Tap.getPubKey(pubkey, { target: leaf });

      // Generated our Inscription Address
      //@ts-ignore
      let walletAddress = Address.p2tr.encode(tapkey, network);

      console.log("wallet address: ", walletAddress);
      console.log("Tapkey:", tapkey);

      let txsize = PREFIX;

      let tx_fee = fee_rate * txsize + PADDING;

      total_fee += tx_fee;

      console.log({ txsize, fee_rate, tx_fee });

      runes.push({
        order_id,
        hex,
        privkey,
        leaf: leaf,
        tapkey: tapkey,
        cblock: cblock,
        wallet_address: walletAddress,
        tx_fee,
        txsize: txsize,
        fee_rate: fee_rate,
        output: "NA",
        receive_address,
        network,
        status: "payment pending",
      });
    })
  );

  return runes;
}

function encodeData(integers: number[]) {
  const bytes: any = [];

  integers.forEach((integer) => {
    let value = integer; // Use normal number, not BigInt
    while (value >= 128) {
      // Same threshold, but use 128 for clarity
      bytes.push((value & 0x7f) | 0x80); // Continue bit set
      value >>= 7; // Right shift value by 7 bits
    }
    bytes.push(value); // Last byte with continue bit cleared
  });

  return bytes.map((byte: any) => byte.toString(16).padStart(2, "0")).join("");
}

async function generatePrivateKey() {
  let isValid = false;
  let privkey;

  while (!isValid) {
    privkey = bytesToHex(cryptoUtils.Noble.utils.randomPrivateKey());
    const KeyPair = cryptoUtils.KeyPair;

    let seckey = new KeyPair(privkey);
    let pubkey = seckey.pub.rawX;
    const init_script = [pubkey, "OP_CHECKSIG"];
    let init_leaf = await Tap.tree.getLeaf(Script.encode(init_script));
    let [init_tapkey, init_cblock] = await Tap.getPubKey(pubkey, {
      target: init_leaf,
    });

    /**
     * This is to test IF the tx COULD fail.
     * This is most likely happening due to an incompatible key being generated.
     */
    const test_redeemtx = Tx.create({
      vin: [
        {
          txid: "a99d1112bcb35845fd44e703ef2c611f0360dd2bb28927625dbc13eab58cd968",
          vout: 0,
          prevout: {
            value: 10000,
            scriptPubKey: ["OP_1", init_tapkey],
          },
        },
      ],
      vout: [
        {
          value: 8000,
          scriptPubKey: ["OP_1", init_tapkey],
        },
      ],
    });

    const test_sig = await Signer.taproot.sign(seckey.raw, test_redeemtx, 0, {
      extension: init_leaf,
    });
    test_redeemtx.vin[0].witness = [test_sig.hex, init_script, init_cblock];
    isValid = await Signer.taproot.verify(test_redeemtx, 0, { pubkey });

    if (!isValid) {
      console.log("Invalid key generated, retrying...");
    } else {
      console.log({ privkey });
    }
  }

  if (!privkey) {
    throw Error("No privkey was generated");
  }
  return privkey;
}
