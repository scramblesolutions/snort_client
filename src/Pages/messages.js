import { defineMessages } from "react-intl";
import { addIdAndDefaultMessageToMessages } from "Util";

const messages = defineMessages({
  Login: "Login",
  Posts: "Posts",
  Conversations: "Conversations",
  Global: "Global",
  NewUsers: "New users page",
  NoFollows:
    "Hmm nothing here.. Checkout {newUsersPage} to follow some recommended nostrich's!",
  Notes: "Notes",
  Reactions: "Reactions",
  Followers: "Followers",
  Follows: "Follows",
  Zaps: "Zaps",
  Muted: "Muted",
  Blocked: "Blocked",
  Sats: "{n} {n, plural, =1 {sat} other {sats}}",
  Following: "Following {n}",
  Settings: "Settings",
  Search: "Search",
  SearchPlaceholder: "Search...",
  Messages: "Messages",
  MarkAllRead: "Mark All Read",
  GetVerified: "Get Verified",
  Nip05: `NIP-05 is a DNS based verification spec which helps to validate you as a real user.`,
  Nip05Pros: `Getting NIP-05 verified can help:`,
  AvoidImpersonators: "Prevent fake accounts from imitating you",
  EasierToFind: "Make your profile easier to find and share",
  Funding:
    "Fund developers and platforms providing NIP-05 verification services",
  SnortSocialNip: `Our very own NIP-05 verification service, help support the development of this site and get a shiny special badge on our site!`,
  NostrPlebsNip: `Nostr Plebs is one of the first NIP-05 providers in the space and offers a good collection of domains at reasonable prices`,
});

export default addIdAndDefaultMessageToMessages(messages, "Pages");
