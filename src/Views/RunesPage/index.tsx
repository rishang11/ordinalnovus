"use client";
import { fetchRunes } from "@/apiHelper/fetchRunes";
import updateOrder from "@/apiHelper/updateOrder";
import CustomButton from "@/components/elements/CustomButton";
import CustomInput from "@/components/elements/CustomInput";
import { AppDispatch, RootState } from "@/stores";
import { setNewActivity } from "@/stores/reducers/generalReducer";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { IRune } from "@/types/Runes";
import { fetchFees } from "@/utils";
import { CircularProgress } from "@mui/material";
import axios from "axios";
import { useSignTx, useWalletAddress } from "bitcoin-wallet-adapter";
import mixpanel from "mixpanel-browser";
import moment from "moment";
import React, { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";

import Slider from "react-slick";
function RunesPage() {
  const { loading: signLoading, result, error, signTx: sign } = useSignTx();
  const [customFee, setCustomFee] = useState(false);
  const [feeRate, setFeeRate] = useState<number>(0);
  const [defaultFeeRate, setDefaultFeerate] = useState(0);
  const [rep, setRep] = useState(1);
  const walletDetails = useWalletAddress();
  const fees = useSelector((state: RootState) => state.general.fees);
  const dispatch = useDispatch<AppDispatch>();

  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<IRune[]>([]);
  const [searchResult, setSearchResult] = useState<IRune[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<string>("block:-1");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const [searchLoading, setSearchLoading] = useState<boolean>(false);

  const [mintLoading, setMintLoading] = useState<boolean>(false);

  const [rune, setRune] = useState<IRune | null>(null);

  const [settings, setSettings] = useState({
    dots: false,
    arrows: true,
    infinite: false,
    slidesToShow: 5,
    slidesToScroll: 5,
    initialSlide: 0,
    loop: false,
    speed: 1000,
  });

  const [op, setOp] = useState("mint");

  const [unsignedPsbtBase64, setUnsignedPsbtBase64] = useState<string>("");
  const [action, setAction] = useState<string>("dummy");
  const [order_result, setorderresult] = useState<any | null>(null);

  const [txLink, setTxLink] = useState("");

  useEffect(() => {
    if (!walletDetails && fees) {
      setUnsignedPsbtBase64("");
      setorderresult(null);
    }
  }, [walletDetails, fees]);

  useEffect(() => {
    const shouldFetch =
      !fees ||
      !fees.lastChecked ||
      moment().diff(moment(fees.lastChecked), "minutes") >= 10;
    if (shouldFetch) {
      fetchFees(dispatch);
    }
  }, [dispatch]);

  useEffect(() => {
    if (fees?.fastestFee) {
      setFeeRate(fees.fastestFee + 10);
      setDefaultFeerate(fees.fastestFee + 10);
    }
  }, [fees]);

  useEffect(() => {
    const newSettings = {
      ...settings,
      beforeChange: async (current: number, next: number) => {
        // console.log("Current item index:", current);
        // console.log("Next item index:", next);
        // console.log("Total items:", data.length, "Current page:", page);

        const itemsLeft = data.length - current;

        // console.log("Items left before the end of data:", itemsLeft);

        if (itemsLeft <= 15 && current < data.length - 1) {
          // console.log("Changing to the next page...");
          handlePageChange(page + 1);
        }
      },
    };

    setSettings(newSettings);
  }, [data, page]); // Add other dependencies

  const fetchData = useCallback(async () => {
    {
      if (search) setSearchLoading(true);
      // setLoading(true);
      const result = await fetchRunes({
        page,
        page_size: search ? 5 : pageSize,
        sort,
        name: search,
      });
      if (result && result.data) {
        if (!data.length)
          setRune(result.data.runes.filter((a) => (a.id = "1:0"))[0]);
        if (!search) {
          setData((prevData) => [...prevData, ...result.data.runes]);
          setTotalCount(result.data.pagination.total);
        } else {
          setSearchResult(result.data.runes);
          if (result.data.runes.length == 0) {
            //@ts-ignore
            setRune({ name: search, mintable: true });
          }
        }
        setLoading(false);
        setSearchLoading(false);
      }
    }
  }, [sort, page, pageSize, search]);

  const updateSliderSettings = () => {
    const width = window.innerWidth;
    const slidesToShow = width > 1024 ? 5 : width > 768 ? 3 : 1;
    const slidesToScroll = width > 1024 ? 5 : width > 768 ? 3 : 1; // Customize breakpoints as needed
    setSettings((prev) => ({ ...prev, slidesToShow, slidesToScroll }));
  };

  useEffect(() => {
    window.addEventListener("resize", updateSliderSettings);
    updateSliderSettings(); // Initial settings update on component mount

    return () => {
      window.removeEventListener("resize", updateSliderSettings);
    };
  }, []);

  useEffect(() => {
    fetchData(); // Fetch data on mount and when dependencies change

    // const interval = setInterval(() => {
    //   fetchData(); // Fetch data every 10 seconds
    // }, 120000);

    // return () => clearInterval(interval); // Clear interval on unmount
  }, [sort, page, pageSize, search]);

  const handlePageChange = (value: number) => {
    setPage(value);
  };

  const handleUpload = async () => {
    if (!walletDetails || !walletDetails?.ordinal_address) {
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
      if (!rune || !feeRate) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: " Rune or Fee is missing",
            open: true,
            severity: "error",
          })
        );
        return;
      }

      if (rep > 25) {
        dispatch(
          addNotification({
            id: new Date().valueOf(),
            message: " Mint less amount",
            open: true,
            severity: "error",
          })
        );
        return;
      }

      setMintLoading(true);

      const BODY = {
        receive_address: walletDetails?.ordinal_address,
        payment_address: walletDetails?.cardinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        fee_rate: feeRate,
        wallet: walletDetails?.wallet,
        network: process.env.NEXT_PUBLIC_NETWORK,
        ordinal_publickey: walletDetails.ordinal_pubkey,
        cardinal_publickey: walletDetails.cardinal_pubkey,
        tick: rune.name,
        rep,
      };

      const url = "/api/v2/runes/mint";
      const { data } = await axios.post(url, BODY);
      console.log({ data }, "TOKEN");

      setUnsignedPsbtBase64(data.psbt);
      setorderresult(data);

      setMintLoading(false);
      mixpanel.track("Mint Runes Psbt Created", {
        order_id: data.tokens[0].order_id,
        wallet: walletDetails?.ordinal_address,
        tick: rune.name,
        op,
      });
    } catch (error: any) {
      console.error("Error uploading files:", error);
      mixpanel.track("Error", {
        ordinal_address: walletDetails.ordinal_address,
        cardinal_address: walletDetails.cardinal_address,
        ordinal_pubkey: walletDetails.ordinal_pubkey,
        cardinal_pubkey: walletDetails.cardinal_pubkey,
        wallet: walletDetails.wallet,
        wallet_name: walletDetails.wallet,
        message: error.response?.data?.message || error.message,
        tag: `mint Runes PSBT Error`,
        // Additional properties if needed
      });
      setMintLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: error.response?.data?.message || error.message,
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
      network:
        process.env.NEXT_PUBLIC_NETWORK === "testnet" ? "Testnet" : "Mainnet",
      action: "dummy",
      inputs,
    };
    // console.log(options, "OPTIONS");

    await sign(options);
  }, [action, unsignedPsbtBase64]);

  const broadcast = async (signedPsbt: string) => {
    try {
      console.log("BROADCASTING...");
      const broadcast_res = await updateOrder(
        order_result.tokens[0].order_id,
        signedPsbt,
        true
      );
      setMintLoading(false);

      dispatch(setNewActivity(true));
      // Track successful broadcast
      mixpanel.track("Broadcast Success", {
        action: action, // Assuming 'action' is defined in your component
        txid: broadcast_res.txid,
        pay_address: walletDetails?.cardinal_address,
        receive_address: walletDetails?.ordinal_address,
        publickey: walletDetails?.cardinal_pubkey,
        wallet: walletDetails?.wallet,
        fee_rate: feeRate,
        // Additional properties if needed
      });
      setUnsignedPsbtBase64("");
      setorderresult(null);
      setRep(1);
      window.open(
        `https://mempool.space/${
          process.env.NEXT_PUBLIC_NETWORK ? "testnet/" : ""
        }tx/${broadcast_res.txid}`,
        "_blank"
      );

      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Broadcasted ${action} Tx Successfully`,
          open: true,
          severity: "success",
        })
      );
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: `Txid: ${broadcast_res.txid}`,
          open: true,
          severity: "success",
        })
      );
    } catch (err: any) {
      // Track error in broadcasting
      mixpanel.track("Error", {
        tag: `Broadcast Error ${action}`,
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
      setMintLoading(false);
      dispatch(
        addNotification({
          id: new Date().valueOf(),
          message: "Error broadcasting tx",
          open: true,
          severity: "error",
        })
      );
    }
  };

  useEffect(() => {
    // Handling Wallet Sign Results/Errors
    if (result) {
      // Handle successful result from wallet sign
      console.log("Sign Result:", result);
      // dispatch(
      //   addNotification({
      //     id: new Date().valueOf(),
      //     message: "Tx signed successfully",
      //     open: true,
      //     severity: "success",
      //   })
      // );

      if (result) {
        broadcast(result);
      }

      // Additional logic here
    }

    if (error) {
      mixpanel.track("Error", {
        tag: `wallet sign error ${action} psbt`,
        order_id: order_result.tokens[0].order_id,
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
      setMintLoading(false);
      // Additional logic here
    }

    // Turn off loading after handling results or errors
    setMintLoading(false);
  }, [result, error]);

  return (
    <div>
      {data && data?.length ? (
        <Slider {...settings}>
          {data.map((item: IRune, index) => (
            <div
              key={index}
              onClick={() => item?.mintable && setRune(item)}
              className="m-2 text-sm border-white border text-white font-bold tracking-wider"
            >
              <div
                className={`fill ${
                  item?.mintable ? " after:bg-green-700 " : " after:bg-red-700 "
                } `}
              >
                <p className="text-ellipsis overflow-clip">{item.name}</p>
              </div>
            </div>
          ))}
        </Slider>
      ) : (
        <>
          {loading ? (
            <div className="text-white min-h-screen w-full center">
              <CircularProgress size={20} color="inherit" />
            </div>
          ) : (
            <>No Runes Found</>
          )}
        </>
      )}

      <div className="bg-red-700 my-3 px-6 py-2 rounded text-red-100 font-bold ">
        This is a BETA Feature. It is still under development. Play at your own
        risk.{" "}
      </div>

      {rune && (
        <div className="mint flex flex-wrap items-start justify-center bg-gray-900 my-16 p-6">
          <div className="preview-control w-full flex justify-center md:w-6/12">
            <div className="w-full md:w-auto">
              <div className="bg-indigo-900 text-indigo-400 center text-ellipsis overflow-clip  w-full md:w-[500px] min-h-[400px] ">
                {rune.name}
              </div>
              <div className="flex items-center justify-center space-x-2 my-3">
                <CustomInput
                  startAdornmentText="Mint"
                  endAdornmentText="times"
                  value={rep.toString()}
                  placeholder="Amount of Tokens"
                  onChange={(new_content) => setRep(Number(new_content))}
                  fullWidth
                  helperText={
                    rep <= 0 || rep > (rune?.cap ? rune?.cap - rune?.mints : 25)
                      ? `You can mint ${
                          rune?.cap ? rune?.cap - rune?.mints : 25
                        } set of runes at a time.`
                      : ""
                  }
                  error={
                    rep <= 0 || rep > (rune?.cap ? rune?.cap - rune?.mints : 25)
                  }
                  // className="flex-grow"
                />
              </div>

              {unsignedPsbtBase64 && order_result ? (
                <>
                  {txLink ? (
                    <CustomButton
                      loading={loading}
                      text={`Minted Successfully`}
                      hoverBgColor="hover:bg-accent_dark"
                      hoverTextColor="text-white"
                      bgColor="bg-accent"
                      textColor="text-white"
                      className="transition-all w-full rounded uppercase tracking-widest"
                      link={true}
                      href={txLink}
                      newTab={true}
                    />
                  ) : (
                    <div className="pt-3">
                      <p className="text-center pb-3">
                        SAT {order_result.total_fee}
                      </p>
                      <p className="text-center pb-3">
                        ${order_result.total_fees_in_dollars.toFixed(2)}
                      </p>
                      <div className="w-full">
                        <CustomButton
                          loading={loading || signLoading}
                          text={`Complete Payment`}
                          hoverBgColor="hover:bg-accent_dark"
                          hoverTextColor="text-white"
                          bgColor="bg-accent"
                          textColor="text-white"
                          className="transition-all w-full rounded uppercase tracking-widest"
                          onClick={() => signTx()} // Add this line to make the button functional
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {" "}
                  <div className="my-2">
                    <CustomButton
                      disabled={!rune || !rep}
                      loading={mintLoading}
                      text={`MINT ${rep} times`}
                      hoverBgColor="hover:bg-accent_dark"
                      hoverTextColor="text-white"
                      bgColor="bg-accent"
                      textColor="text-white"
                      className="transition-all w-full rounded uppercase tracking-widest"
                      onClick={() => handleUpload()} // Add this line to make the button functional
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="data w-full md:w-6/12">
            <div className="bg-secondary text-white rounded px-6 py-2 font-bold flex justify-between items-center text-sm">
              <p className="uppercase text-white text-lg">{rune.name}</p>
            </div>
            <div className="bg-secondary text-white rounded px-6 py-2 my-2 tracking-wider flex justify-between items-center text-sm">
              <p className="uppercase text-gray-400 font-bold">ID</p>
              <p>{rune.id}</p>
            </div>
            <div className="bg-secondary text-white rounded px-6 py-2 my-2 tracking-wider flex justify-between items-center text-sm">
              <p className="uppercase text-gray-400 font-bold">Block</p>
              <p>{rune.block}</p>
            </div>
            <div className="bg-secondary text-white rounded px-6 py-2 my-2 tracking-wider flex justify-between items-center text-sm">
              <p className="uppercase text-gray-400 font-bold">Minted</p>
              <p>{rune.mints}</p>
            </div>
            <div className="bg-secondary text-white rounded px-6 py-2 my-2 tracking-wider flex justify-between items-center text-sm">
              <p className="uppercase text-gray-400 font-bold">CAP</p>
              <p>{rune.cap}</p>
            </div>
            <hr className="my-6" />
            <div className="py-3">
              <p className="text-sm text-center ">
                Choose Transfer Speed (Fee Rate)
              </p>
              <div className="flex justify-between py-2">
                {new Array(3).fill(1).map((_, idx) => {
                  // Calculating feeRate for each speed option
                  let rate = defaultFeeRate;
                  if (idx === 0) {
                    rate = defaultFeeRate - 5; // Slow
                  } else if (idx === 1) {
                    rate = defaultFeeRate; // Fast
                  } else {
                    rate = defaultFeeRate + 10; // Fastest
                  }

                  return (
                    <div
                      onClick={() => {
                        setFeeRate(rate);

                        if (idx === 2) {
                          setCustomFee(true);
                        } else {
                          setCustomFee(false);
                        }
                      }}
                      className={`p-2 flex-1 ${
                        feeRate === rate
                          ? "border border-white cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      key={idx}
                    >
                      <p className="text-lg text-center">
                        {idx === 0 ? "Slow" : idx === 1 ? "Fast" : "Custom"}
                      </p>
                      <p className="text-xs text-center">{rate} s/vB</p>
                    </div>
                  );
                })}
              </div>
              {customFee ? (
                <div>
                  <CustomInput
                    value={feeRate.toString()}
                    placeholder="Fee Rate"
                    onChange={(fee) => setFeeRate(Number(fee))}
                    helperText={
                      feeRate < Math.min(10, defaultFeeRate - 40)
                        ? "Fee too low"
                        : feeRate > defaultFeeRate + 200
                        ? "Fee too high - make sure you are okay with it"
                        : ""
                    }
                    error={true}
                    endAdornmentText=" sats / vB"
                    startAdornmentText="Fee Rate"
                    fullWidth
                  />
                </div>
              ) : (
                <></>
              )}
            </div>

            <hr className="my-6" />
            <div className="flex items-center justify-center space-x-2 my-3">
              <CustomInput
                value={search}
                placeholder="Search Rune Name..."
                onChange={(new_content) => setSearch(new_content)}
                fullWidth
                icon={FaSearch}
                end={true}
                // className="flex-grow"
              />
            </div>

            <>
              {search && searchLoading ? (
                <div className="text-white min-h-[10vh] w-full center">
                  <CircularProgress size={20} color="inherit" />
                </div>
              ) : (
                <>
                  {" "}
                  {searchResult && searchResult.length > 0 && (
                    <div>
                      {searchResult.map((item) => (
                        <p
                          onClick={() => item.mintable && setRune(item)}
                          className={`p-2 text-white ${
                            item.mintable
                              ? "bg-green-800 cursor-pointer"
                              : " bg-red-800 "
                          }`}
                          key={item.name}
                        >
                          {item.name}
                        </p>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          </div>
        </div>
      )}
    </div>
  );
}

export default RunesPage;
