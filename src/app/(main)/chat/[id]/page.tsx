import { getMessages } from "@/app/actions/chat";
import ChatWindow from "@/components/chat/ChatWindow";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ChatRoomPage({ params }: Props) {
  const { id } = await params;
  const messages = await getMessages(id);

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-8rem)]">
      <ChatWindow conversationId={id} initialMessages={messages} />
    </div>
  );
}
