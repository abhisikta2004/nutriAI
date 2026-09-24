import { useState, useEffect, useRef, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, Play, RotateCcw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

interface VoiceAdvisorProps {
  onAnalysis: (result: any) => void;
  isAnalyzingGlobal?: boolean;
}

export const VoiceAdvisor = ({ onAnalysis, isAnalyzingGlobal = false }: VoiceAdvisorProps) => {
  const { profile } = useUserProfile();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastSpokenText, setLastSpokenText] = useState("");
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lockedVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Deterministically select and lock onto a SINGLE consistent high-fidelity voice
  const resolveAndLockVoice = useCallback(() => {
    if (!synthRef.current) return null;
    const voices = synthRef.current.getVoices();
    if (!voices || voices.length === 0) return null;

    // Prioritized single voice preference list (Natural, clean English voices)
    const preferredVoiceNames = [
      "Google US English",
      "Samantha",
      "Microsoft Zira - English (United States)",
      "Microsoft Jenny Online (Natural) - English (United States)",
      "Karen",
      "Daniel",
      "Alex"
    ];

    for (const name of preferredVoiceNames) {
      const found = voices.find((v) => v.name.includes(name));
      if (found) {
        lockedVoiceRef.current = found;
        return found;
      }
    }

    // Fallback to first en-US or en voice
    const fallbackEnUs = voices.find((v) => v.lang === "en-US" || v.lang === "en_US") ||
      voices.find((v) => v.lang.startsWith("en")) ||
      voices[0];

    lockedVoiceRef.current = fallbackEnUs;
    return fallbackEnUs;
  }, []);

  // Initialize Speech Recognition & Synthesis on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;

      // Ensure voices are loaded and locked immediately
      if (synthRef.current) {
        resolveAndLockVoice();
        synthRef.current.onvoiceschanged = () => {
          resolveAndLockVoice();
        };
      }

      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 5;
        recognition.lang = "en-US";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          const cleanText = currentTranscript.trim();
          setTranscript(cleanText);

          // Reset silence timer on fresh speech input
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current);
          }
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            toast.error("Microphone access denied. Please allow microphone permissions.");
          } else if (event.error !== "no-speech") {
            toast.error(`Voice error: ${event.error}`);
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } else {
        setVoiceSupported(false);
      }
    }

    return () => {
      stopSpeaking();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [resolveAndLockVoice]);

  // Consistent Single-Sound Speech Synthesizer
  const speakTextNaturally = (text: string) => {
    if (!synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    setLastSpokenText(text);
    setIsSpeaking(true);

    // Clean up markers like "..." and [pause] into natural punctuation pauses
    const naturalText = text
      .replace(/\[pause\]/gi, ", ")
      .replace(/\.\.\./g, ", ")
      .replace(/\s+/g, " ")
      .trim();

    const utterance = new SpeechSynthesisUtterance(naturalText);
    currentUtteranceRef.current = utterance;

    // Always use the locked voice for 100% single sound consistency
    const voiceToUse = lockedVoiceRef.current || resolveAndLockVoice();
    if (voiceToUse) {
      utterance.voice = voiceToUse;
    }

    utterance.rate = 0.98; // Natural, steady conversational pacing
    utterance.pitch = 1.0; // Locked pitch
    utterance.volume = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error:", e);
      setIsSpeaking(false);
      currentUtteranceRef.current = null;
    };

    synthRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    stopSpeaking();
    setTranscript("");

    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser. Please use Chrome, Safari, or Edge.");
      return;
    }

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.warn("Could not start speech recognition:", e);
      recognitionRef.current.stop();
      setTimeout(() => recognitionRef.current?.start(), 150);
    }
  };

  const stopListeningAndProcess = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);

    if (transcript.trim().length > 0) {
      await processVoiceFoodQuery(transcript.trim());
    }
  };

  const processVoiceFoodQuery = async (queryText: string) => {
    if (!queryText || queryText.trim().length === 0) {
      toast.error("Please say the name of a food or meal.");
      return;
    }

    setIsProcessing(true);
    try {
      toast.info(`NutriAI is analyzing: "${queryText}"...`);

      const { data, error } = await supabase.functions.invoke("analyze-food", {
        body: {
          voiceQuery: queryText,
          userProfile: {
            dietPreference: profile.dietPreference,
            allergies: profile.allergies,
            currentBodyType: profile.currentBodyType,
            targetBodyType: profile.targetBodyType,
            weight: profile.weight,
            age: profile.age,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data) {
        onAnalysis(data);
        toast.success("Analysis complete!");

        // Speak back with the locked voice
        if (data.spokenResponse) {
          speakTextNaturally(data.spokenResponse);
        }
      }
    } catch (err: any) {
      console.error("Voice food analysis error:", err);
      const msg = err?.message || "Could not analyze spoken food. Please try again.";
      toast.error(msg);
      speakTextNaturally("Sorry, I had trouble identifying that food. Could you repeat what you're eating?");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setTranscript(example);
    processVoiceFoodQuery(example);
  };

  const isBusy = isListening || isProcessing || isAnalyzingGlobal;

  return (
    <Card className="p-8 bg-card border-2 border-primary/20 shadow-elevated relative overflow-hidden">
      {/* Ambient background blur */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-xl mx-auto">
        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/30 font-semibold flex items-center gap-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Voice Nutrition Assistant
          </Badge>
          {isSpeaking && (
            <Badge className="bg-health-excellent text-white font-medium animate-pulse flex items-center gap-1.5">
              <Volume2 className="h-3.5 w-3.5" />
              Speaking
            </Badge>
          )}
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
            Talk to NutriAI in Natural Voice
          </h3>
          <p className="text-sm text-muted-foreground">
            Just tell NutriAI what you're eating or planning to eat. It will analyze your macros, verify your diet, and speak back healthier swaps using a dedicated consistent voice.
          </p>
        </div>

        {/* Central Interactive Audio Button */}
        <div className="relative my-4 flex items-center justify-center">
          {isListening && (
            <>
              <div className="absolute h-36 w-36 rounded-full bg-sage/20 animate-pulse" />
              <div className="absolute w-28 h-28 rounded-full bg-primary/30 animate-pulse" />
            </>
          )}

          {isSpeaking && (
            <div className="absolute -inset-4 rounded-full border-2 border-sage/50 animate-pulse opacity-75" />
          )}

          <button
            onClick={isListening ? stopListeningAndProcess : startListening}
            disabled={isProcessing || isAnalyzingGlobal}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/40 ${
              isListening
                ? "bg-terracotta text-white scale-110 shadow-soft duration-500"
                : isProcessing
                ? "bg-primary/50 text-white cursor-wait"
                : isSpeaking
                ? "bg-health-excellent text-white scale-105 shadow-soft"
                : "bg-primary text-white hover:scale-105 hover:shadow-primary/40 active:scale-95"
            }`}
            title={isListening ? "Tap to Finish Speaking" : "Tap to Speak"}
          >
            {isProcessing ? (
              <Loader2 className="h-10 w-10 animate-spin" />
            ) : isListening ? (
              <MicOff className="h-10 w-10" />
            ) : isSpeaking ? (
              <Volume2 className="h-10 w-10 animate-pulse" />
            ) : (
              <Mic className="h-10 w-10" />
            )}
          </button>
        </div>

        {/* Dynamic Status Text */}
        <div className="min-h-[48px] flex flex-col items-center justify-center space-y-1">
          {isListening ? (
            <div className="space-y-1">
              <span className="text-sm font-semibold text-terracotta flex items-center justify-center gap-1.5 animate-pulse">
                <span className="h-2 w-2 rounded-full bg-terracotta inline-block" />
                Listening to your voice...
              </span>
              <p className="text-base font-medium text-foreground italic max-w-md">
                "{transcript || "Say what food you are having..."}"
              </p>
            </div>
          ) : isProcessing ? (
            <div className="space-y-1">
              <span className="text-sm font-semibold text-primary flex items-center justify-center gap-1.5">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                NutriAI is analyzing & finding healthier swaps...
              </span>
              <p className="text-xs text-muted-foreground">Calculating ML health score and macro alternatives</p>
            </div>
          ) : isSpeaking ? (
            <div className="space-y-2 max-w-lg bg-muted/40 rounded-xl p-4 border border-border/40">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-health-good uppercase tracking-wider flex items-center gap-1">
                  <Volume2 className="h-3.5 w-3.5" />
                  Spoken Nutrition Advice:
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={stopSpeaking}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <VolumeX className="h-3.5 w-3.5 mr-1" />
                  Stop Voice
                </Button>
              </div>
              <p className="text-sm text-foreground leading-relaxed text-left">
                {lastSpokenText}
              </p>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground font-medium">
              Tap the microphone to start speaking hands-free
            </span>
          )}
        </div>

        {/* Manual Finish Action when Listening */}
        {isListening && (
          <Button
            onClick={stopListeningAndProcess}
            size="lg"
            className="bg-primary text-primary-foreground font-semibold px-6 shadow-md"
          >
            Done Speaking → Analyze
          </Button>
        )}

        {/* Quick Example Voice Prompts */}
        {!isBusy && !isSpeaking && (
          <div className="w-full pt-4 border-t border-border/40 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Or tap an example to hear NutriAI in action:
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                "2 slices of pepperoni pizza and a can of cola",
                "Fruit and spinach protein smoothie",
                "Cheeseburger with large french fries",
                "Grilled chicken breast with steamed broccoli",
                "Chocolate glazed donut for breakfast",
              ].map((example, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="h-auto rounded-full bg-card/60 py-2 text-xs normal-case tracking-normal transition-all duration-300 hover:border-sage/40 hover:bg-sage/10 hover:text-foreground"
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Replay Spoken Audio Button if available */}
        {!isSpeaking && lastSpokenText && (
          <div className="flex items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => speakTextNaturally(lastSpokenText)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Replay Voice Advice
            </Button>
          </div>
        )}

        {!voiceSupported && (
          <div className="flex items-center gap-2 rounded-3xl border border-health-moderate/40 bg-health-moderate/10 p-3 text-xs text-health-moderate">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Voice input uses the Web Speech API. For full hands-free speech recognition, please open in Chrome, Safari, or Edge.</span>
          </div>
        )}
      </div>
    </Card>
  );
};
