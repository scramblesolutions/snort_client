export interface TradingPlatform {
  listOffers(): Promise<Array<TradeOffer>>;
}

export const enum TradeCurrency {
  BTC = "BTC",
  EUR = "EUR",
}

export interface TradeOffer {
  side: "BUY" | "SELL";
  currency: TradeCurrency;
  rate: number;
}
