"use client";

import { useEffect, useState } from "react";

export default function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/site-visits", {
      method: "POST",
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load visitor count.");
        return response.json() as Promise<{ count?: number }>;
      })
      .then((payload) => {
        if (!cancelled && typeof payload.count === "number") {
          setCount(payload.count);
        }
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span className="visitor-counter" aria-label="Site visitor count">
      Visitors <strong>{count === null ? "—" : new Intl.NumberFormat("en-CA").format(count)}</strong>
    </span>
  );
}
