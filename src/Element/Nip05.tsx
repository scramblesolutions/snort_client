import { useQuery } from "react-query";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faSpinner, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

import './Nip05.css'
import { HexKey } from "Nostr";

interface NostrJson {
  names: Record<string, string>
}

async function fetchNip05Pubkey(name: string, domain: string) {
  if (!name || !domain) {
    return undefined;
  }
  try {
    const res = await fetch(`https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`);
    const data: NostrJson = await res.json();
    const match = Object.keys(data.names).find(n => {
      return n.toLowerCase() === name.toLowerCase();
    });
    return match ? data.names[match] : undefined;
  } catch (error) {
    return undefined
  }
}

const VERIFICATION_CACHE_TIME = 24 * 60 * 60 * 1000
const VERIFICATION_STALE_TIMEOUT = 10 * 60 * 1000

export function useIsVerified(pubkey: HexKey, nip05?: string) {
  const [name, domain] = nip05 ? nip05.split('@') : []
  const { isError, isSuccess, data } = useQuery(
    ['nip05', nip05],
    () => fetchNip05Pubkey(name, domain),
    {
      retry: false,
      retryOnMount: false,
      cacheTime: VERIFICATION_CACHE_TIME,
      staleTime: VERIFICATION_STALE_TIMEOUT,
    },
  )
  const isVerified = isSuccess && data === pubkey
  const cantVerify = isSuccess && data !== pubkey
  return { isVerified, couldNotVerify: isError || cantVerify }
}

export interface Nip05Params {
  nip05?: string,
  pubkey: HexKey
}

const Nip05 = (props: Nip05Params) => {
  const [name, domain] = props.nip05 ? props.nip05.split('@') : []
  const isDefaultUser = name === '_'
  const { isVerified, couldNotVerify } = useIsVerified(props.pubkey, props.nip05)

  return (
    <div className={`flex nip05${couldNotVerify ? " failed" : ""}`} onClick={(ev) => ev.stopPropagation()}>
      <div className="nick">
        {isDefaultUser ? (
          `${domain}`
        ) : `@${name}`}
      </div>
      <span className="badge">
        {isVerified && (
          <FontAwesomeIcon
            color={"var(--highlight)"}
            icon={faCircleCheck}
            size="xs"
          />
        )}
        {!isVerified && !couldNotVerify && (
          <FontAwesomeIcon
            color={"var(--fg-color)"}
            icon={faSpinner}
            size="xs"
          />
        )}
        {couldNotVerify && (
          <FontAwesomeIcon
            color={"var(--error)"}
            icon={faTriangleExclamation}
            size="xs"
          />
        )}
      </span>
    </div>
  )
}

export default Nip05
