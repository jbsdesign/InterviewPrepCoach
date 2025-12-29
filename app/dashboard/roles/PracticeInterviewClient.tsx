"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

type PracticeInterviewClientProps = {
  roleId: string;
  roleTitle: string;
  company?: string | null;
  interviewId?: string;
};

export function PracticeInterviewClient({
  roleId,
  roleTitle,
  company,
  interviewId,
}: PracticeInterviewClientProps) {
  const router = useRouter();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const speechStreamRef = useRef<MediaStream | null>(null);
  const speechRecorderRef = useRef<MediaRecorder | null>(null);
  const speechChunksRef = useRef<Blob[]>([]);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  const [messages, setMessages] = useState<
    { id: number; from: "agent" | "user"; text: string }[]
  >([
    {
      id: 1,
      from: "agent",
      text:
        "Hi, I am your AI interviewer. When you are ready, click Start interview and I will begin with the first question.",
    },
  ]);
  const [input, setInput] = useState("");
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string | null>(null);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentError, setAgentError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [listeningError, setListeningError] = useState<string | null>(null);

  // Voice setup for Safari (Web Speech API). Other browsers will gracefully
  // fall back to text only.
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return;

      // Deduplicate by name+lang so our <option> keys are stable and unique.
      const uniqueVoices = Array.from(
        new Map(voices.map((v) => [`${v.name}-${v.lang}`, v])).values(),
      );

      // Try a slightly different set and order so the voice feels less generic.
      const preferredNames = [
        "Allison",
        "Ava",
        "Zoey",
        "Samantha",
        "Alex",
      ];
      const byName = uniqueVoices.find((v) =>
        preferredNames.some((name) =>
          v.name.toLowerCase().includes(name.toLowerCase()),
        ),
      );
      const byLang = uniqueVoices.find((v) => v.lang.startsWith("en"));
      const chosen = byName || byLang || uniqueVoices[0] || null;

      setAvailableVoices(uniqueVoices);
      setVoice(chosen);
      setSelectedVoiceName((prev) => prev ?? chosen?.name ?? null);
    }

    pickVoice();
    window.speechSynthesis.onvoiceschanged = pickVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  useEffect(() => {
    async function enableCamera() {
      if (!videoRef.current || typeof navigator === "undefined") return;
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        cameraStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {
            // Ignore play errors (e.g. autoplay policies) until user interacts.
          });
          setIsCameraActive(true);
        }
      } catch (error) {
        console.error("Error accessing camera", error);
        setCameraError(
          "We could not access your camera. Check your browser permissions and try again.",
        );
        setIsCameraActive(false);
      }
    }

    void enableCamera();

    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach((track) => track.stop());
        cameraStreamRef.current = null;
      }
    };
  }, []);

  function isSafariBrowser() {
    if (typeof navigator === "undefined") return false;
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome|CriOS|Edg\//.test(ua);
  }

  function speakAgent(text: string) {
    if (!speechEnabled) {
      setIsAiSpeaking(false);
      return;
    }
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsAiSpeaking(false);
      return;
    }

    // Only enable voice in Safari for now. Other browsers will fall back to
    // text only until a cross browser TTS solution is in place.
    if (!isSafariBrowser()) {
      setIsAiSpeaking(false);
      return;
    }

    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    // Slightly slower and more neutral pitch for a calmer interviewer voice.
    utterance.rate = 0.96;
    utterance.pitch = 1.0;

    // Honor the selected voice if one has been chosen.
    let chosenVoice: SpeechSynthesisVoice | null = voice;
    if (selectedVoiceName && window.speechSynthesis.getVoices().length) {
      const match = window.speechSynthesis
        .getVoices()
        .find((v) => v.name === selectedVoiceName);
      if (match) {
        chosenVoice = match;
      }
    }
    if (chosenVoice) utterance.voice = chosenVoice;

    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    // Some Safari builds can miss onstart, so set a conservative fallback
    setIsAiSpeaking(true);
    synth.speak(utterance);
  }

  function handleTestVoice() {
    speakAgent("This is a test of your interviewer's voice.");
  }

  function extractFeedbackNotes(fullReply: string): string {
    const marker = "Feedback summary:";
    const index = fullReply.indexOf(marker);
    if (index === -1) {
      return fullReply.trim();
    }
    return fullReply.slice(index).trim();
  }

  async function callAgent(
    nextMessages: { id: number; from: "agent" | "user"; text: string }[],
    userMessage: string,
  ) {
    try {
      setIsAgentThinking(true);
      setAgentError(null);

      const response = await fetch("/api/practice-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          roleId,
          roleTitle,
          company,
          message: userMessage,
          history: nextMessages.map((m) => ({
            role: m.from === "user" ? "user" : "assistant",
            content: m.text,
          })),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.success || !data.reply) {
        setAgentError(
          data.error || "The interview agent was unable to respond. Please try again.",
        );
        return;
      }

      const completionMarker = "[[INTERVIEW_COMPLETE]]";
      let replyText = data.reply!;
      const interviewCompleted = replyText.includes(completionMarker);
      if (interviewCompleted) {
        replyText = replyText.replace(completionMarker, "").trimEnd();
      }

      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          from: "agent",
          text: replyText,
        },
      ]);

      speakAgent(replyText);

      if (interviewCompleted && interviewId) {
        // Fire and forget: best effort save of structured coaching notes into the
        // interview notes field so they can be surfaced from the Roles page.
        const notesToSave = extractFeedbackNotes(replyText);
        void fetch("/api/roles/interviews", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            interviewId,
            notes: notesToSave,
          }),
        }).catch(() => {
          // Ignore errors here; the main chat experience already completed.
        });
      }
    } catch {
      setAgentError("There was a problem talking to the interview agent.");
    } finally {
      setIsAgentThinking(false);
    }
  }

  function handleSendMessage(event: React.FormEvent) {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const nextMessages = [
      ...messages,
      { id: messages.length + 1, from: "user" as const, text: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");

    void callAgent(nextMessages, trimmed);
  }

  async function startListening() {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setListeningError(
        "Your browser does not support speech input here. Please type your answer instead.",
      );
      return;
    }

    try {
      setListeningError(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      speechStreamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      speechRecorderRef.current = recorder;
      speechChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          speechChunksRef.current.push(event.data);
        }
      };

      recorder.onstart = () => {
        setIsListening(true);
      };

      recorder.onerror = () => {
        setListeningError("There was a problem capturing audio.");
        setIsListening(false);
      };

      recorder.onstop = async () => {
        setIsListening(false);

        if (speechStreamRef.current) {
          speechStreamRef.current.getTracks().forEach((track) => track.stop());
          speechStreamRef.current = null;
        }

        const blob = new Blob(speechChunksRef.current, { type: "audio/webm" });
        speechChunksRef.current = [];

        if (!blob.size) return;

        try {
          const formData = new FormData();
          formData.append("audio", blob, "answer.webm");

          const response = await fetch("/api/practice-interview/transcribe", {
            method: "POST",
            body: formData,
          });

          const data = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            text?: string;
            error?: string;
          };

          if (!response.ok || !data.success || !data.text) {
            setListeningError(
              data.error ||
                "We could not understand that audio. Please try again or type your answer.",
            );
            return;
          }

          const transcript = data.text.trim();
          if (!transcript) return;

          const nextMessages = [
            ...messages,
            {
              id: messages.length + 1,
              from: "user" as const,
              text: transcript,
            },
          ];

          setMessages(nextMessages);
          setInput("");
          void callAgent(nextMessages, transcript);
        } catch {
          setListeningError(
            "There was a problem sending your audio. Please try again.",
          );
        }
      };

      recorder.start();
    } catch {
      setListeningError(
        "We could not access your microphone. Check your browser permissions and try again.",
      );
      setIsListening(false);
    }
  }

  function stopListening() {
    if (
      speechRecorderRef.current &&
      speechRecorderRef.current.state === "recording"
    ) {
      speechRecorderRef.current.stop();
    }
  }

  function handleStartInterview() {
    if (!isInterviewStarted) {
      setIsInterviewStarted(true);
 
      const kickoffPrompt = `Start a new practice interview now. Greet the candidate briefly and then ask the first question in your interview plan. The role is ${roleTitle || "this role"}${company ? ` at ${company}` : ""}. Do not explain your full plan, just start with the first question.`;
      void callAgent(messages, kickoffPrompt);
    } else {
      setIsInterviewStarted(false);
    }
  }

  const displayCompany = company || "Your role";
 
  const baseTileScale = isInterviewStarted ? 1.4 : 1;
  const speakingBoost = isAiSpeaking ? (isInterviewStarted ? 0.12 : 0.06) : 0;
  const tileScale = baseTileScale + speakingBoost;
 
  return (
    <div className="grid h-full gap-6 md:grid-cols-[minmax(0,2fr)_minmax(260px,1fr)]">
      <section className="flex min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/90 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/90">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Practice interview
            </p>
            <h2 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {displayCompany}
            </h2>
            <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
              {roleTitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleStartInterview}
              className="rounded-full bg-blue-600 px-4 py-1.5 text-[10px] font-semibold text-white shadow-lg shadow-blue-600/40 transition hover:bg-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950"
            >
              {isInterviewStarted ? "Pause interview" : "Start interview"}
            </button>
            <button
              type="button"
              onClick={() => router.push(`/dashboard/roles/${roleId}`)}
              className="rounded-full bg-zinc-900 px-4 py-1.5 text-[10px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              Exit
            </button>
          </div>
        </header>
 
        <div
          className="relative mt-1 flex-1 min-h-0 overflow-hidden rounded-xl transition-colors duration-700"
          style={{
            background: isInterviewStarted
              ? "linear-gradient(135deg,#7dd3fc 0%,#38bdf8 40%,#4f46e5 100%)"
              : "#020617",
          }}
        >
          {/* Centered glassy AI tile; keep purely CSS-based for cross-browser parity */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="relative flex items-center justify-center rounded-[32px] border border-white/70 shadow-[0_0_60px_rgba(56,189,248,0.85)] backdrop-blur-md transition-transform duration-500"
              style={{
                width: 160,
                height: 112,
                background:
                  isInterviewStarted && isAiSpeaking
                    ? "linear-gradient(135deg,#e0f2fe 0%,#7dd3fc 35%,#38bdf8 70%)"
                    : isInterviewStarted
                      ? "linear-gradient(135deg,#7dd3fc 0%,#38bdf8 40%,#4f46e5 100%)"
                      : "linear-gradient(135deg,#020617 0%,#111827 100%)",
                transform: `scale(${tileScale})`,
                transformOrigin: "center center",
                borderRadius: 32,
                border: isAiSpeaking
                  ? "1px solid rgba(255,255,255,0.9)"
                  : "1px solid rgba(255,255,255,0.65)",
                boxShadow: isAiSpeaking
                  ? "0 0 18px rgba(56,189,248,0.6)"
                  : isInterviewStarted
                    ? "0 0 8px rgba(15,23,42,0.7)"
                    : "0 0 4px rgba(15,23,42,0.6)",
              }}
            >
              {/* outer glow aura (very subtle, only while speaking) */}
              {isAiSpeaking && (
                <div
                  className="pointer-events-none absolute inset-[-6px] ai-glow-pulse"
                  style={{
                    borderRadius: 34,
                    background:
                      "radial-gradient(circle, rgba(224,242,254,0.8) 0%, rgba(125,211,252,0.6) 40%, transparent 80%)",
                  }}
                />
              )}

              {/* inner glass highlight */}
              <div
                className="pointer-events-none absolute inset-[1px] rounded-[30px]"
                style={{
                  background: isInterviewStarted
                    ? "linear-gradient(135deg,rgba(255,255,255,0.7) 0%,rgba(255,255,255,0.25) 40%,transparent 100%)"
                    : "linear-gradient(135deg,rgba(255,255,255,0.35) 0%,rgba(255,255,255,0.12) 40%,transparent 100%)",
                  borderRadius: 30,
                }}
              />

              {/* speaking waveform */}
              {isAiSpeaking && (
                <div className="pointer-events-none absolute bottom-4 left-1/2 flex h-6 -translate-x-1/2 items-end gap-[3px]">
                  <span className="ai-wave-bar ai-wave-bar-1" />
                  <span className="ai-wave-bar ai-wave-bar-2" />
                  <span className="ai-wave-bar ai-wave-bar-3" />
                  <span className="ai-wave-bar ai-wave-bar-4" />
                </div>
              )}

              <span className="relative text-4xl font-semibold text-white drop-shadow-[0_4px_12px_rgba(15,23,42,0.65)]">
                AI
              </span>
            </div>
          </div>
 
          {/* Interviewer label anchored near bottom center */}
          <div className="absolute bottom-8 inset-x-0 flex justify-center">
            <div className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium text-zinc-100">
              Interviewer
            </div>
          </div>
 
          <video
            ref={videoRef}
            className="absolute bottom-4 right-4 h-28 w-40 rounded-xl border border-zinc-700 bg-black/60 object-cover shadow-lg"
            playsInline
            muted
          />
          {!isCameraActive && !cameraError && (
            <div className="absolute bottom-4 right-4 flex flex-col items-center justify-center gap-1 rounded-lg bg-zinc-950/80 px-3 py-2 text-center">
              <p className="text-[11px] text-zinc-200">Initializing your camera…</p>
            </div>
          )}
 
          {cameraError && (
            <div className="absolute bottom-4 right-4 flex max-w-xs flex-col items-start justify-center gap-1 rounded-lg bg-zinc-950/90 px-3 py-2 text-left">
              <p className="text-xs font-medium text-red-400">{cameraError}</p>
              <p className="text-[11px] text-zinc-300">
                You can still use the text chat on the right while you adjust your
                settings.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="flex h-full min-h-0 flex-col rounded-2xl border border-zinc-200 bg-white/95 p-4 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-950/95">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              Chat
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isSafariBrowser() && availableVoices.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Voice
                </span>
                <select
                  className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[10px] text-zinc-700 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                  value={selectedVoiceName ?? ""}
                  onChange={(event) => {
                    const name = event.target.value || null;
                    setSelectedVoiceName(name);
                    if (name) {
                      const match = availableVoices.find((v) => v.name === name);
                      setVoice(match || null);
                    }
                  }}
                >
                  {availableVoices.map((v) => (
                    <option key={`${v.name}-${v.lang}`} value={v.name}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={() => setSpeechEnabled((prev) => !prev)}
              className="rounded-full border border-zinc-300 px-3 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              {speechEnabled ? "Mute voice" : "Voice on"}
            </button>
            <button
              type="button"
              onClick={handleTestVoice}
              className="rounded-full border border-zinc-300 px-3 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
            >
              Test voice
            </button>
          </div>
        </header>

        <div className="flex-1 min-h-0 space-y-2 overflow-y-auto rounded-md bg-zinc-50 p-2 dark:bg-zinc-900/60">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-[11px] leading-snug shadow-sm ${
                  message.from === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
        </div>

        {isAgentThinking && (
          <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            Your interviewer is thinking…
          </p>
        )}
        {agentError && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{agentError}</p>
        )}
        {listeningError && (
          <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">{listeningError}</p>
        )}

        <form
          onSubmit={handleSendMessage}
          className="mt-2 flex items-center gap-2 rounded-md bg-zinc-50 px-2 py-1.5 dark:bg-zinc-900/70"
        >
          <input
            type="text"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Type a message to your interviewer"
            className="flex-1 border-0 bg-transparent text-[11px] text-zinc-900 placeholder:text-zinc-400 outline-none dark:text-zinc-50 dark:placeholder:text-zinc-500"
          />
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                void startListening();
              }
            }}
            className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            {isListening ? "Listening..." : "Speak"}
          </button>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-medium text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Send
          </button>
        </form>
      </aside>
    </div>
  );
}
