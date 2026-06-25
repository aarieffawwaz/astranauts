import { useEffect, useRef, useState } from "react";

export function useSpeech(lang = "id-ID") {
  const [enabled, setEnabled] = useState(false);
  const lastSpokenRef = useRef(null);

  function speak(text) {
    if (!enabled || !text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  }

  function speakOnce(id, text) {
    if (lastSpokenRef.current === id) return;
    lastSpokenRef.current = id;
    speak(text);
  }

  useEffect(() => {
    if (!enabled && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  return { enabled, setEnabled, speak, speakOnce };
}
