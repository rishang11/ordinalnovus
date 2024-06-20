"use client";
import React, { useState } from "react";
import { shortenString } from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import Link from "next/link";
import copy from "copy-to-clipboard";
import { addNotification } from "@/stores/reducers/notificationReducer";
import { FaCopy } from "react-icons/fa";
import CustomTab from "@/components/elements/CustomTab";
import Cbrc from "./Cbrc";
import { useDispatch } from "react-redux";
import MyInscriptions from "./MyInscriptions";

function AccountPage() {
  const dispatch = useDispatch();
  const walletDetails = useWalletAddress();
  // const router = useRouter();
  const [tab, setTab] = useState<
    "cbrc-20" | "inscriptions" | "activity" | "runes"
  >(process.env.NEXT_PUBLIC_NETWORK === "testnet" ? "runes" : "inscriptions");

  // useEffect(() => {
  //   if (!walletDetails?.connected) {
  //     return router.push("/");
  //   }
  // }, [walletDetails]);

  if (!walletDetails)
    return (
      <div className="center h-[70vh]">
        <p>Please connect wallet to continue</p>
      </div>
    );

  return (
    <div className="pt-16 text-white min-h-[80vh]">
      <div className="profile w-full flex flex-wrap items-center border-b-2 p-6 py-16 border-gray-700">
        <div className="w-[200px] relative rounded-full overflow-hidden border border-accent">
          <img src="/static-assets/images/pp.webp" />
        </div>
        {walletDetails && (
          <>
            {" "}
            <div className="pl-4">
              <div className="text-white text-sm hidden lg:block">
                <div
                  className="flex justify-start items-center border border-accent bg-blue-500 bg-opacity-10 hover:bg-opacity-20 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                  onClick={() => {
                    copy(walletDetails?.ordinal_address + "");
                    dispatch(
                      addNotification({
                        id: new Date().valueOf(),
                        message: "Address Copied",
                        open: true,
                        severity: "success",
                      })
                    );
                  }}
                >
                  <span>{walletDetails?.ordinal_address}</span>
                  <FaCopy className="ml-2" />
                </div>
                {walletDetails &&
                  walletDetails.ordinal_address !==
                    walletDetails.cardinal_address && (
                    <div
                      className="flex justify-start items-center border border-accent bg-blue-500 bg-opacity-10 hover:bg-opacity-20 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                      onClick={() => {
                        copy(walletDetails?.cardinal_address + "");
                        dispatch(
                          addNotification({
                            id: new Date().valueOf(),
                            message: "Address Copied",
                            open: true,
                            severity: "success",
                          })
                        );
                      }}
                    >
                      <span>{walletDetails?.cardinal_address}</span>
                      <FaCopy className="ml-2" />
                    </div>
                  )}
              </div>
              <div className="text-gray-400 text-xs lg:hidden w-full">
                <div
                  className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                  onClick={() => {
                    copy(walletDetails?.ordinal_address + "");
                    dispatch(
                      addNotification({
                        id: new Date().valueOf(),
                        message: "Address Copied",
                        open: true,
                        severity: "success",
                      })
                    );
                  }}
                >
                  <span>
                    {shortenString(walletDetails?.ordinal_address || "")}
                  </span>
                  <FaCopy className="ml-2" />
                </div>
                {walletDetails &&
                  walletDetails.cardinal_address !==
                    walletDetails.ordinal_address && (
                    <div
                      className="flex justify-start items-center bg-slate-700 tracking-widest px-4 py-2 rounded cursor-pointer mb-2"
                      onClick={() => {
                        copy(walletDetails?.cardinal_address + "");
                        dispatch(
                          addNotification({
                            id: new Date().valueOf(),
                            message: "Address Copied",
                            open: true,
                            severity: "success",
                          })
                        );
                      }}
                    >
                      <span>
                        {shortenString(walletDetails?.cardinal_address || "")}
                      </span>
                      <FaCopy className="ml-2" />
                    </div>
                  )}
              </div>
            </div>
          </>
        )}
      </div>
      <div className="pb-6 py-16 flex justify-center lg:justify-start  items-center">
        <CustomTab
          tabsData={[
            { label: "Inscriptions", value: "inscriptions" },
            { label: "CBRC-20", value: "cbrc-20" },
            // { label: "My Activity", value: "activity" },
          ]}
          currentTab={tab}
          onTabChange={(_, newTab) => setTab(newTab)}
        />
        {tab === "cbrc-20" && (
          <div className="py-4 md:py-0 flex-1 md:flex md:justify-center lg:justify-end">
            <Link href="/crafter">
              <p className="w-full md:w-auto px-4 py-2 rounded-lg font-bold hover:bg-yellow-500 transition-all bg-yellow-400 text-yellow-900">
                Create Transfer Inscription
              </p>
            </Link>
          </div>
        )}
      </div>{" "}
      <div className="">{tab === "cbrc-20" ? <Cbrc /> : <></>}</div>
      {/* {tab === "activity" && (
        <MySales address={walletDetails?.ordinal_address || ""} />
      )} */}
      {tab === "inscriptions" && <MyInscriptions />}
      {/* {tab === "runes" && <Runes />} */}
    </div>
  );
}

export default AccountPage;
