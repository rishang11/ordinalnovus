import React, { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import { useSignTx, useWalletAddress } from "bitcoin-wallet-adapter";
import CustomDialog from "./elements/CustomDialog";
import { FaThumbsUp } from "react-icons/fa6";
import {
  setNewActivity,
  setOpenPrepareWalletDialog,
} from "@/stores/reducers/generalReducer";
import { addNotification } from "@/stores/reducers/notificationReducer";
import mixpanel from "mixpanel-browser";
import getUnsignedDummyPSBT from "@/apiHelper/getUnsignedDummyUtxoPsbt";
import axios from "axios";
import { CircularProgress } from "@mui/material";

function PrepareWallet() {
  const [feeRate, setFeeRate] = useState(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);

  const fees = useSelector((state: RootState) => state.general.fees);
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();

  const [loading, setLoading] = useState<boolean>(false);

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const dispatch = useDispatch();
  const balanceData = useSelector(
    (state: RootState) => state.general.balanceData
  );

  const openDialog = useSelector(
    (state: RootState) => state.general.openPrepareWalletDialog
  );

  const [open, setOpen] = React.useState(false);

  //wallet
  const walletDetails = useWalletAddress();
  useEffect(() => {
    if (
      walletDetails?.connected &&
      balanceData?.balance &&
      //@ts-ignore
      balanceData?.dummyUtxos < 2
    ) {
      setOpen(true);
    }
  }, [balanceData, walletDetails]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    dispatch(setOpenPrepareWalletDialog(false));
  };

  const createDummyUtxoPSBT = useCallback(async () => {
    if (
      !walletDetails ||
      !walletDetails.cardinal_address ||
      !walletDetails.ordinal_address ||
      !walletDetails.wallet ||
      !walletDetails.cardinal_pubkey
    ) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Connect wallet to continue",
          open: true,
          severity: "error",
        })
      );
      return;
    }

    try {
      console.log({ feeRate }, "in CREATE_DUMMY_UTXO Function");
      setLoading(true);
      const result = await getUnsignedDummyPSBT({
        pay_address: walletDetails.cardinal_address,
        publickey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        fee_rate: feeRate,
        amount: 2,
      });

      if (result.ok && result.unsigned_psbt_base64) {
        mixpanel.track("Dummy Psbt Created", {
          action: "dummy", // Assuming 'result.for' is part of your response
          wallet: walletDetails.ordinal_address,
          // Additional properties if needed
        });
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: "Creating dummy UTXO",
            open: true,
            severity: "info",
          })
        );

        setUnsignedPsbtBase64(result.unsigned_psbt_base64);
      } else {
        throw Error(result.message);
      }

      return 0;
    } catch (e: any) {
      // Track error in buy attempt
      mixpanel.track("Error", {
        tag: `Buy Attempt Error`,
        message: e.message || e || "Error creating buy psbt",
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        ordinal_pubkey: walletDetails.ordinal_pubkey,
        cardinal_pubkey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        wallet_name: walletDetails.wallet,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: e.message || e,
          open: true,
          severity: "error",
        })
      );
    }
  }, [walletDetails, feeRate]);

  const broadcast = async (signedPsbt: string) => {
    try {
      const { data } = await axios.post("/api/v2/order/broadcast", {
        signed_psbt: signedPsbt,
        activity_tag: "prepare",
        user_address: walletDetails?.cardinal_address,
      });
      setLoading(false);

      dispatch(setNewActivity(true));
      // Track successful broadcast
      mixpanel.track("Broadcast Success", {
        action: "dummy_utxo", // Assuming 'action' is defined in your component
        txid: data.data.txid,
        pay_address: walletDetails?.cardinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.wallet,
        fee_rate: feeRate,

        // Additional properties if needed
      });

      window.open(
        `https://mempool.space/${
          process.env.NEXT_PUBLIC_NETWORK === "testnet" ? "testnet/" : ""
        }tx/${data.data.txid}`,
        "_blank"
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Broadcasted Dummy UTXO Tx Successfully`,
          open: true,
          severity: "success",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Wait for it to confirm before trying to buy.`,
          open: true,
          severity: "info",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Txid: ${data.data.txid}`,
          open: true,
          severity: "success",
        })
      );
      handleClose();
    } catch (err: any) {
      // Track error in broadcasting
      mixpanel.track("Error", {
        tag: `Broadcast Error Dummy`,
        message:
          err.response?.data?.message ||
          err.message ||
          err ||
          "Error broadcasting tx",
        ordinal_address: walletDetails?.ordinal_address,
        ordinal_pubkey: walletDetails?.ordinal_pubkey,
        cardinal_address: walletDetails?.cardinal_address,
        cardinal_pubkey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.ordinal_address,
        wallet_name: walletDetails?.wallet,
        // Additional properties if needed
      });
      setLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: err.response.data.message || "Error broadcasting tx",
          open: true,
          severity: "error",
        })
      );
    }
  };

  const signTx = useCallback(async () => {
    if (!walletDetails) {
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Connect wallet to proceed",
          open: true,
          severity: "warning",
        })
      );
      return;
    }
    let inputs = [];

    inputs.push({
      address: walletDetails.cardinal_address,
      publickey: walletDetails.cardinal_pubkey,
      sighash: 1,
      index: [0],
    });

    const options: any = {
      psbt: unsignedPsbtBase64,
      network: "Mainnet",
      action: "dummy",
      inputs,
    };
    // console.log(options, "OPTIONS");

    await sign(options);
  }, [unsignedPsbtBase64]);

  useEffect(() => {
    // Handling Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from wallet sign
      console.log("Sign Result:", result);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Tx signed successfully",
          open: true,
          severity: "success",
        })
      );

      if (result) {
        broadcast(result);
      }

      // Additional logic here
    }

    if (error) {
      mixpanel.track("Error", {
        tag: `wallet sign error dummy_utxo psbt`,
        message: error || "Wallet signing failed",
        ordinal_address: walletDetails?.ordinal_address,
        ordinal_pubkey: walletDetails?.ordinal_pubkey,
        cardinal_address: walletDetails?.cardinal_address,
        cardinal_pubkey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.ordinal_address,
        wallet_name: walletDetails?.wallet,
        // Additional properties if needed
      });
      console.error("Sign Error:", error);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error.message || "Wallet error occurred",
          open: true,
          severity: "error",
        })
      );
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setLoading(false);
  }, [result, error]);

  useEffect(() => {
    if (unsignedPsbtBase64) {
      signTx();
    }
  }, [unsignedPsbtBase64]);

  useEffect(() => {
    if (fees?.fastestFee) {
      setFeeRate(fees.fastestFee + 10);
      setDefaultFeerate(fees.fastestFee + 10);
    }
  }, [fees]);

  const content = (
    <div className="text-gray-300 text-justify">
      To enable transactions on our platform, your wallet must be prepared by
      creating a payment UTXO. This UTXO is utilized to ensure fully
      decentralized transactions, prioritizing the safety of your Ordinals
      during transfers.
      <br /> <br />
      It&apos;s important to remember{" "}
      <strong>that this UTXO remains in your wallet</strong> and will be used
      for fulfilling Ordinalnovus transactions in the future. Each time you go
      through this process, it permits you to make a number of concurrent
      purchases on our platform. If you engage in numerous concurrent
      transactions, you will need to undertake this process more frequently.
    </div>
  );

  const actions = [
    {
      node: (
        <div className="relative mx-2">
          <div className="bg-dark_violet_600 rounded cursor-pointer styled-button-wrapper my-2">
            <button
              className="red_transition p-2 w-full center"
              onClick={() => {
                handleClose();
              }}
            >
              <span>Not Now</span>
            </button>
          </div>
        </div>
      ),
    },
    {
      node: (
        <div className="relative mx-2">
          <div className="bg-dark_violet_600 rounded cursor-pointer styled-button-wrapper my-2">
            <button
              disabled={loading || signLoading}
              className="accent_transition p-2 w-full"
              onClick={createDummyUtxoPSBT}
            >
              <div className="center">
                {loading || signLoading ? (
                  <div className="text-white mr-3">
                    <CircularProgress color="inherit" size={10} />
                  </div>
                ) : (
                  <FaThumbsUp className="mr-2" />
                )}
                <span>Prepare My Wallet</span>
              </div>
            </button>
          </div>
        </div>
      ),
    },
  ];
  // console.log({ open, openDialog });
  return (
    <React.Fragment>
      <CustomDialog
        open={open || openDialog}
        handleClose={handleClose}
        title="Prepare Your Wallet"
        content={content}
        actions={actions}
      />
    </React.Fragment>
  );
}

export default PrepareWallet;
