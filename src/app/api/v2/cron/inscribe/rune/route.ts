// app/api/v2/cron/inscribe/rune/route.ts
import { addressReceivedMoneyInThisTx, pushBTCpmt } from "@/utils/Inscribe";
import { NextRequest, NextResponse } from "next/server";
import * as cryptoUtils from "@cmdcode/crypto-utils";
import { Signer, Tx, Address } from "@cmdcode/tapscript";
import { Activity, ExecuteRuneOrder, RuneOrder } from "@/models";
import dbConnect from "@/lib/dbConnect";
import * as bitcoin from "bitcoinjs-lib";
import { wait } from "@/utils";

/**
 * Finds an order with the status "payment received" from the database.
 * @returns {Promise<IInscribeOrder | null>} A promise that resolves to the found order or null if not found.
 */
async function findOrder() {
  await dbConnect();
  const network = process.env.NEXT_PUBLIC_NETWORK || "mainnet";
  const order = await RuneOrder.findOne({
    status: "payment received",
  });
  if (!order) {
    return { order: null, inscriptions: null };
  }
  const inscriptions = await ExecuteRuneOrder.find({
    order_id: order.order_id,
    network,
  });

  // console.log({ order, inscriptions });
  if (!order || !inscriptions.length) {
    return { order: null, inscriptions: null };
  }
  return { order, inscriptions };
}

async function cancelOldPendingPayments() {
  await dbConnect();

  // Calculate the time one hour ago
  const oneHourAgo = new Date(Date.now() - 3600000); // 3600000 milliseconds = 1 hour

  // Find orders that are older than one hour and have "payment pending" status
  const oldPendingOrders = await RuneOrder.find({
    status: "payment pending",
    createdAt: { $lt: oneHourAgo },
  });

  // No orders to update
  if (oldPendingOrders.length === 0) {
    console.log("No old pending payments to cancel.");
    return;
  }

  // Extract order IDs
  const orderIds = oldPendingOrders.map((order) => order._id);

  // Update the orders
  const updateResultOrders = await RuneOrder.updateMany(
    { _id: { $in: orderIds } },
    { $set: { status: "cancelled" } }
  );

  // Update related inscriptions
  const updateResultInscriptions = await ExecuteRuneOrder.updateMany(
    { order: { $in: orderIds } },
    { $set: { status: "cancelled" } }
  );

  console.log(
    `Cancelled ${updateResultOrders.modifiedCount} orders and ${updateResultInscriptions.modifiedCount} related inscriptions.`
  );
}

/**
 * Processes inscriptions for a given order.
 * @param {IInscribeOrder} order - The order containing the inscriptions.
 * @param {IFileSchema[]} inscriptions - An array of inscriptions.
 * @param {cryptoUtils.KeyPair} seckey - The secret key associated with the order.
 * @param {Uint8Array} pubkey - The public key associated with the inscriptions.
 * @returns {Promise<Object>} A promise that resolves to an object containing transaction details.
 */
async function processInscription(inscription: any) {
  const KeyPair = cryptoUtils.KeyPair;
  const seckey = new KeyPair(inscription.privkey);
  const pubkey = seckey.pub.rawX;
  const txinfo = await addressReceivedMoneyInThisTx(
    inscription.wallet_address,
    inscription.network
  );

  const [txid, vout, value] = txinfo;
  if (
    typeof txid !== "string" ||
    typeof vout !== "number" ||
    typeof value !== "number"
  ) {
    // Handle the case where any of the values are undefined.
    // You could throw an error or perform some other action based on your application's logic.
    throw new Error(
      "Failed to retrieve transaction details from the funding address."
    );
  }
  console.log({ inscription, txinfo });
  const script = [pubkey, "OP_CHECKSIG"];

  // Assuming your hex string payload is defined like this:
  const dataHex = inscription.hex; // Hexadecimal for "Hello world"const dataHex = "148fde9d01143a";
  const dataBuffer = Buffer.from(dataHex, "hex");

  // Build the script
  const rune_script = bitcoin.script.compile([
    bitcoin.opcodes.OP_RETURN,
    bitcoin.script.number.encode(13), // Correct way to push the number 13
    dataBuffer,
  ]);

  console.log(rune_script.toString("hex"));

  //   {
  //       "value": 0.00000000,
  //       "n": 0,
  //       "scriptPubKey": {
  //         "asm": "OP_RETURN 13 148fde9d01143a",
  //         "desc": "raw(6a5d07148fde9d01143a)#2zy958se",
  //         "hex": "6a5d07148fde9d01143a",
  //         "type": "nulldata"
  //       }
  // },

  const redeemtx = Tx.create({
    vin: [
      {
        txid,
        vout,
        prevout: {
          value,
          scriptPubKey: Address.toScriptPubKey(inscription.wallet_address),
        },
        witness: [],
      },
    ],
    vout: [
      {
        value: 0,
        scriptPubKey: rune_script,
      },
      {
        value: 500,
        scriptPubKey: Address.toScriptPubKey(inscription.receive_address),
      },
    ],
  });

  console.dir(redeemtx.vout[0], { depth: null });

  console.dir(redeemtx.vout[1], { depth: null });
  const sig = Signer.taproot.sign(seckey.raw, redeemtx, 0, {
    extension: inscription.leaf,
  });
  redeemtx.vin[0].witness = [sig, script, inscription.cblock];
  const rawtx = Tx.encode(redeemtx).hex;
  console.log({ rawtx }, "INS TX");
  //   throw Error("INS TEST");
  const txid_inscription = await pushBTCpmt(rawtx, inscription.network);

  console.log("INSCRIPTION TX BROADCASTED: ", txid_inscription);
  inscription.txid = txid_inscription;
  inscription.output = txid_inscription + ":" + "0";

  inscription.status = "inscribed";
  await (inscription as any).save();

  return inscription;
}

/**
 * GET handler for the inscribe route.
 * Processes the payment and creates transactions for the inscriptions.
 * @param {NextRequest} req - The incoming request object.
 * @returns {NextResponse} A Next.js response object with the transaction details or an error message.
 */
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const cancelOrders = await RuneOrder.countDocuments({
      status: "payment pending",
    });
    if (cancelOrders) {
      // Call the function
      await cancelOldPendingPayments().catch(console.error);
    }

    const pendingOrders = await RuneOrder.countDocuments({
      status: "payment received",
    });

    console.log({ pendingOrders });

    let txids = [];
    for (let i = 0; i <= Math.min(5, pendingOrders); i++) {
      const { order, inscriptions } = await findOrder();

      if (!order || !inscriptions) {
        return NextResponse.json({
          message: "No Pending Orders Have received Payment",
        });
      }

      // Loop through each inscription and process them
      for (const inscription of inscriptions) {
        const updatedInscription = await processInscription(inscription);
        console.log(
          "Inscription Processed: ",
          updatedInscription.inscription_id
        );
        txids.push(inscription.txid);
        // Further actions can be taken with updatedInscription if needed
      }

      order.status = "inscribed";
      await Activity.updateOne(
        { order_id: order.order_id },
        { status: "inscribed" }
      );
      await (order as any).save();
      await wait(1);
    }
    return NextResponse.json({ txids });
  } catch (error: any) {
    console.error("Catch Error: ", error);
    return NextResponse.json(
      { message: error.message || "Error creating inscribe order" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
