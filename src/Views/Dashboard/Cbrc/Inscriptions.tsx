import { fetchInscriptions } from "@/apiHelper/fetchInscriptions";
import CustomPaginationComponent from "@/components/elements/CustomPagination";
import CustomSearch from "@/components/elements/CustomSearch";
import InscriptionDisplay from "@/components/elements/InscriptionDisplay";
import { IInscription } from "@/types";
import { CircularProgress } from "@mui/material";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useCallback, useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";

function Inscriptions({ cbrcs }: any) {
  const [inscriptions, setInscriptions] = useState<IInscription[] | null>(null);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [page_size, setPage_size] = useState(20);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const walletDetails = useWalletAddress();
  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handlePageChange = (
    event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
  };
  const fetchWalletInscriptions = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        wallet: walletDetails?.ordinal_address,
        page_size: page_size,
        page,
        inscription_number: Number(search),
        sort: "inscription_number:-1",
        metaprotocol: "cbrc-20",
        // valid: true,
      };

      const result = await fetchInscriptions(params);
      if (result && result.data) {
        setInscriptions(result.data.inscriptions);

        setTotal(result.data.pagination.total);
        setLoading(false);
      }
    } catch (e: any) {
      setLoading(false);
    }
  }, [walletDetails, page, search]);

  useEffect(() => {
    if (walletDetails?.connected && walletDetails.ordinal_address) {
      fetchWalletInscriptions();
    }
  }, [walletDetails, page, search]);
  return (
    <div>
      <div>
        <div className="SortSearchPages py-6 flex flex-wrap justify-between">
          {
            <div className="w-full lg:w-auto flex justify-start items-center flex-wrap">
              <div className="w-full center pb-4 lg:pb-0 md:pl-4 lg:w-auto">
                <CustomSearch
                  placeholder="Inscription Number #"
                  value={search}
                  onChange={handleSearchChange}
                  icon={FaSearch}
                  end={true}
                  onIconClick={() => fetchWalletInscriptions()}
                />
              </div>
            </div>
          }
        </div>

        {total / page_size > 1 && (
          <div className="w-full lg:w-auto center">
            <CustomPaginationComponent
              count={Math.ceil(total / page_size)}
              onChange={handlePageChange}
              page={page}
            />
          </div>
        )}
        <div className="py-6">
          {inscriptions?.length ? (
            <InscriptionDisplay
              data={inscriptions}
              loading={loading}
              pageSize={page_size}
              refreshData={fetchWalletInscriptions}
              availableCbrcsBalance={cbrcs}
            />
          ) : (
            <>
              {loading ? (
                <>
                  {walletDetails ? (
                    <div className="text-white center py-16">
                      <CircularProgress size={20} color="inherit" />
                    </div>
                  ) : (
                    <div className="text-white center py-16">
                      Wallet not connected
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  You Don&apos;t have any valid transferrable CBRC Inscription{" "}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {total / page_size > 1 && (
        <div className="w-full lg:w-auto center">
          <CustomPaginationComponent
            count={Math.ceil(total / page_size)}
            onChange={handlePageChange}
            page={page}
          />
        </div>
      )}
    </div>
  );
}

export default Inscriptions;
