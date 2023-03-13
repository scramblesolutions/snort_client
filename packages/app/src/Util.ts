import * as secp from "@noble/secp256k1";
import { sha256 as hash } from "@noble/hashes/sha256";
import { bytesToHex } from "@noble/hashes/utils";
import { decode as invoiceDecode } from "light-bolt11-decoder";
import { bech32 } from "bech32";
import base32Decode from "base32-decode";
import { HexKey, TaggedRawEvent, u256, EventKind, encodeTLV, NostrPrefix } from "@snort/nostr";
import * as bip39 from "@scure/bip39";
import { wordlist } from "@scure/bip39/wordlists/english";
import { HDKey } from "@scure/bip32";

import { DerivationPath } from "Const";
import { MetadataCache } from "State/Users";

export const sha256 = (str: string) => {
  return secp.utils.bytesToHex(hash(str));
};

export async function openFile(): Promise<File | undefined> {
  return new Promise(resolve => {
    const elm = document.createElement("input");
    elm.type = "file";
    elm.onchange = (e: Event) => {
      const elm = e.target as HTMLInputElement;
      if (elm.files) {
        resolve(elm.files[0]);
      } else {
        resolve(undefined);
      }
    };
    elm.click();
  });
}

/**
 * Parse bech32 ids
 * https://github.com/nostr-protocol/nips/blob/master/19.md
 * @param id bech32 id
 */
export function parseId(id: string) {
  const hrp = ["note", "npub", "nsec"];
  try {
    if (hrp.some(a => id.startsWith(a))) {
      return bech32ToHex(id);
    }
  } catch (e) {
    // Ignore the error.
  }
  return id;
}

export function bech32ToHex(str: string) {
  try {
    const nKey = bech32.decode(str, 1_000);
    const buff = bech32.fromWords(nKey.words);
    return secp.utils.bytesToHex(Uint8Array.from(buff));
  } catch {
    return "";
  }
}

/**
 * Decode bech32 to string UTF-8
 * @param str bech32 encoded string
 * @returns
 */
export function bech32ToText(str: string) {
  try {
    const decoded = bech32.decode(str, 1000);
    const buf = bech32.fromWords(decoded.words);
    return new TextDecoder().decode(Uint8Array.from(buf));
  } catch {
    return "";
  }
}

/**
 * Convert hex note id to bech32 link url
 * @param hex
 * @returns
 */
export function eventLink(hex: u256) {
  return `/e/${hexToBech32(NostrPrefix.Note, hex)}`;
}

/**
 * Convert hex to bech32
 */
export function hexToBech32(hrp: string, hex?: string) {
  if (typeof hex !== "string" || hex.length === 0 || hex.length % 2 !== 0) {
    return "";
  }

  try {
    if (hrp === NostrPrefix.Note || hrp === NostrPrefix.PrivateKey || hrp === NostrPrefix.PublicKey) {
      const buf = secp.utils.hexToBytes(hex);
      return bech32.encode(hrp, bech32.toWords(buf));
    } else {
      return encodeTLV(hex, hrp as NostrPrefix);
    }
  } catch (e) {
    console.warn("Invalid hex", hex, e);
    return "";
  }
}

export function generateBip39Entropy(mnemonic?: string): Uint8Array {
  try {
    const mn = mnemonic ?? bip39.generateMnemonic(wordlist, 256);
    return bip39.mnemonicToEntropy(mn, wordlist);
  } catch (e) {
    throw new Error("INVALID MNEMONIC PHRASE");
  }
}

/**
 * Convert hex-encoded entropy into mnemonic phrase
 */
export function hexToMnemonic(hex: string): string {
  const bytes = secp.utils.hexToBytes(hex);
  return bip39.entropyToMnemonic(bytes, wordlist);
}

/**
 * Convert mnemonic phrase into hex-encoded private key
 * using the derivation path specified in NIP06
 * @param mnemonic the mnemonic-encoded entropy
 */
export function entropyToDerivedKey(entropy: Uint8Array): string {
  const masterKey = HDKey.fromMasterSeed(entropy);
  const newKey = masterKey.derive(DerivationPath);

  if (!newKey.privateKey) {
    throw new Error("INVALID KEY DERIVATION");
  }

  return secp.utils.bytesToHex(newKey.privateKey);
}

/**
 * Convert hex pubkey to bech32 link url
 */
export function profileLink(hex: HexKey) {
  return `/p/${hexToBech32(NostrPrefix.PublicKey, hex)}`;
}

/**
 * Reaction types
 */
