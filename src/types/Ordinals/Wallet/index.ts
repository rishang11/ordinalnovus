export interface WalletDetails {
  cardinal_address: string;
  cardinal_pubkey: string;
  ordinal_address: string;
  ordinal_pubkey: string;
  wallet: "Leather" | "Xverse" | "MagicEden" | "Unisat";
  connected: boolean;
}

export interface WalletState {
  walletDetails: WalletDetails | null;
  lastWallet: string;
}
