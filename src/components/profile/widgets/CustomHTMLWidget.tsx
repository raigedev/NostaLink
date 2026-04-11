import { sanitizeHTML } from "@/lib/sanitize";

interface Props {
  html: string;
}

export default function CustomHTMLWidget({ html }: Props) {
  return (
    <div
      className="profile-custom-widget"
      dangerouslySetInnerHTML={{ __html: sanitizeHTML(html) }}
    />
  );
}