export const Reaction = {
  Positive: "+",
  Negative: "-",
};

/**
 * Return normalized reaction content
 */
export function normalizeReaction(content: string) {
  switch (content) {
    case "-":
      return Reaction.Negative;
    case "👎":
      return Reaction.Negative;
    default:
      return Reaction.Positive;
  }
}

/**
 * Get reactions to a specific event (#e + kind filter)
 */
export function getReactions(notes: TaggedRawEvent[], id: u256, kind = EventKind.Reaction) {
  return notes?.filter(a => a.kind === kind && a.tags.some(a => a[0] === "e" && a[1] === id)) || [];
}

/**
 * Converts LNURL service to LN Address
 */
export function extractLnAddress(lnurl: string) {
  // some clients incorrectly set this to LNURL service, patch this
  if (lnurl.toLowerCase().startsWith("lnurl")) {
    const url = bech32ToText(lnurl);
    if (url.startsWith("http")) {
      const parsedUri = new URL(url);
      // is lightning address
      if (parsedUri.pathname.startsWith("/.well-known/lnurlp/")) {
        const pathParts = parsedUri.pathname.split("/");
        const username = pathParts[pathParts.length - 1];
        return `${username}@${parsedUri.hostname}`;
      }
    }
  }
  return lnurl;
}

export function unixNow() {
  return Math.floor(unixNowMs() / 1000);
}

export function unixNowMs() {
  return new Date().getTime();
}

/**
 * Simple debounce
 */
export function debounce(timeout: number, fn: () => void) {
  const t = setTimeout(fn, timeout);
  return () => clearTimeout(t);
}

export function dedupeByPubkey(events: TaggedRawEvent[]) {
  const deduped = events.reduce(
    ({ list, seen }: { list: TaggedRawEvent[]; seen: Set<HexKey> }, ev) => {
      if (seen.has(ev.pubkey)) {
        return { list, seen };
      }
      seen.add(ev.pubkey);
      return {
        seen,
        list: [...list, ev],
      };
    },
    { list: [], seen: new Set([]) }
  );
  return deduped.list as TaggedRawEvent[];
}

export function dedupeById(events: TaggedRawEvent[]) {
  const deduped = events.reduce(
    ({ list, seen }: { list: TaggedRawEvent[]; seen: Set<HexKey> }, ev) => {
      if (seen.has(ev.id)) {
        return { list, seen };
      }
      seen.add(ev.id);
      return {
        seen,
        list: [...list, ev],
      };
    },
    { list: [], seen: new Set([]) }
  );
  return deduped.list as TaggedRawEvent[];
}

export function unwrap<T>(v: T | undefined | null): T {
  if (v === undefined || v === null) {
    throw new Error("missing value");
  }
  return v;
}

export function randomSample<T>(coll: T[], size: number) {
  const random = [...coll];
  return random.sort(() => (Math.random() >= 0.5 ? 1 : -1)).slice(0, size);
}

export function getNewest(rawNotes: TaggedRawEvent[]) {
  const notes = [...rawNotes];
  notes.sort((a, b) => a.created_at - b.created_at);
  if (notes.length > 0) {
    return notes[0];
  }
}

export function tagFilterOfTextRepost(note: TaggedRawEvent, id?: u256): (tag: string[], i: number) => boolean {
  return (tag, i) =>
    tag[0] === "e" && tag[3] === "mention" && note.content === `#[${i}]` && (id ? tag[1] === id : true);
}

export function groupByPubkey(acc: Record<HexKey, MetadataCache>, user: MetadataCache) {
  return { ...acc, [user.pubkey]: user };
}

