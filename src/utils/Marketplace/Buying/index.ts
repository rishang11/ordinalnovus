import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import { AddressTxsUtxo, IListingState, UTXO } from "@/types";
import { IInscription } from "@/types";
import {
  doesUtxoContainInscription,
  getUtxosByAddress,
  getSellerOrdOutputValue,
  getTxHexById,
  mapUtxos,
  toXOnly,
} from "@/utils/Marketplace";
import { convertSatToBtc } from "@/utils";
import { satsToDollars } from "@/utils/Inscribe";
import { generateUnsignedCreateDummyUtxoPSBTBase64 } from "../GenerateDumyUtxoPsbt";
import { doesUtxoContainRunes } from "@/utils/serverUtils/doesUtxoContainRunes";
import calculateTxFee from "@/utils/api/calculateTxFee";

export const DUMMY_UTXO_MIN_VALUE = Number(580);
export const DUMMY_UTXO_VALUE = 1000;
const ORDINALS_POSTAGE_VALUE = Number(1000);
export const PLATFORM_FEE_ADDRESS =
  process.env.PLATFORM_FEE_ADDRESS ||
  "bc1qz9fuxrcrta2ut0ad76zlse09e98x9wrr7su7u6";
const BUYING_PSBT_SELLER_SIGNATURE_INDEX = 2;

interface Result {
  status: string;
  message: string;
  data: any;
}
export async function buyOrdinalPSBT(
  payerAddress: string,
  receiverAddress: string,
  inscription: IInscription,
  price: number,
  publickey: string,
  wallet: string,
  fee_rate: number
): Promise<Result> {
  const numberOfDummyUtxosToCreate = 2;
  bitcoin.initEccLib(secp256k1);
  let payerUtxos: AddressTxsUtxo[];
  let dummyUtxos: UTXO[] | null;
  let paymentUtxos: AddressTxsUtxo[] | undefined;

  try {
    payerUtxos = await getUtxosByAddress(payerAddress);
  } catch (e) {
    console.error(e);
    return Promise.reject("Mempool error");
  }

  dummyUtxos = await selectDummyUTXOs(payerUtxos);
  let minimumValueRequired: number;
  let vins: number;
  let vouts: number;

  if (!dummyUtxos || dummyUtxos.length < 2) {
    console.log("Lacking dummy utxos");
    minimumValueRequired = numberOfDummyUtxosToCreate * DUMMY_UTXO_VALUE;
    vins = 0;
    vouts = numberOfDummyUtxosToCreate;
  } else {
    minimumValueRequired =
      price + numberOfDummyUtxosToCreate * DUMMY_UTXO_VALUE;
    vins = 3;
    vouts = 4 + numberOfDummyUtxosToCreate;

    // add fee to minimumValueRequired

    let platformFeeValue = Math.floor(
      (minimumValueRequired * (0 + 100)) / 10000
    );
    // Assuming minimumValueRequired is in satoshis
    platformFeeValue = Math.max(Math.round(minimumValueRequired * 0.01), 4000);

    minimumValueRequired = minimumValueRequired + platformFeeValue;

    console.log({ minimumValueRequired });
  }

  try {
    const taprootAddress =
      receiverAddress.startsWith("bc1p") || receiverAddress.startsWith("tb1p");
    paymentUtxos = await selectPaymentUTXOs(
      payerUtxos,
      minimumValueRequired,
      vins,
      vouts,
      fee_rate,
      taprootAddress
    );

    let psbt: any = null;

    if (
      dummyUtxos &&
      dummyUtxos.length >= 2 &&
      inscription.address &&
      inscription.listed_price &&
      inscription.listed_seller_receive_address &&
      inscription.output_value
    ) {
      const listing = {
        seller: {
          makerFeeBp: 100,
          sellerOrdAddress: inscription.address,
          price: inscription.listed_price,
          ordItem: inscription,
          sellerReceiveAddress: inscription.listed_seller_receive_address,
          signedListingPSBTBase64: inscription.signed_psbt,
          tapInternalKey: inscription.tap_internal_key,
        },
        buyer: {
          takerFeeBp: 0,
          buyerAddress: payerAddress,
          buyerTokenReceiveAddress: receiverAddress,
          fee_rate,
          buyerPublicKey: publickey,
          unsignedBuyingPSBTBase64: "",
          buyerDummyUTXOs: dummyUtxos,
          buyerPaymentUTXOs: paymentUtxos,
        },
      };
      console.log("Generating payment PSBT");
      // console.log({ listing });

      psbt = await generateUnsignedBuyingPSBTBase64(listing, wallet);
      return {
        status: "success",
        message: "has valid utxo",
        data: {
          paymentUtxos,
          payerAddress,
          psbt,
          for: "buy",
        },
      };
    } else {
      if (paymentUtxos)
        psbt = await generateUnsignedCreateDummyUtxoPSBTBase64(
          payerAddress,
          publickey,
          paymentUtxos,
          fee_rate,
          wallet
        );
      console.log(psbt, "PSBT CREATED");
      return {
        status: "success",
        message: "doesnt have dummy UTXO",
        data: {
          paymentUtxos,
          payerAddress,
          numberOfDummyUtxosToCreate,
          dummyUtxos,
          psbt,
          for: "dummy",
        },
      };
    }
  } catch (e) {
    paymentUtxos = undefined;
    // console.error(e);
    return Promise.reject(e);
  }
}

