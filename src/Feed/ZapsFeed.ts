import { useMemo } from "react";
import { HexKey } from "Nostr";
import EventKind from "Nostr/EventKind";
import { Subscriptions } from "Nostr/Subscriptions";
import useSubscription from "./Subscription";

export default function useZapsFeed(pubkey: HexKey) {
  const sub = useMemo(() => {
    let x = new Subscriptions();
    x.Id = `zaps:${pubkey.slice(0, 12)}`;
    x.Kinds = new Set([EventKind.ZapReceipt]);
    x.PTags = new Set([pubkey]);
    return x;
  }, [pubkey]);

  return useSubscription(sub, { leaveOpen: true, cache: true });
}
