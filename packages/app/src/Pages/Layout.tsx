import "./Layout.css";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { FormattedMessage } from "react-intl";

import { RelaySettings } from "@snort/nostr";
import messages from "./messages";

import { bech32ToHex, randomSample, unixNowMs, unwrap } from "Util";
import Icon from "Icons/Icon";
import { RootState } from "State/Store";
import { init, setRelays } from "State/Login";
import { setShow, reset } from "State/NoteCreator";
import { System } from "System";
import ProfileImage from "Element/ProfileImage";
import useLoginFeed from "Feed/LoginFeed";
import { totalUnread } from "Pages/MessagesPage";
import useModeration from "Hooks/useModeration";
import { NoteCreator } from "Element/NoteCreator";
import { db } from "Db";
import useEventPublisher from "Feed/EventPublisher";
import { DefaultRelays, SnortPubKey } from "Const";
import SubDebug from "Element/SubDebug";
import { preload } from "Cache";
import { useDmCache } from "Hooks/useDmsCache";
import { mapPlanName } from "./subscribe";

export default function Layout() {
  const location = useLocation();
  const replyTo = useSelector((s: RootState) => s.noteCreator.replyTo);
  const isNoteCreatorShowing = useSelector((s: RootState) => s.noteCreator.show);
  const isReplyNoteCreatorShowing = replyTo && isNoteCreatorShowing;
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loggedOut, publicKey, relays, preferences, newUserKey, subscription } = useSelector(
    (s: RootState) => s.login
  );
  const [pageClass, setPageClass] = useState("page");
  const pub = useEventPublisher();
  useLoginFeed();

  const handleNoteCreatorButtonClick = () => {
    if (replyTo) {
      dispatch(reset());
    }
    dispatch(setShow(true));
  };

  const shouldHideNoteCreator = useMemo(() => {
    const hideOn = ["/settings", "/messages", "/new", "/login", "/donate", "/p/", "/e", "/subscribe"];
    return isReplyNoteCreatorShowing || hideOn.some(a => location.pathname.startsWith(a));
  }, [location, isReplyNoteCreatorShowing]);

  const shouldHideHeader = useMemo(() => {
    const hideOn = ["/login", "/new"];
    return hideOn.some(a => location.pathname.startsWith(a));
  }, [location]);

  useEffect(() => {
    if (location.pathname.startsWith("/login")) {
      setPageClass("");
    } else {
      setPageClass("page");
    }
  }, [location]);

  useEffect(() => {
    System.HandleAuth = pub.nip42Auth;
  }, [pub]);

  useEffect(() => {
    if (relays) {
      (async () => {
        for (const [k, v] of Object.entries(relays)) {
          await System.ConnectToRelay(k, v);
        }
        for (const [k, c] of System.Sockets) {
          if (!relays[k] && !c.Ephemeral) {
            System.DisconnectRelay(k);
          }
        }
      })();
    }
  }, [relays]);

  function setTheme(theme: "light" | "dark") {
    const elm = document.documentElement;
    if (theme === "light" && !elm.classList.contains("light")) {
      elm.classList.add("light");
    } else if (theme === "dark" && elm.classList.contains("light")) {
      elm.classList.remove("light");
    }
  }

  useEffect(() => {
    const osTheme = window.matchMedia("(prefers-color-scheme: light)");
    setTheme(
      preferences.theme === "system" && osTheme.matches ? "light" : preferences.theme === "light" ? "light" : "dark"
    );

    osTheme.onchange = e => {
      if (preferences.theme === "system") {
        setTheme(e.matches ? "light" : "dark");
      }
    };
    return () => {
      osTheme.onchange = null;
    };
  }, [preferences.theme]);

  useEffect(() => {
    // check DB support then init
    db.isAvailable().then(async a => {
      db.ready = a;
      if (a) {
        await preload();
      }
      console.debug(`Using db: ${a ? "IndexedDB" : "In-Memory"}`);
      dispatch(init());

      try {
        if ("registerProtocolHandler" in window.navigator) {
          window.navigator.registerProtocolHandler(
            "web+nostr",
            `${window.location.protocol}//${window.location.host}/%s`
          );
          console.info("Registered protocol handler for 'web+nostr'");
        }
      } catch (e) {
        console.error("Failed to register protocol handler", e);
      }
    });
  }, []);

  async function handleNewUser() {
    let newRelays: Record<string, RelaySettings> = {};

    try {
      const rsp = await fetch("https://api.nostr.watch/v1/online");
      if (rsp.ok) {
        const online: string[] = await rsp.json();
        const pickRandom = randomSample(online, 4);
        const relayObjects = pickRandom.map(a => [a, { read: true, write: true }]);
        newRelays = {
          ...Object.fromEntries(relayObjects),
          ...Object.fromEntries(DefaultRelays.entries()),
        };
        dispatch(
          setRelays({
            relays: newRelays,
            createdAt: unixNowMs(),
          })
        );
      }
    } catch (e) {
      console.warn(e);
    }

    const ev = await pub.addFollow([bech32ToHex(SnortPubKey), unwrap(publicKey)], newRelays);
    pub.broadcast(ev);
  }

  useEffect(() => {
    if (newUserKey === true) {
      handleNewUser().catch(console.warn);
    }
  }, [newUserKey]);

  if (typeof loggedOut !== "boolean") {
    return null;
  }
  return (
    <div className={pageClass}>
      {!shouldHideHeader && (
        <header>
          <div className="logo" onClick={() => navigate("/")}>
            <h1>Snort</h1>
            {subscription && (
              <small className="flex">
                <Icon name="diamond" size={10} className="mr5" />
                {mapPlanName(subscription.type)}
              </small>
            )}
          </div>

          <div>
            {publicKey ? (
              <AccountHeader />
            ) : (
              <button type="button" onClick={() => navigate("/login")}>
                <FormattedMessage {...messages.Login} />
              </button>
            )}
          </div>
        </header>
      )}
      <Outlet />

      {!shouldHideNoteCreator && (
        <>
          <button className="note-create-button" type="button" onClick={handleNoteCreatorButtonClick}>
            <Icon name="plus" size={16} />
          </button>
          <NoteCreator />
        </>
      )}
      {window.localStorage.getItem("debug") && <SubDebug />}
    </div>
  );
}