async function selectDummyUTXOs(
  utxos: AddressTxsUtxo[]
): Promise<UTXO[] | null> {
  const result: UTXO[] = [];
  let counter = 0;

  for (const utxo of utxos) {
    if (utxo.value >= 580 && utxo.value <= 1000) {
      if (await doesUtxoContainInscription(utxo)) {
        continue;
      }
      if (await doesUtxoContainRunes(utxo)) {
        continue;
      }
      const mappedUtxo = await mapUtxos([utxo]);
      result.push(mappedUtxo[0]);
      counter++;

      if (counter === 2) {
        break;
      }
    }
  }

  return result;
}

export async function selectPaymentUTXOs(
  utxos: AddressTxsUtxo[],
  amount: number, // amount is expected total output (except tx fee)
  vinsLength: number,
  voutsLength: number,
  fee_rate: number,
  taprootAddress: boolean
) {
  const selectedUtxos: any = [];
  let selectedAmount = 0;

  // Sort descending by value, and filter out dummy utxos
  utxos = utxos
    .filter((x) => x.value > DUMMY_UTXO_VALUE)
    .sort((a, b) => b.value - a.value);

  for (const utxo of utxos) {
    // Never spend a utxo that contains an inscription for cardinal purposes
    if (await doesUtxoContainInscription(utxo)) {
      continue;
    }
    if (await doesUtxoContainRunes(utxo)) {
      continue;
    }
    selectedUtxos.push(utxo);
    selectedAmount += utxo.value;

    // console.log({
    //   minimumAmount: amount,
    //   selectedAmount,
    //   neededAmount:
    //     amount +
    //     calculateTxFee(
    //       vinsLength + selectedUtxos.length,
    //       voutsLength,
    //       fee_rate,
    //       taprootAddress ? "taproot" : "pwpkh", // Adjust based on actual use

    //       taprootAddress ? "taproot" : "pwpkh",
    //       1, // Include change output
    //       taprootAddress ? "taproot" : "pwpkh" // Change output type
    //     ),
    //   fee: calculateTxFee(
    //     vinsLength + selectedUtxos.length,
    //     voutsLength,
    //     fee_rate,
    //     taprootAddress ? "taproot" : "pwpkh", // Adjust based on actual use

    //     taprootAddress ? "taproot" : "pwpkh",
    //     1, // Include change output
    //     taprootAddress ? "taproot" : "pwpkh" // Change output type
    //   ),
    // });
    if (
      selectedAmount >=
      amount +
        calculateTxFee(
          vinsLength + selectedUtxos.length,
          voutsLength,
          fee_rate,
          taprootAddress ? "taproot" : "pwpkh", // Adjust based on actual use

          taprootAddress ? "taproot" : "pwpkh",
          1, // Include change output
          taprootAddress ? "taproot" : "pwpkh" // Change output type
        )
    ) {
      break;
    }
  }

  if (selectedAmount < amount) {
    throw `Your wallet needs ${Number(
      await satsToDollars(amount - selectedAmount)
    ).toFixed(2)} USD more`;
  }

  return selectedUtxos;
}
async function generateUnsignedBuyingPSBTBase64(
  listing: IListingState,
  wallet: string
) {
  wallet = wallet.toLowerCase();
  const psbt = new bitcoin.Psbt({ network: undefined });

  const collection = listing.seller.ordItem.official_collection;

  const taprootAddress = listing?.buyer?.buyerAddress.startsWith("bc1p");
  const segwitAddress = listing?.buyer?.buyerAddress.startsWith("bc1q");
  const buyerPublicKey = listing?.buyer?.buyerPublicKey;
  if (
    !listing.buyer ||
    !listing.buyer.buyerAddress ||
    !listing.buyer.buyerTokenReceiveAddress
  ) {
    throw new Error("Buyer address is not set");
  }
  if (!listing.seller.ordItem.output_value) {
    throw Error("Inscription has no output value");
  }

  if (
    listing.buyer.buyerDummyUTXOs?.length !== 2 ||
    !listing.buyer.buyerPaymentUTXOs
  ) {
    throw new Error("Buyer address has not enough utxos");
  }

  let totalInput = 0;

  // Add two dummyUtxos
  for (const dummyUtxo of listing.buyer.buyerDummyUTXOs) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(dummyUtxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }
    const input: any = {
      hash: dummyUtxo.txid,
      index: dummyUtxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[dummyUtxo.vout];
        // input.witnessUtxo = {
        //   script: p2sh.output,
        //   value: dummyUtxo.value,
        // } as WitnessUtxo;
        if (!segwitAddress && (wallet === "xverse" || wallet === "magiceden"))
          input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx
        input.witnessUtxo = tx.outs[dummyUtxo.vout];
      }
    } else {
      // unisat
      input.witnessUtxo = tx.outs[dummyUtxo.vout];
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(buyerPublicKey, "hex")
      );
    }

    psbt.addInput(input);
    totalInput += dummyUtxo.value;
  }

  // Add dummy output
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value:
      listing.buyer.buyerDummyUTXOs[0].value +
      listing.buyer.buyerDummyUTXOs[1].value,
    //+
    // listing.seller.ordItem.output_value,
  });
  // Add ordinal output
  psbt.addOutput({
    address: listing.buyer.buyerTokenReceiveAddress,
    value: ORDINALS_POSTAGE_VALUE,
  });

  const { sellerInput, sellerOutput } = await getSellerInputAndOutput(listing);

  psbt.addInput(sellerInput);
  psbt.addOutput(sellerOutput);

  // Add payment utxo inputs
  for (const utxo of listing.buyer.buyerPaymentUTXOs) {
    const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));
    for (const output in tx.outs) {
      try {
        tx.setWitness(parseInt(output), []);
      } catch {}
    }

    const input: any = {
      hash: utxo.txid,
      index: utxo.vout,
      ...(taprootAddress && {
        nonWitnessUtxo: tx.toBuffer(),
      }),
    };

    if (!taprootAddress) {
      const redeemScript = bitcoin.payments.p2wpkh({
        pubkey: Buffer.from(listing.buyer.buyerPublicKey!, "hex"),
      }).output;
      const p2sh = bitcoin.payments.p2sh({
        redeem: { output: redeemScript },
      });

      if (wallet !== "unisat") {
        input.witnessUtxo = tx.outs[utxo.vout];
        // input.witnessUtxo = {
        //   script: p2sh.output,
        //   value: utxo.value,
        // } as WitnessUtxo;
        if (!segwitAddress && (wallet === "xverse" || wallet === "magiceden"))
          input.redeemScript = p2sh.redeem?.output;
      } else {
        // unisat wallet should not have redeemscript for buy tx
        input.witnessUtxo = tx.outs[utxo.vout];
      }
    } else {
      input.witnessUtxo = tx.outs[utxo.vout];
      input.tapInternalKey = toXOnly(
        tx.toBuffer().constructor(listing.buyer.buyerPublicKey, "hex")
      );
    }

    psbt.addInput(input);

    totalInput += utxo.value;
  }

  // Create a platform fee output
  let platformFeeValue = Math.floor((listing.seller.price * (0 + 100)) / 10000);
  // Assuming listing.seller.price is in satoshis
  platformFeeValue = Math.max(Math.round(listing.seller.price * 0.01), 4000);

  // platformFeeValue > DUMMY_UTXO_MIN_VALUE ? platformFeeValue : 580;

  console.log(platformFeeValue, "PLATFORM_FEE");
  if (platformFeeValue > 0) {
    psbt.addOutput({
      address: PLATFORM_FEE_ADDRESS,
      value: platformFeeValue,
    });
  }

  if (collection && collection?.royalty_address && collection?.royalty_bp) {
    const bp = collection.royalty_bp; // 300 represents 3% (since 100 basis points = 1%)

    // Calculate the royalty value based on the basis points
    let royaltyValue = Math.round((listing.seller.price * bp) / 10000);

    // Ensure the minimum royalty value is 2000 if the calculated value is less
    royaltyValue = Math.max(royaltyValue, 2000);

    console.log(royaltyValue, "ROYALTY_FEE");

    if (royaltyValue > 0) {
      psbt.addOutput({
        address: collection.royalty_address,
        value: royaltyValue,
      });
    }
  }

  // Create two new dummy utxo output for the next purchase
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });
  psbt.addOutput({
    address: listing.buyer.buyerAddress,
    value: DUMMY_UTXO_VALUE,
  });

  const fee = calculateTxFee(
    psbt.txInputs.length,
    psbt.txOutputs.length, // 2-dummy outputs
    listing.buyer.fee_rate,
    "pwpkh",
    taprootAddress ? "taproot" : "pwpkh"
  );

  const totalOutput = psbt.txOutputs.reduce(
    (partialSum, a) => partialSum + a.value,
    0
  );

  const changeValue = totalInput - totalOutput - fee;

  if (changeValue < 0) {
    throw `Your wallet needs ${Number(
      await satsToDollars(-changeValue)
    ).toFixed(2)} USD more`;
    throw `Your wallet address doesn't have enough funds to buy this inscription.
Price:      ${convertSatToBtc(listing.seller.price)} BTC
Required:   ${convertSatToBtc(totalOutput + fee)} BTC
Missing:    ${convertSatToBtc(-changeValue)} BTC`;
  }

  // Change utxo
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address: listing.buyer.buyerAddress,
      value: changeValue + listing.seller.ordItem.output_value,
    });
  }

  console.log({ totalInput, totalOutput, fee, changeValue });
  // console.dir(psbt, { depth: null });

  listing.buyer.unsignedBuyingPSBTBase64 = psbt.toBase64();
  listing.buyer.unsignedBuyingPSBTInputSize = psbt.data.inputs.length;
  return listing;
}

