"use client";

import React from "react";
import { useParams } from "next/navigation";
import { MusTapeApp } from "@/components/mustape-app";

export default function ComposeInCollectionPage() {
  const params = useParams();
  const collectionId = params.id as string;
  
  return <MusTapeApp collectionId={collectionId} />;
}