export function splitByUrl(str: string) {
  const urlRegex =
    /((?:http|ftp|https):\/\/(?:[\w+?.\w+])+(?:[a-zA-Z0-9~!@#$%^&*()_\-=+\\/?.:;',]*)?(?:[-A-Za-z0-9+&@#/%=~_|]))/i;

  return str.split(urlRegex);
}

export const delay = (t: number) => {
  return new Promise(resolve => {
    setTimeout(resolve, t);
  });
};

export interface InvoiceDetails {
  amount?: number;
  expire?: number;
  timestamp?: number;
  description?: string;
  descriptionHash?: string;
  paymentHash?: string;
  expired: boolean;
}

export function decodeInvoice(pr: string): InvoiceDetails | undefined {
  try {
    const parsed = invoiceDecode(pr);

    const amountSection = parsed.sections.find(a => a.name === "amount");
    const amount = amountSection ? Number(amountSection.value as number | string) : undefined;

    const timestampSection = parsed.sections.find(a => a.name === "timestamp");
    const timestamp = timestampSection ? Number(timestampSection.value as number | string) : undefined;

    const expirySection = parsed.sections.find(a => a.name === "expiry");
    const expire = expirySection ? Number(expirySection.value as number | string) : undefined;
    const descriptionSection = parsed.sections.find(a => a.name === "description")?.value;
    const descriptionHashSection = parsed.sections.find(a => a.name === "description_hash")?.value;
    const paymentHashSection = parsed.sections.find(a => a.name === "payment_hash")?.value;
    const ret = {
      amount: amount,
      expire: timestamp && expire ? timestamp + expire : undefined,
      timestamp: timestamp,
      description: descriptionSection as string | undefined,
      descriptionHash: descriptionHashSection ? bytesToHex(descriptionHashSection as Uint8Array) : undefined,
      paymentHash: paymentHashSection ? bytesToHex(paymentHashSection as Uint8Array) : undefined,
      expired: false,
    };
    if (ret.expire) {
      ret.expired = ret.expire < new Date().getTime() / 1000;
    }
    return ret;
  } catch (e) {
    console.error(e);
  }
}

export interface Magnet {
  dn?: string | string[];
  tr?: string | string[];
  xs?: string | string[];
  as?: string | string[];
  ws?: string | string[];
  kt?: string[];
  ix?: number | number[];
  xt?: string | string[];
  infoHash?: string;
  raw?: string;
}

/**
 * Parse a magnet URI and return an object of keys/values
 */
export function magnetURIDecode(uri: string): Magnet | undefined {
  try {
    const result: Record<string, string | number | number[] | string[] | undefined> = {
      raw: uri,
    };

    // Support 'magnet:' and 'stream-magnet:' uris
    const data = uri.trim().split("magnet:?")[1];

    const params = data && data.length > 0 ? data.split("&") : [];

    params.forEach(param => {
      const split = param.split("=");
      const key = split[0];
      const val = decodeURIComponent(split[1]);

      if (!result[key]) {
        result[key] = [];
      }

      switch (key) {
        case "dn": {
          (result[key] as string[]).push(val.replace(/\+/g, " "));
          break;
        }
        case "kt": {
          val.split("+").forEach(e => {
            (result[key] as string[]).push(e);
          });
          break;
        }
        case "ix": {
          (result[key] as number[]).push(Number(val));
          break;
        }
        case "so": {
          // todo: not implemented yet
          break;
        }
        default: {
          (result[key] as string[]).push(val);
          break;
        }
      }
    });

    // Convenience properties for parity with `parse-torrent-file` module
    let m;
    if (result.xt) {
      const xts = Array.isArray(result.xt) ? result.xt : [result.xt];
      xts.forEach(xt => {
        if (typeof xt === "string") {
          if ((m = xt.match(/^urn:btih:(.{40})/))) {
            result.infoHash = [m[1].toLowerCase()];
          } else if ((m = xt.match(/^urn:btih:(.{32})/))) {
            const decodedStr = base32Decode(m[1], "RFC4648-HEX");
            result.infoHash = [bytesToHex(new Uint8Array(decodedStr))];
          } else if ((m = xt.match(/^urn:btmh:1220(.{64})/))) {
            result.infoHashV2 = [m[1].toLowerCase()];
          }
        }
      });
    }

    if (result.xs) {
      const xss = Array.isArray(result.xs) ? result.xs : [result.xs];
      xss.forEach(xs => {
        if (typeof xs === "string" && (m = xs.match(/^urn:btpk:(.{64})/))) {
          if (!result.publicKey) {
            result.publicKey = [];
          }
          (result.publicKey as string[]).push(m[1].toLowerCase());
        }
      });
    }

    for (const [k, v] of Object.entries(result)) {
      if (Array.isArray(v)) {
        if (v.length === 1) {
          result[k] = v[0];
        } else if (v.length === 0) {
          result[k] = undefined;
        }
      }
    }
    return result;
  } catch (e) {
    console.warn("Failed to parse magnet link", e);
  }
}

export function chunks<T>(arr: T[], length: number) {
  const result = [];
  let idx = 0;
  let n = arr.length / length;
  while (n > 0) {
    result.push(arr.slice(idx, idx + length));
    idx += length;
    n -= 1;
  }
  return result;
}

export function findTag(e: TaggedRawEvent, tag: string) {
  const maybeTag = e.tags.find(evTag => {
    return evTag[0] === tag;
  });
  return maybeTag && maybeTag[1];
}
