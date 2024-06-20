import { IBalanceData, IFeeInfo, IStats } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: {
  btc_price_in_dollar: number;
  fees: IFeeInfo | null;
  allowed_cbrcs: string[] | null;
  balanceData: IBalanceData | null;
  openPrepareWalletDialog: boolean;
  user: any;
  currency: String;
  new_activity: boolean;
  stats: IStats | null;
} = {
  btc_price_in_dollar: 0,
  fees: null,
  allowed_cbrcs: null,
  balanceData: null,
  openPrepareWalletDialog: false,
  user: null,
  currency: "USD",
  new_activity: false,
  stats: null,
};

const generalSlice = createSlice({
  name: "general",
  initialState,
  reducers: {
    setBTCPrice: (state, action: PayloadAction<number>) => {
      state.btc_price_in_dollar = action.payload;
    },
    setFees: (state, action: PayloadAction<IFeeInfo | null>) => {
      state.fees = action.payload;
    },
    setAllowedCbrcs: (state, action: PayloadAction<string[] | null>) => {
      state.allowed_cbrcs = action.payload;
    },
    setBalanceData: (state, action: PayloadAction<IBalanceData | null>) => {
      state.balanceData = action.payload;
    },
    setOpenPrepareWalletDialog: (state, action: PayloadAction<boolean>) => {
      state.openPrepareWalletDialog = action.payload;
    },
    setUser: (state, action: PayloadAction<any>) => {
      state.user = action.payload;
    },
    setCurrency: (state, action: PayloadAction<string>) => {
      state.currency = action.payload;
    },
    setNewActivity: (state, action: PayloadAction<boolean>) => {
      state.new_activity = action.payload;
    },
    setStats: (state, action: PayloadAction<IStats | null>) => {
      if (action.payload) {
        state.stats = {
          ...action.payload,
          updatedAt: new Date().getTime(),
        };
      } else {
        state.stats = null;
      }
    },
  },
});

export const {
  setBTCPrice,
  setFees,
  setAllowedCbrcs,
  setBalanceData,
  setOpenPrepareWalletDialog,
  setUser,
  setCurrency,
  setNewActivity,
  setStats,
} = generalSlice.actions;
export default generalSlice.reducer;
