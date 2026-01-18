import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatAssistantProps {
  unternehmenId: number | null;
}

export default function ChatAssistant({ unternehmenId }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]");
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  // Load help examples
  const helpQuery = trpc.chatAssistant.help.useQuery(undefined, {
    enabled: showHelp && isOpen,
  });

  // Chat query mutation
  const chatMutation = trpc.chatAssistant.query.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
        },
      ]);
    },
    onError: (error) => {
      toast.error(`Chat-Fehler: ${error.message}`);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `⚠️ Fehler: ${error.message}`,
          timestamp: new Date(),
        },
      ]);
    },
  });

  const handleSend = () => {
    if (!inputValue.trim()) return;

    if (!unternehmenId) {
      toast.error("Bitte wählen Sie zuerst ein Unternehmen aus.");
      return;
    }

    // Add user message
    const userMessage: Message = {
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setShowHelp(false);

    // Send to API
    chatMutation.mutate({
      question: inputValue,
      unternehmenId,
      conversationHistory: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleExampleClick = (example: string) => {
    setInputValue(example);
    setShowHelp(false);
  };

  const handleClearChat = () => {
    setMessages([]);
    setShowHelp(false);
    toast.success("Chat-Verlauf gelöscht");
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 z-50"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[400px] h-[600px] shadow-2xl z-50 flex flex-col">
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                <CardTitle className="text-base">Buchhaltungs-Assistent</CardTitle>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setShowHelp(!showHelp)}
                  title="Hilfe anzeigen"
                >
                  <HelpCircle className="w-4 h-4" />
                </Button>
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={handleClearChat}
                    title="Chat löschen"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages Area */}
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
              {messages.length === 0 && !showHelp && (
                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                  <Sparkles className="w-16 h-16 text-purple-400 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">
                    Willkommen beim Buchhaltungs-Assistenten!
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Stellen Sie mir Fragen zu Ihren Buchungen, Finanzen und Belegen.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHelp(true)}
                    className="gap-2"
                  >
                    <HelpCircle className="w-4 h-4" />
                    Beispiele anzeigen
                  </Button>
                </div>
              )}

              {/* Help/Examples View */}
              {showHelp && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Beispiel-Fragen
                    </h4>
                    <div className="space-y-2">
                      {helpQuery.data?.examples.map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleExampleClick(example)}
                          className="w-full p-3 text-left text-sm border rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  </div>

                  {helpQuery.data?.tips && (
                    <div>
                      <h4 className="font-semibold mb-2">💡 Tipps</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {helpQuery.data.tips.map((tip, idx) => (
                          <li key={idx}>• {tip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4">
                {messages.map((message, idx) => (
                  <div
                    key={idx}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                          : "bg-slate-100 text-slate-900"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <p
                        className={`text-xs mt-1 ${
                          message.role === "user" ? "text-white/70" : "text-slate-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg px-4 py-2 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-slate-600">Denke nach...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          {/* Input Area */}
          <div className="border-t p-3 bg-white flex-shrink-0">
            {!unternehmenId && (
              <div className="mb-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                ⚠️ Bitte wählen Sie ein Unternehmen aus
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Stellen Sie eine Frage..."
                disabled={chatMutation.isPending || !unternehmenId}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || chatMutation.isPending || !unternehmenId}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                size="icon"
              >
                {chatMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