async function getSellerInputAndOutput(listing: IListingState) {
  if (!listing.seller.ordItem.output) {
    throw Error("Inscription has no output");
  }
  const [ordinalUtxoTxId, ordinalUtxoVout] =
    listing.seller.ordItem.output.split(":");
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(ordinalUtxoTxId));
  // No need to add this witness if the seller is using taproot
  if (!listing.seller.tapInternalKey) {
    for (let outputIndex = 0; outputIndex < tx.outs.length; outputIndex++) {
      try {
        tx.setWitness(outputIndex, []);
      } catch {}
    }
  }

  const sellerInput: any = {
    hash: ordinalUtxoTxId,
    index: parseInt(ordinalUtxoVout),
    nonWitnessUtxo: tx.toBuffer(),
    // No problem in always adding a witnessUtxo here
    witnessUtxo: tx.outs[parseInt(ordinalUtxoVout)],
  };
  // If taproot is used, we need to add the internal key
  if (listing.seller.tapInternalKey) {
    sellerInput.tapInternalKey = toXOnly(
      tx.toBuffer().constructor(listing.seller.tapInternalKey, "hex")
    );
    console.log(sellerInput.tapInternalKey.toString("hex"), "tik");
  }
  if (!listing.seller.ordItem.output_value) {
    throw Error("Inscription has no output value");
  }

  const ret = {
    sellerInput,
    sellerOutput: {
      address: listing.seller.sellerReceiveAddress,
      value: getSellerOrdOutputValue(
        listing.seller.price,
        listing.seller.makerFeeBp,
        listing.seller.ordItem.output_value
      ),
    },
  };

  return ret;
}

