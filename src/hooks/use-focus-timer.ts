"use client";

import { useEffect, useMemo, useState } from "react";

const DEFAULT_SECONDS = 25 * 60;

export function useFocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_SECONDS);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const formatted = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const total = DEFAULT_SECONDS;
  const progress = total > 0 ? (total - secondsLeft) / total : 0;

  const reset = () => {
    setRunning(false);
    setSecondsLeft(DEFAULT_SECONDS);
  };

  return { formatted, running, setRunning, reset, progress };
}
