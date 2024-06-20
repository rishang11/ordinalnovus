import { IInscription } from "@/types";
import React from "react";
import Link from "next/link";
import CardContent from "@/components/elements/CustomCardSmall/CardContent";

import { FaBitcoin, FaDollarSign } from "react-icons/fa6";
import { useSelector } from "react-redux";
import { RootState } from "@/stores";
import { calculateBTCCostInDollars, convertSatToBtc } from "@/utils";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import ListInscriptionCardButton from "../../ListInscriptionCardButton";
import { cbrcValid, myInscription } from "@/utils/validate";

interface CollectionCardProps {
  inscription: IInscription;
  refreshData?: any;
  availableCbrcsBalance?: any;
}

const ItemCard: React.FC<CollectionCardProps> = ({
  inscription,
  refreshData,
  availableCbrcsBalance,
}) => {
  const btcPrice = useSelector(
    (state: RootState) => state.general.btc_price_in_dollar
  );

  const allowed_cbrcs = useSelector(
    (state: RootState) => state.general.allowed_cbrcs
  );

  const walletDetails = useWalletAddress();
  return (
    <div
      // className={`relative p-6 md:w-6/12 lg:w-3/12 w-full ${
      //   inscription?.reinscriptions &&
      //   inscription?.reinscriptions.find((a) => a.valid) &&
      //   !inscription?.valid &&
      //   !inscription.cbrc_valid
      //     ? " hidden"
      //     : ""
      // }`}
      className={`relative p-6 md:w-6/12 lg:w-3/12 2xl:w-2/12 2xl:p-1 w-full `}
    >
      <div className="border xl:border-2 border-accent bg-secondary rounded-xl shadow-xl p-3">
        {/* {inscription.reinscriptions ? (
          <>
            <ReinscriptionCarousel
              data={inscription.reinscriptions}
              latest={inscription}
            />
          </>
        ) : (
          
        )} */}
        <Link href={`/inscription/${inscription.inscription_id}`}>
          <div className="content-div h-[300px] 2xl:h-[200px] rounded overflow-hidden relative cursor-pointer">
            {inscription?.version && inscription?.version > 1 && (
              <p
                className={`absolute bg-red-400 text-red-900 rounded font-bold  text-xs p-1 z-10 top-[5px] right-[5px]`}
              >
                V{inscription.version}
              </p>
            )}
            <CardContent
              inscriptionId={inscription.inscription_id}
              content_type={inscription.content_type}
              inscription={inscription}
            />
          </div>
        </Link>

        <div className={`h-[40%] flex flex-col justify-end `}>
          <div className="py-2 mb-2 center">
            <div className="flex-1">
              <h5 className=" text-sm font-bold tracking-tight text-white">
                #{inscription.inscription_number}
              </h5>
              <p className="text-gray-500 text-xs">
                {inscription?.tags && inscription?.tags[0]}
              </p>
            </div>
            {inscription.listed_price &&
            inscription.listed &&
            inscription.address !== walletDetails?.ordinal_address ? (
              <div>
                <div className="text-sm font-bold tracking-tight text-white flex items-center">
                  <div className="mr-2 text-bitcoin">
                    <FaBitcoin className="" />
                  </div>
                  <p className=" ">
                    {convertSatToBtc(inscription?.listed_price)}
                  </p>
                </div>
                {inscription.in_mempool ? (
                  <p className="text-gray-500 text-sm">In Mempool</p>
                ) : (
                  <div className="flex items-center text-gray-500 text-sm">
                    <div className="mr-2 text-bitcoin">
                      <FaDollarSign className="text-green-500" />
                    </div>{" "}
                    <p>
                      {calculateBTCCostInDollars(
                        convertSatToBtc(inscription?.listed_price),
                        btcPrice
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <></>
            )}
          </div>
          {inscription && inscription?.collection_item_name ? (
            <span className="bg-yellow-500 mb-2 rounded-md text-center text-xs py-1 px-3 font-bold text-yellow-900">
              {inscription.collection_item_name}
            </span>
          ) : (
            <span className="mb-2 rounded-md text-center text-xs py-3 px-3 font-bold text-yellow-900"></span>
          )}
          {inscription.address === walletDetails?.ordinal_address &&
          cbrcValid(inscription, allowed_cbrcs || []) &&
          myInscription(inscription, walletDetails?.ordinal_address || "") ? (
            (() => {
              const token =
                (inscription?.parsed_metaprotocol &&
                  inscription?.parsed_metaprotocol[2].split("=")[0]) ||
                "";

              const amount =
                (inscription?.parsed_metaprotocol &&
                  inscription?.parsed_metaprotocol[2].split("=")[1]) ||
                0;

              const price =
                availableCbrcsBalance?.find((a: any) => a.tick === token)
                  ?.price || 0;

              const fp = (price / btcPrice) * Number(amount) || 0;
              return (
                <ListInscriptionCardButton
                  data={inscription}
                  refreshData={refreshData}
                  fp={fp}
                />
              );
            })()
          ) : (
            <>
              {(!inscription.token || !inscription.valid) &&
                myInscription(
                  inscription,
                  walletDetails?.ordinal_address || ""
                ) && (
                  <ListInscriptionCardButton
                    data={inscription}
                    refreshData={refreshData}
                    // fp={fp}
                  />
                )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
