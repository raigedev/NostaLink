interface Props {
  online: boolean;
  className?: string;
}

export default function OnlinePresence({ online, className = "" }: Props) {
  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full ${
        online ? "bg-green-400" : "bg-gray-300"
      } ${className}`}
    />
  );
}
