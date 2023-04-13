import "@webscopeio/react-textarea-autocomplete/style.css";
import "./Textarea.css";

import { useIntl } from "react-intl";
import ReactTextareaAutocomplete from "@webscopeio/react-textarea-autocomplete";
import emoji from "@jukben/emoji-search";
import TextareaAutosize from "react-textarea-autosize";
import { NostrPrefix } from "@snort/nostr";

import Avatar from "Element/Avatar";
import Nip05 from "Element/Nip05";
import { hexToBech32 } from "Util";
import { MetadataCache } from "Cache";
import { UserCache } from "Cache/UserCache";

import messages from "./messages";

interface EmojiItemProps {
  name: string;
  char: string;
}

const EmojiItem = ({ entity: { name, char } }: { entity: EmojiItemProps }) => {
  return (
    <div className="emoji-item">
      <div className="emoji">{char}</div>
      <div className="emoji-name">{name}</div>
    </div>
  );
};

const UserItem = (metadata: MetadataCache) => {
  const { pubkey, display_name, nip05, ...rest } = metadata;
  return (
    <div key={pubkey} className="user-item">
      <div className="user-picture">
        <Avatar user={metadata} />
      </div>
      <div className="user-details">
        <strong>{display_name || rest.name}</strong>
        <Nip05 nip05={nip05} pubkey={pubkey} />
      </div>
    </div>
  );
};

interface TextareaProps {
  autoFocus: boolean;
  className: string;
  onChange(ev: React.ChangeEvent<HTMLTextAreaElement>): void;
  value: string;
  onFocus(): void;
  onKeyDown(ev: React.KeyboardEvent<HTMLTextAreaElement>): void;
}

const Textarea = (props: TextareaProps) => {
  const { formatMessage } = useIntl();

  const userDataProvider = async (token: string) => {
    return await UserCache.search(token);
  };

  const emojiDataProvider = (token: string) => {
    return emoji(token)
      .slice(0, 5)
      .map(({ name, char }) => ({ name, char }));
  };

  return (
    // @ts-expect-error If anybody can figure out how to type this, please do
    <ReactTextareaAutocomplete
      dir="auto"
      {...props}
      loadingComponent={() => <span>Loading...</span>}
      placeholder={formatMessage(messages.NotePlaceholder)}
      textAreaComponent={TextareaAutosize}
      trigger={{
        ":": {
          dataProvider: emojiDataProvider,
          component: EmojiItem,
          output: (item: EmojiItemProps) => item.char,
        },
        "@": {
          afterWhitespace: true,
          dataProvider: userDataProvider,
          component: (props: { entity: MetadataCache }) => <UserItem {...props.entity} />,
          output: (item: { pubkey: string }) => `@${hexToBech32(NostrPrefix.PublicKey, item.pubkey)}`,
        },
      }}
    />
  );
};

export default Textarea;
