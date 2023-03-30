import Dexie, { Table } from "dexie";
import { FullRelaySettings, HexKey, RawEvent, u256 } from "@snort/nostr";
import { MetadataCache } from "Cache";

export const NAME = "snortDB";
export const VERSION = 7;

export interface SubCache {
  id: string;
  ids: u256[];
  until?: number;
  since?: number;
}

export interface RelayMetrics {
  addr: string;
  events: number;
  disconnects: number;
  latency: number[];
}

export interface UsersRelays {
  pubkey: HexKey;
  relays: FullRelaySettings[];
}

const STORES = {
  users: "++pubkey, name, display_name, picture, nip05, npub",
  relays: "++addr",
  userRelays: "++pubkey",
  events: "++id, pubkey, created_at",
  dms: "++id, pubkey",
};

export class SnortDB extends Dexie {
  ready = false;
  users!: Table<MetadataCache>;
  relayMetrics!: Table<RelayMetrics>;
  userRelays!: Table<UsersRelays>;
  events!: Table<RawEvent>;
  dms!: Table<RawEvent>;

  constructor() {
    super(NAME);
    this.version(VERSION).stores(STORES);
  }

  isAvailable() {
    if ("indexedDB" in window) {
      return new Promise<boolean>(resolve => {
        const req = window.indexedDB.open("dummy", 1);
        req.onsuccess = () => {
          resolve(true);
        };
        req.onerror = () => {
          resolve(false);
        };
      });
    }
    return Promise.resolve(false);
  }
}

export const db = new SnortDB();
