"use server";
import { AddressTxsUtxo, UTXO } from "bitcoin-wallet-adapter/dist/types/types";
import { DUMMY_UTXO_MIN_VALUE, DUMMY_UTXO_VALUE } from "./Buying";
import * as bitcoin from "bitcoinjs-lib";
import secp256k1 from "@bitcoinerlab/secp256k1";
import {
  doesUtxoContainInscription,
  
  getTxHexById,
  mapUtxos,
  toXOnly,
} from ".";
import calculateTxFee from "../api/calculateTxFee";
import { doesUtxoContainRunes } from "../serverUtils/doesUtxoContainRunes";

bitcoin.initEccLib(secp256k1);

/**
 * Creates a transaction input from a UTXO.
 * @param tx Transaction from which the UTXO originates.
 * @param utxo The UTXO to use as input.
 * @param walletType Type of wallet (determines specific logic to apply).
 * @param taproot Indicates whether the address is a Taproot address.
 * @param buyerPublicKey Optional buyer's public key for certain wallet types.
 * @returns A transaction input object.
 */
async function createInput(
  utxo: UTXO,
  wallet: string,
  taprootAddress: boolean,
  segwitAddress: boolean,
  buyerPublicKey?: string
): Promise<any> {
  const tx = bitcoin.Transaction.fromHex(await getTxHexById(utxo.txid));

  const input: any = {
    hash: utxo.txid,
    index: utxo.vout,
    ...(taprootAddress && {
      nonWitnessUtxo: utxo.tx.toBuffer(),
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
      input.witnessUtxo = tx.outs[utxo.vout];
      // input.witnessUtxo = {
      //   script: p2sh.output,
      //   value: dummyUtxo.value,
      // } as WitnessUtxo;
      if (!segwitAddress && (wallet === "xverse" || wallet === "magiceden"))
        input.redeemScript = p2sh.redeem?.output;
    } else {
      // unisat wallet should not have redeemscript for buy tx
      input.witnessUtxo = tx.outs[utxo.vout];
    }
  } else {
    // unisat
    input.witnessUtxo = utxo.tx.outs[utxo.vout];
    input.tapInternalKey = toXOnly(
      utxo.tx.toBuffer().constructor(buyerPublicKey, "hex")
    );
  }

  return input;
}

/**
 * Configures transaction outputs by adding a specified number of dummy UTXOs.
 * This approach allows dynamic adjustment based on the transaction's needs.
 * @param psbt PSBT to which outputs will be added.
 * @param address Address to receive the outputs.
 * @param numberOfDummyUtxosToCreate Number of dummy UTXOs to create, defining how many identical outputs to add.
 */
function configureOutputs(
  psbt: bitcoin.Psbt,
  address: string,
  numberOfDummyUtxosToCreate: number
): any {
  for (let i = 0; i < numberOfDummyUtxosToCreate; i++) {
    psbt.addOutput({
      address,
      value: DUMMY_UTXO_VALUE,
    });
  }
  return psbt;
}

export async function generateUnsignedCreateDummyUtxoPSBTBase64(
  address: string,
  buyerPublicKey: string | undefined,
  unqualifiedUtxos: AddressTxsUtxo[],
  fee_rate: number,
  wallet: string,
  numberOfDummyUtxosToCreate: number = 2
): Promise<string> {
  wallet = wallet?.toLowerCase();
  let psbt = new bitcoin.Psbt({
    network:
      process.env.NEXT_PUBLIC_NETWORK === "testnet"
        ? bitcoin.networks.testnet
        : undefined,
  });

  const [mappedUnqualifiedUtxos, recommendedFee] = await Promise.all([
    mapUtxos(unqualifiedUtxos),
    fee_rate,
  ]);

  // Loop the unqualified utxos until we have enough to create a dummy utxo
  let totalValue = 0;
  let paymentUtxoCount = 0;

  const taprootAddress =
    address.startsWith("bc1p") || address.startsWith("tb1p");

  const segwitAddress =
    address.startsWith("bc1q") || address.startsWith("tb1q");
  console.log("checking " + mappedUnqualifiedUtxos.length + " utxos");
  const addressTypes = new Array(paymentUtxoCount).fill(
    taprootAddress ? "taproot" : "pwpkh"
  );
  console.log({ addressTypes });
  for (const utxo of mappedUnqualifiedUtxos) {
    if (await doesUtxoContainInscription(utxo)) {
      console.log("found inscription in: ", utxo.txid + utxo.vout);
      console.log("ignoring btc: ", utxo.value / 100_000_000);
      continue;
    }
    if (await doesUtxoContainRunes(utxo)) {
      console.log("found runes in: ", utxo.txid + utxo.vout);
      console.log("ignoring btc: ", utxo.value / 100_000_000);
      continue;
    }
    const input = await createInput(
      utxo,
      wallet,
      taprootAddress,
      segwitAddress,
      buyerPublicKey
    );

    psbt.addInput(input);
    totalValue += utxo.value;
    paymentUtxoCount += 1;

    const fees = calculateTxFee(
      paymentUtxoCount,
      numberOfDummyUtxosToCreate, // 2-dummy outputs
      recommendedFee,

      taprootAddress ? "taproot" : "pwpkh",

      taprootAddress ? "taproot" : "pwpkh"
    );
    if (totalValue >= DUMMY_UTXO_VALUE * 2 + fees) {
      break;
    }
  }
  const finalFees = calculateTxFee(
    paymentUtxoCount,
    numberOfDummyUtxosToCreate,
    fee_rate,
    taprootAddress ? "taproot" : "pwpkh", // Adjust based on actual use

    taprootAddress ? "taproot" : "pwpkh",
    1, // Include change output
    taprootAddress ? "taproot" : "pwpkh" // Change output type
  );

  const changeValue = Math.ceil(
    totalValue - DUMMY_UTXO_VALUE * numberOfDummyUtxosToCreate - finalFees
  );

  console.log(
    `Total Value: ${totalValue}, Final Fees: ${finalFees}, Change Value: ${changeValue}`
  );

  // We must have enough value to create a dummy utxo and pay for tx fees
  if (changeValue < 0) {
    throw new Error(
      `You might have pending transactions or not enough fund to complete tx at the provided FeeRate`
    );
  }

  psbt = await configureOutputs(psbt, address, numberOfDummyUtxosToCreate);

  // to avoid dust
  if (changeValue > DUMMY_UTXO_MIN_VALUE) {
    psbt.addOutput({
      address,
      value: changeValue,
    });
  }

  console.log("psbt made");

  return psbt.toBase64();
}