export function mergeSignedBuyingPSBTBase64(
  signedListingPSBTBase64: string,
  signedBuyingPSBTBase64: string
): string {
  console.log("[INFO] Initiating merging of signed PSBTs.");

  // Deserialize PSBTs from Base64
  console.log("[INFO] Deserializing seller PSBTs from Base64.");
  const sellerSignedPsbt = bitcoin.Psbt.fromBase64(signedListingPSBTBase64);

  console.log("[INFO] Deserializing buyer PSBTs from Base64.");
  const buyerSignedPsbt = bitcoin.Psbt.fromBase64(signedBuyingPSBTBase64);

  // Merge operations
  console.log("[INFO] Merging seller's signature into buyer's PSBT.");

  (buyerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[
    BUYING_PSBT_SELLER_SIGNATURE_INDEX
  ] = (sellerSignedPsbt.data.globalMap.unsignedTx as any).tx.ins[0];

  buyerSignedPsbt.data.inputs[BUYING_PSBT_SELLER_SIGNATURE_INDEX] =
    sellerSignedPsbt.data.inputs[0];

  console.log("[SUCCESS] Merging completed successfully.");

  // Return serialized PSBT
  console.log("[INFO] Serializing merged PSBT to Base64.");
  return buyerSignedPsbt.toBase64();
}
export { generateUnsignedCreateDummyUtxoPSBTBase64 };
