"use client";

interface Props {
  count: number;
  memberSince?: string | null;
}

export default function HitCounterWidget({ count, memberSince }: Props) {
  const joined = memberSince
    ? new Date(memberSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  return (
    <div className="fp-stat-row">
      <div className="fp-stat-item">
        <span className="fp-stat-label">Profile Views</span>
        <span className="fp-stat-value">{count.toLocaleString()}</span>
      </div>
      {joined && (
        <div className="fp-stat-item">
          <span className="fp-stat-label">Member Since</span>
          <span className="fp-stat-value">{joined}</span>
        </div>
      )}
    </div>
  );
}
