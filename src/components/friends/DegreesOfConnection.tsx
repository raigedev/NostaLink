interface Props { degrees: number | null }

export default function DegreesOfConnection({ degrees }: Props) {
  if (degrees === null) return null;
  return (
    <div className="text-xs text-gray-500">
      {degrees === 1 ? "👥 Direct friend" : `🔗 ${degrees} degrees of separation`}
    </div>
  );
}
