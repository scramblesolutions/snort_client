import Timeline from "@/Element/Feed/Timeline";
import useLogin from "@/Hooks/useLogin";

export function TopicsPage() {
  const { tags, pubKey } = useLogin(s => ({ tags: s.tags.item, pubKey: s.publicKey }));

  return (
    <Timeline
      subject={{
        type: "hashtag",
        items: tags,
        discriminator: pubKey ?? "",
      }}
      postsOnly={true}
      method="TIME_RANGE"
      loadMore={true}
      window={60 * 60 * 6}
    />
  );
}
