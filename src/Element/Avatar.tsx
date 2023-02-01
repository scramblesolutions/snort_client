import "./Avatar.css";
import Nostrich from "nostrich.webp";
import { CSSProperties, useEffect, useState } from "react";
import type { UserMetadata } from "Nostr";
import useImgProxy from "Feed/ImgProxy";

const Avatar = ({ user, ...rest }: { user?: UserMetadata, onClick?: () => void }) => {
  const [url, setUrl] = useState<string>(Nostrich);
  const { proxy } = useImgProxy();

  useEffect(() => {
    if (user?.picture) {
      proxy(user.picture, 120)
        .then(a => setUrl(a))
        .catch(console.warn);
    }
  }, [user]);

  const backgroundImage = `url(${url})`
  const style = { '--img-url': backgroundImage } as CSSProperties
  const domain = user?.nip05 && user.nip05.split('@')[1]
  return (
    <div
      {...rest}
      style={style}
      className="avatar"
      data-domain={domain?.toLowerCase()}
    >
    </div>
  )
}

export default Avatar
