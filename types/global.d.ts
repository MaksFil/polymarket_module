interface Position {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  totalBought: number;
  realizedPnl: number;
  percentRealizedPnl: number;
  curPrice: number;
  redeemable: boolean;
  mergeable: boolean;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
  negativeRisk: boolean;
}

interface ClosedPosition {
  proxyWallet: string;
  asset: string;
  conditionId: string;
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
  timestamp: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  outcomeIndex: number;
  oppositeOutcome: string;
  oppositeAsset: string;
  endDate: string;
}

interface Activity {
  proxyWallet: string;
  timestamp: number;
  conditionId: string;
  type: 'TRADE' | 'SPLIT' | 'MERGE' | 'REDEEM' | 'REWARD' | 'CONVERSION' | 'MAKER_REBATE';
  size: number;
  usdcSize: number;
  transactionHash: string;
  price: number;
  asset: string;
  side: 'BUY' | 'SELL';
  outcomeIndex: number;
  title: string;
  slug: string;
  icon: string;
  eventSlug: string;
  outcome: string;
  name?: string;
  pseudonym?: string;
  bio?: string;
  profileImage?: string;
  profileImageOptimized?: string;
}

interface PortfolioInfo {
  success: boolean;
  positions?: Position[];
  totalValue?: number;
  totalPnL?: number;
  error?: string;
}

interface DepositAddresses {
  evm?: string;
  svm?: string;
  btc?: string;
  [key: string]: string | undefined;
}

interface SupportedAsset {
  chainId: string;
  chainName: string;
  token: {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
  };
  minCheckoutUsd: number;
}

interface DepositInfo {
  addresses: DepositAddresses;
  qrCodes: Record<string, string>;
  supportedAssets: SupportedAsset[];
}

interface PortfolioResponse 
{ 
  success: boolean; 
  portfolioNotUSDC?: number; 
  usdcBalance?: number; 
  totalPortfolio?: number; 
  todayPnLDollars?: number; 
  todayPnLPercent?: number; 
  positions?: Position[]; 
  error?: string; 
}

interface PnlPoint {
  timestamp: number;
  value: number;
}

interface PnlResponse {
  success: boolean;
  data?: {
    current: number;
    change: number;
    graph: PnlPoint[];
    graphMin: number;
    graphMax: number;
  };
  error?: string;
}

type CacheEntry = {
  data: ClosedPosition[];
  lastTimestamp: number;
  loading: boolean;
  pnlCache: Record<string, any>;
};

interface UpdateProfileParams {
  name?: string;
  file?: File;
}

interface ProfileResponse {
  success: boolean;
  config: { name: string; avatar: string };
}
