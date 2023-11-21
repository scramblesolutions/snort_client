import { MetadataCache } from "@snort/system";

import { ChatParticipant } from "@/chat";
import NoteToSelf from "../User/NoteToSelf";
import ProfileImage from "../User/ProfileImage";
import useLogin from "@/Hooks/useLogin";

export function ChatParticipantProfile({ participant }: { participant: ChatParticipant }) {
  const { publicKey } = useLogin(s => ({ publicKey: s.publicKey }));
  if (participant.id === publicKey) {
    return <NoteToSelf className="grow" />;
  }
  return <ProfileImage pubkey={participant.id} className="grow" profile={participant.profile as MetadataCache} />;
}
