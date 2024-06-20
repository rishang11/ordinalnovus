import { fetchActivities } from "@/apiHelper/fetchActivity";
import { IActivity } from "@/types";
import { Drawer, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { useWalletAddress } from "bitcoin-wallet-adapter";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FiActivity } from "react-icons/fi";
import ActivityTable from "./ActivityTable";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/stores";
import { setNewActivity } from "@/stores/reducers/generalReducer";

function Activity() {
  const new_activity = useSelector(
    (state: RootState) => state.general.new_activity
  );
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [page_size] = useState(10);
  const [sort] = useState<string>("createdAt:-1");
  const [activities, setActivities] = useState<IActivity[]>([]);
  const [hasMore, setHasMore] = useState(true);

  const toggleDrawer = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  const walletDetails = useWalletAddress();
  const isResetting = useRef(false);

  const fetchUserActivity = useCallback(
    async (reset = false) => {
      if (!walletDetails?.ordinal_address) {
        setHasMore(false);
        return;
      }

      const q: any = {
        addresses: [
          walletDetails.ordinal_address,
          walletDetails.cardinal_address,
        ],
        page: reset ? 1 : page,
        page_size,
        sort,
      };

      console.log({ q });

      setLoading(true);

      const result = await fetchActivities(q);

      if (result && result.data) {
        if (reset) {
          setActivities(result.data.activities);
          dispatch(setNewActivity(false));
        } else {
          setActivities((prevActivities) => [
            ...prevActivities,
            ...result.data.activities,
          ]);
        }
        console.log({
          reset,

          page,
          page_size,
          total: result.data.pagination.total,
          hasMore:
            (reset ? 1 : page) * page_size < result.data.pagination.total,
        });
        setHasMore(
          (reset ? 1 : page) * page_size < result.data.pagination.total
        );
      } else {
        setHasMore(false);
      }
      setLoading(false);
    },
    [sort, page_size, page, walletDetails, dispatch]
  );

  useEffect(() => {
    if (new_activity) {
      isResetting.current = true;
      setPage(1);
      fetchUserActivity(true);
    }
  }, [new_activity, fetchUserActivity]);

  useEffect(() => {
    // console.log({ isResetting, page });
    if (!walletDetails || !walletDetails.connected) {
      setActivities([]);
      setHasMore(false);
    }
    if (walletDetails && walletDetails.connected && !isResetting.current) {
      fetchUserActivity();
    } else if (isResetting.current) {
      isResetting.current = false;
    }
  }, [walletDetails, page, sort, page_size, fetchUserActivity]);

  const fetchMoreData = () => {
    // console.log("fetching more data...");
    setPage((prevPage) => prevPage + 1);
  };
  return (
    <div className="mx-3">
      <div className="mx-3">
        <ToggleButtonGroup
          color="secondary" // This sets the secondary color to the selected button
        >
          <ToggleButton
            value="true"
            onClick={toggleDrawer(true)}
            sx={{
              backgroundColor: "#0c082a",
              color: "secondary.main",
              "& .MuiSvgIcon-root": { fontSize: 28 }, // Adjust icon size as needed
            }}
          >
            <FiActivity />
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <Drawer open={open} anchor={"right"} onClose={toggleDrawer(false)}>
        <div className="max-w-[90vw] md:min-w-[60vw] 2xl:min-w-[40vw] text-gray-400 bg-[#0c082a] min-h-screen p-6">
          <h3 className="pb-12 text-3xl font-bold text-white">
            Activity{" "}
            <span className="text-sm px-3 py-1 bg-accent_dark text-white rounded">
              BETA
            </span>
          </h3>
          <ActivityTable
            activities={activities}
            fetchMoreData={fetchMoreData}
            hasMore={hasMore}
            loading={loading}
            myAddress={[
              walletDetails?.ordinal_address || "",
              walletDetails?.cardinal_address || "",
            ]}
          />
        </div>
      </Drawer>
    </div>
  );
}

export default Activity;
