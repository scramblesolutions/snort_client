import "./ProfilePage.css";

import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBolt, faGear, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";

import { formatShort } from "../Number";
import useProfile from "../feed/ProfileFeed";
import useZapsFeed from "../feed/ZapsFeed";
import { parseZap } from "../element/Zap";
import FollowButton from "../element/FollowButton";
import { extractLnAddress, parseId, hexToBech32 } from "../Util";
import Avatar from "../element/Avatar";
import Timeline from "../element/Timeline";
import Text from '../element/Text'
import LNURLTip from "../element/LNURLTip";
import Nip05 from "../element/Nip05";
import Copy from "../element/Copy";
import ProfilePreview from "../element/ProfilePreview";
import FollowersList from "../element/FollowersList";
import FollowsList from "../element/FollowsList";
import { RootState } from "../state/Store";
import { HexKey } from "../nostr";

enum ProfileTab {
    Notes = "Notes",
    Reactions = "Reactions",
    Followers = "Followers",
    Follows = "Follows"
};

export default function ProfilePage() {
    const params = useParams();
    const navigate = useNavigate();
    const id = useMemo(() => parseId(params.id!), [params.id]);
    const zapFeed = useZapsFeed(id)
    const zaps = useMemo(() => {
      return zapFeed.notes.map(parseZap).filter(z => z.valid && !z.e && z.p === id)
    }, [zapFeed.notes, id])
    const zapsTotal = zaps.reduce((acc, z) => acc + z.amount, 0)
    const user = useProfile(id)?.get(id);
    const loginPubKey = useSelector<RootState, HexKey | undefined>(s => s.login.publicKey);
    const follows = useSelector<RootState, HexKey[]>(s => s.login.follows);
    const isMe = loginPubKey === id;
    const [showLnQr, setShowLnQr] = useState<boolean>(false);
    const [tab, setTab] = useState(ProfileTab.Notes);
    const about = Text({ content: user?.about || '', tags: [], users: new Map() })

    useEffect(() => {
        setTab(ProfileTab.Notes);
    }, [params]);

    function username() {
        return (
            <div className="name">
                <h2>{user?.display_name || user?.name || 'Nostrich'}</h2>
                <Copy text={params.id || ""} />
                {user?.nip05 && <Nip05 nip05={user.nip05} pubkey={user.pubkey} />}
            </div>
        )
    }

    function bio() {
        const lnurl = extractLnAddress(user?.lud16 || user?.lud06 || "");
        return (
            <div className="details">
                <div>{about}</div>

                <div className="links">
                    {user?.website && (
                        <div className="website f-ellipsis">
                            <a href={user.website} target="_blank" rel="noreferrer">{user.website}</a>
                        </div>
                    )}

                    {lnurl && (
                        <div className="f-ellipsis lnurl-wrapper" onClick={(e) => setShowLnQr(true)}>
                            <FontAwesomeIcon color="var(--yellow)" icon={faBolt} size="lg" />
                            <span className="lnurl" >
                                {lnurl}
                            </span>
                            {zapsTotal > 0 && (
                              <div className="zaps-total">
                                {formatShort(zapsTotal)} sats
                              </div>
                            )}
                        </div>
                    )}
                </div>
                <LNURLTip svc={lnurl} show={showLnQr} onClose={() => setShowLnQr(false)} author={id} />
            </div>
        )
    }

    function tabContent() {
        switch (tab) {
            case ProfileTab.Notes:
              return <Timeline key={id} pubkeys={[id]} global={false} postsOnly={false} />;
            case ProfileTab.Follows: {
                if (isMe) {
                    return (
                        <>
                            <h4>Following {follows.length}</h4>
                            {follows.map(a => <ProfilePreview key={a} pubkey={a.toLowerCase()} options={{ about: false }} />)}
                        </>
                    );
                } else {
                    return <FollowsList pubkey={id} />;
                }
            }
            case ProfileTab.Followers: {
                return <FollowersList pubkey={id} />
            }
        }
    }

    function avatar() {
        return (
            <div className="avatar-wrapper">
              <Avatar user={user} />
            </div>
        )
    }

    function userDetails() {
        return (
            <div className="details-wrapper">
                {username()}
                {isMe ? (
                    <div className="btn btn-icon follow-button" onClick={() => navigate("/settings")}>
                        <FontAwesomeIcon icon={faGear} size="lg" />
                    </div>
                ) : <>
                    <div className="btn message-button" onClick={() => navigate(`/messages/${hexToBech32("npub", id)}`)}>
                        <FontAwesomeIcon icon={faEnvelope} size="lg" />
                    </div>
                    <FollowButton pubkey={id} />
                </>
                }
                {bio()}
            </div>
        )
    }

    return (
        <>
            <div className="profile flex">
                {user?.banner && <img alt="banner" className="banner" src={user.banner} />}
                {user?.banner ? (
                    <>
                        {avatar()}
                        {userDetails()}
                    </>
                ) : (
                    <div className="no-banner">
                        {avatar()}
                        {userDetails()}
                    </div>
                )}
            </div>
            <div className="tabs">
                {[ProfileTab.Notes, ProfileTab.Followers, ProfileTab.Follows].map(v => {
                    return <div className={`tab f-1${tab === v ? " active" : ""}`} key={v} onClick={() => setTab(v)}>{v}</div>
                })}
            </div>
            {tabContent()}
        </>
    )
}
