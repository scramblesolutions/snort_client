import "./Profile.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mapEventToProfile } from "@snort/system";
import { useUserProfile } from "@snort/system-react";

import useEventPublisher from "@/Hooks/useEventPublisher";
import { openFile, debounce } from "@/SnortUtils";
import useFileUpload from "@/Upload";
import AsyncButton from "@/Element/AsyncButton";
import { UserCache } from "@/Cache";
import useLogin from "@/Hooks/useLogin";
import Icon from "@/Icons/Icon";
import Avatar from "@/Element/User/Avatar";
import { FormattedMessage, useIntl } from "react-intl";
import { ErrorOrOffline } from "@/Element/ErrorOrOffline";
import { LNURL, LNURLError } from '@snort/shared';
import messages from "@/Element/messages";
import { MaxAboutLength, MaxUsernameLength } from "@/Const";
import { fetchNip05Pubkey  } from "../../Nip05/Verifier";

export interface ProfileSettingsProps {
  avatar?: boolean;
  banner?: boolean;
}

export default function ProfileSettings(props: ProfileSettingsProps) {
  const navigate = useNavigate();
  const { formatMessage } = useIntl();
  const { publicKey: id, readonly } = useLogin(s => ({ publicKey: s.publicKey, readonly: s.readonly }));
  const user = useUserProfile(id ?? "");
  const { publisher, system } = useEventPublisher();
  const uploader = useFileUpload();
  const [error, setError] = useState<Error>();

  const [name, setName] = useState<string>();
  const [picture, setPicture] = useState<string>();
  const [banner, setBanner] = useState<string>();
  const [about, setAbout] = useState<string>();
  const [website, setWebsite] = useState<string>();
  const [nip05, setNip05] = useState<string>();
  const [lud16, setLud16] = useState<string>();
  const [nip05AddressValid, setNip05AddressValid] = useState<boolean>();
  const [invalidNip05AddressMessage, setInvalidNip05AddressMessage] = useState<null | string>();
  const [usernameValid, setUsernameValid] = useState<boolean>();
  const [invalidUsernameMessage, setInvalidUsernameMessage] = useState<null | string>();
  const [aboutValid, setAboutValid] = useState<boolean>();
  const [invalidAboutMessage, setInvalidAboutMessage] = useState<null | string>();
  const [lud16Valid, setLud16Valid] = useState<boolean>();
  const [invalidLud16Message, setInvalidLud16Message] = useState<null | string>();

  
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPicture(user.picture);
      setBanner(user.banner);
      setAbout(user.about);
      setWebsite(user.website);
      setNip05(user.nip05);
      setLud16(user.lud16);
    }
  }, [user]);

  useEffect(() => {
    return debounce(500,async () => {
      if(lud16){
          try {
              await new LNURL(lud16).load();
              setLud16Valid(true);
              setInvalidLud16Message("")
          }catch(e){
            setLud16Valid(false);
            if(e instanceof LNURLError)
              setInvalidLud16Message((e as LNURLError).message);
            else
              setInvalidLud16Message(formatMessage(messages.InvalidLud16));
          }
      }else{
        setInvalidLud16Message("")
      }
    })
  }, [lud16]);

  async function saveProfile() {
    // copy user object and delete internal fields
    const userCopy = {
      ...user,
      name,
      about,
      picture,
      banner,
      website,
      nip05,
      lud16,
    } as Record<string, string | number | undefined | boolean>;
    delete userCopy["loaded"];
    delete userCopy["created"];
    delete userCopy["pubkey"];
    delete userCopy["npub"];
    delete userCopy["deleted"];
    delete userCopy["zapService"];
    delete userCopy["isNostrAddressValid"];
    console.debug(userCopy);

    if (publisher) {
      const ev = await publisher.metadata(userCopy);
      system.BroadcastEvent(ev);

      const newProfile = mapEventToProfile(ev);
      if (newProfile) {
        await UserCache.update(newProfile);
      }
    }
  }

  async function uploadFile() {
    try {
      setError(undefined);
      const file = await openFile();
      if (file) {
        const rsp = await uploader.upload(file, file.name);
        if (typeof rsp?.error === "string") {
          throw new Error(`Upload failed ${rsp.error}`);
        }
        return rsp.url;
      }
    } catch (e) {
      if (e instanceof Error) {
        setError(e);
      }
    }
  }

  async function setNewBanner() {
    const rsp = await uploadFile();
    if (rsp) {
      setBanner(rsp);
    }
  }

  async function setNewAvatar() {
    const rsp = await uploadFile();
    if (rsp) {
      setPicture(rsp);
    }
  }

  async function onNip05Change(e: React.ChangeEvent<HTMLInputElement>){
    const Nip05Address = e.target.value;
    setNip05(Nip05Address)
    const Nip05AddressElements = Nip05Address?.split('@') ?? [];
    if (Nip05Address.length === 0) {
        setNip05AddressValid(false)
        setInvalidNip05AddressMessage("")
    }else if(Nip05AddressElements.length < 2){
        setNip05AddressValid(false)
        setInvalidNip05AddressMessage(formatMessage(messages.InvalidNip05Address))
    }
    else if(Nip05AddressElements.length === 2){
      nip05NostrAddressVerification(Nip05AddressElements.pop(), Nip05AddressElements.pop());
    }
    else{
      setNip05AddressValid(false)
    }
  }

  async function onLimitCheck(val:string, field:string){
    if(field === "username"){
      setName(val);
      if(val?.length >= MaxUsernameLength){
        setUsernameValid(false)
        setInvalidUsernameMessage(formatMessage(messages.UserNameLengthError))
      }else{
        setUsernameValid(true)
        setInvalidUsernameMessage("")
      }
    }
    else if(field === "about"){
      setAbout(val);
      if(val?.length >= MaxAboutLength){
        setAboutValid(false)
        setInvalidAboutMessage(formatMessage(messages.AboutLengthError))
      }else{
        setAboutValid(true)
        setInvalidAboutMessage("")
      }
    }
  }

  async function nip05NostrAddressVerification(nip05Domain: string | undefined, nip05Name: string| undefined) {
    try{
      const result = await fetchNip05Pubkey(nip05Name!,nip05Domain!);
      if(result){
        setNip05AddressValid(true);
      }else{
        setNip05AddressValid(false);
        setInvalidNip05AddressMessage(formatMessage(messages.InvalidNip05Address))
      }
    }catch(e){
      setNip05AddressValid(false)
      setInvalidNip05AddressMessage(formatMessage(messages.InvalidNip05Address))
    }
  }

  async function onLud16Change(address:string){
    setLud16(address)
  }

  function editor() {
    return (
      <div className="flex flex-col g24">
        <div className="flex flex-col w-max g8">
          <h4>
            <FormattedMessage defaultMessage="Name" id="HAlOn1" />
          </h4>
          <input
            className="w-max"
            type="text"
            value={name}
            onChange={e => onLimitCheck(e.target.value,"username")}
            disabled={readonly}
            maxLength={MaxUsernameLength}
          />
          <div>
            {usernameValid === false ? (
              <span className="error">{invalidUsernameMessage}</span>
              )
              : (<></>) 
            }
          </div>
        </div>
        <div className="flex flex-col w-max g8">
          <h4>
            <FormattedMessage defaultMessage="About" id="g5pX+a" />
          </h4>
          <textarea
            className="w-max"
            onChange={e => onLimitCheck(e.target.value,"about")}
            value={about}
            disabled={readonly} maxLength={MaxAboutLength}></textarea>
            <div>
            {aboutValid === false ? (
              <span className="error">{invalidAboutMessage}</span>
              )
              :  (<></>) 
            }
          </div>
        </div>
        <div className="flex flex-col w-max g8">
          <h4>
            <FormattedMessage defaultMessage="Website" id="JkLHGw" />
          </h4>
          <input
            className="w-max"
            type="text"
            value={website}
            onChange={e => setWebsite(e.target.value)}
            disabled={readonly}
          />
        </div>
        <div className="flex flex-col w-max g8">
          <h4>
            <FormattedMessage defaultMessage="Nostr Address" id="9pMqYs" />
          </h4>
          <div className="flex flex-col g8 w-max">
            <input
              type="text"
              className="w-max"
              value={nip05}
              onChange={e => onNip05Change(e)}
              disabled={readonly}
            />
            <div>
            {nip05AddressValid ? (
              <>
                <span className="success">
                  <FormattedMessage defaultMessage="NIP05 Verified" id="vw95kf" />
                </span>
              </>
            ) : (
              <span className="error">{invalidNip05AddressMessage}</span>
            )}
          </div>
            <small>
              <FormattedMessage
                defaultMessage="Usernames are not unique on Nostr. The nostr address is your unique human-readable address that is unique to you upon registration."
                id="5vMmmR"
              />
            </small>
            <div className="flex g12">
              <button className="flex items-center" type="button" onClick={() => navigate("/nostr-address")}>
                <FormattedMessage defaultMessage="Buy nostr address" id="MuVeKe" />
              </button>
              <button
                className="flex items-center secondary"
                type="button"
                onClick={() => navigate("/free-nostr-address")}>
                <FormattedMessage defaultMessage="Get a free one" id="vlbWtt" />
              </button>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-max g8">
          <h4>
            <FormattedMessage defaultMessage="Lightning Address" id="GSye7T" />
          </h4>
          <input
            className="w-max"
            type="text"
            value={lud16}
            onChange={e => onLud16Change(e.target.value.toLowerCase())}
            disabled={readonly}
          />
          <div>
            {lud16Valid === false ? (
              <span className="error">{invalidLud16Message}</span>
              )
              :  (<></>) 
            }
          </div>
        </div>
        <AsyncButton className="primary" onClick={() => saveProfile()} disabled={readonly}>
          <FormattedMessage defaultMessage="Save" id="jvo0vs" />
        </AsyncButton>
      </div>
    );
  }

  function settings() {
    if (!id) return null;
    return (
      <>
        <div className="flex justify-center items-center image-settings">
          {(props.banner ?? true) && (
            <div
              style={{
                background: (banner?.length ?? 0) > 0 ? `no-repeat center/cover url("${banner}")` : undefined,
              }}
              className="banner">
              <AsyncButton type="button" onClick={() => setNewBanner()} disabled={readonly}>
                <FormattedMessage defaultMessage="Upload" id="p4N05H" />
              </AsyncButton>
            </div>
          )}
          {(props.avatar ?? true) && (
            <div className="avatar-stack">
              <Avatar pubkey={id} user={user} image={picture} />
              <AsyncButton
                type="button"
                className="circle flex align-center justify-between"
                onClick={() => setNewAvatar()}
                disabled={readonly}>
                <Icon name="upload-01" />
              </AsyncButton>
            </div>
          )}
        </div>
        {error && <ErrorOrOffline error={error} />}
        {editor()}
      </>
    );
  }

  return <div className="settings">{settings()}</div>;
}
