/* eslint-disable @typescript-eslint/no-unused-vars */
import { EventKind, RequestBuilder, SystemInterface, TaggedNostrEvent } from "@snort/system";
import { TradeOffer, TradingPlatform } from ".";

const MostroOfferKind = 30_000 as EventKind;

export class MostroTrading implements TradingPlatform {
  #system: SystemInterface;

  constructor(
    system: SystemInterface,
    readonly pubkey: string,
  ) {
    this.#system = system;
  }

  async listOffers(): Promise<TradeOffer[]> {
    const rb = new RequestBuilder("list-offers");
    rb.withFilter().kinds([MostroOfferKind]).authors([this.pubkey]);

    const offers = (await this.#system.Fetch(rb)) as Array<TaggedNostrEvent>;
    return offers.map(v => {
      const order = JSON.parse(v.content) as NewOrder;
      return {
        side: order.kind === OrderKind.Buy ? "BUY" : "SELL",
      } as TradeOffer;
    });
  }
}

const enum MostroMessageAction {
  Order = "Order",
  TakeSell = "TakeSell",
  TakeBuy = "TakeBuy",
  PayInvoice = "PayInvoice",
  FiatSent = "FiatSent",
  Release = "Release",
  Cancel = "Cancel",
  CooperativeCancelInitiatedByYou = "CooperativeCancelInitiatedByYou",
  CooperativeCancelInitiatedByPeer = "CooperativeCancelInitiatedByPeer",
  DisputeInitiatedByYou = "DisputeInitiatedByYou",
  DisputeInitiatedByPeer = "DisputeInitiatedByPeer",
  CooperativeCancelAccepted = "CooperativeCancelAccepted",
  BuyerInvoiceAccepted = "BuyerInvoiceAccepted",
  SaleCompleted = "SaleCompleted",
  PurchaseCompleted = "PurchaseCompleted",
  HoldInvoicePaymentAccepted = "HoldInvoicePaymentAccepted",
  HoldInvoicePaymentSettled = "HoldInvoicePaymentSettled",
  HoldInvoicePaymentCanceled = "HoldInvoicePaymentCanceled",
  WaitingSellerToPay = "WaitingSellerToPay",
  WaitingBuyerInvoice = "WaitingBuyerInvoice",
  AddInvoice = "AddInvoice",
  BuyerTookOrder = "BuyerTookOrder",
  RateUser = "RateUser",
  CantDo = "CantDo",
  Received = "Received",
  Dispute = "Dispute",
  AdminCancel = "AdminCancel",
  AdminSettle = "AdminSettle",
}

interface MostroMessage<T> {
  version: number;
  order_id?: string;
  pubkey?: string;
  action: MostroMessageAction;
  content?: T;
}

const enum OrderKind {
  Buy = "Buy",
  Sell = "Sell",
}

const enum OrderStatus {
  Active = "Active",
  Canceled = "Canceled",
  CanceledByAdmin = "CanceledByAdmin",
  SettledByAdmin = "SettledByAdmin",
  CompletedByAdmin = "CompletedByAdmin",
  Dispute = "Dispute",
  Expired = "Expired",
  FiatSent = "FiatSent",
  SettledHoldInvoice = "SettledHoldInvoice",
  Pending = "Pending",
  Success = "Success",
  WaitingBuyerInvoice = "WaitingBuyerInvoice",
  WaitingPayment = "WaitingPayment",
  CooperativelyCanceled = "CooperativelyCanceled",
}

interface NewOrder {
  id?: string;
  kind: OrderKind;
  status: OrderStatus;
  amount: number;
  fiat_code: string;
  fiat_amount: number;
  payment_method: string;
  premium: number;
  master_buyer_pubkey?: string;
  master_seller_pubkey?: string;
  buyer_invoice?: string;
  created_at?: number;
}
