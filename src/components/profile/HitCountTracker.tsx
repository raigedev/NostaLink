"use client";

import { useEffect } from "react";
import { incrementHitCount } from "@/app/actions/profile";

interface Props {
  profileId: string;
}

export default function HitCountTracker({ profileId }: Props) {
  useEffect(() => {
    incrementHitCount(profileId).catch(() => {});
  }, [profileId]);

  return null;
}
