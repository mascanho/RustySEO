"use client";

import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/tauri";

export default function Greet() {
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    invoke<string>("greet", { name: "Next.js" })
      .then((result) => setGreeting(result))
      .catch(console.error);
  }, []);

  // Necessary because we will have to use Greet as a component later.
  return <div>{greeting}</div>;
}
