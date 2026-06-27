import { useEffect, useRef, useState } from "react";

function cleanMarkdown(text) {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, "") // remove code blocks
    .replace(/`([^`]+)`/g, "$1")    // remove inline code formatting
    .replace(/\*\*([^*]+)\*\*/g, "$1") // remove bold
    .replace(/\*([^*]+)\*/g, "$1")     // remove italics
    .replace(/__([^_]+)__/g, "$1")     // remove bold __
    .replace(/_([^_]+)_/g, "$1")       // remove italics _
    .replace(/^[*-]\s+/gm, "")         // remove bullet points
    .replace(/^\d+\.\s+/gm, "")        // remove numbered lists
    .replace(/[#*_\-`~[\]()]/g, "")    // remove other markdown symbols
    .trim();
}

export function useSpeech(lang = "id-ID") {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("voice_enabled") === "true";
    }
    return false;
  });
  const lastSpokenRef = useRef(null);

  function speak(text) {
    if (!enabled || !text || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const cleanedText = cleanMarkdown(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.lang = lang;
    utterance.rate = 1.0;
    
    // Explicitly bind the best matching voice for the specified language
    const voices = window.speechSynthesis.getVoices();
    const matchLang = lang.toLowerCase().replace("_", "-");
    const voice = voices.find((v) => v.lang.toLowerCase().replace("_", "-").startsWith(matchLang));
    if (voice) {
      utterance.voice = voice;
    }
    
    window.speechSynthesis.speak(utterance);
  }

  function speakOnce(id, text) {
    if (lastSpokenRef.current === id) return;
    lastSpokenRef.current = id;
    speak(text);
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("voice_enabled", enabled);
    }
    if (!enabled && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [enabled]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { enabled, setEnabled, speak, speakOnce };
}