const AccountHeader = () => {
  const navigate = useNavigate();

  const { isMuted } = useModeration();
  const { publicKey, latestNotification, readNotifications } = useSelector((s: RootState) => s.login);
  const dms = useDmCache();

  const hasNotifications = useMemo(
    () => latestNotification > readNotifications,
    [latestNotification, readNotifications]
  );
  const unreadDms = useMemo(
    () =>
      publicKey
        ? totalUnread(
            dms.filter(a => !isMuted(a.pubkey)),
            publicKey
          )
        : 0,
    [dms, publicKey]
  );

  async function goToNotifications(e: React.MouseEvent) {
    e.stopPropagation();
    // request permissions to send notifications
    if ("Notification" in window) {
      try {
        if (Notification.permission !== "granted") {
          const res = await Notification.requestPermission();
          console.debug(res);
        }
      } catch (e) {
        console.error(e);
      }
    }
    navigate("/notifications");
  }

  return (
    <div className="header-actions">
      <div className="btn btn-rnd" onClick={() => navigate("/wallet")}>
        <Icon name="bitcoin" />
      </div>
      <div className="btn btn-rnd" onClick={() => navigate("/search")}>
        <Icon name="search" />
      </div>
      <div className="btn btn-rnd" onClick={() => navigate("/messages")}>
        <Icon name="envelope" />
        {unreadDms > 0 && <span className="has-unread"></span>}
      </div>
      <div className="btn btn-rnd" onClick={goToNotifications}>
        <Icon name="bell" />
        {hasNotifications && <span className="has-unread"></span>}
      </div>
      <ProfileImage pubkey={publicKey || ""} showUsername={false} />
    </div>
  );
};
