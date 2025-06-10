"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { MessageCircle, Send, Sparkles, ArrowLeft, Target } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadUserContext();
    // Add welcome message
    const welcomeMessage: Message = {
      id: "1",
      role: "assistant",
      content:
        "Hey there! 👋 I'm your FocusPilot AI coach. I'm here to help you achieve your goals, stay motivated, and build amazing habits! What's on your mind today?",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, []);

  const loadUserContext = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];

      const [goalsResult, tasksResult, streakResult] = await Promise.all([
        supabase.from("goals").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("streaks").select("*").eq("user_id", user.id).single(),
      ]);

      const goals = goalsResult.data || [];
      const tasks = tasksResult.data || [];
      const streak = streakResult.data || { current_streak: 0 };

      const todayTasks = tasks.filter((task) => task.due_date === today);
      const completedTasks = tasks.filter((task) => task.completed_at).length;

      setUserContext({
        goals: goals.length,
        totalTasks: tasks.length,
        todayTasks: todayTasks.length,
        completedTasks,
        currentStreak: streak.current_streak,
      });
    } catch (error) {
      console.error("Error loading user context:", error);
    }
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      // Call the actual API endpoint for AI chat
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${
            (
              await supabase.auth.getSession()
            ).data.session?.access_token
          }`,
        },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp.toISOString(),
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();
      return (
        data.message ||
        "I'm here to help! Could you tell me more about what you're working on?"
      );
    } catch (error) {
      console.error("AI Response Error:", error);
      return "I'm having some technical difficulties with my AI brain right now, but I'm still here to help! What would you like to work on today? 🤖💙";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Simulate AI thinking time
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 1000)
      );

      const aiResponse = await getAIResponse(userMessage.content);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having a bit of trouble right now, but I'm here for you! Could you try asking me again? 💚",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Dashboard</span>
              </Link>
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-primary-600" />
                <span className="text-2xl font-bold text-gray-900">
                  FocusPilot
                </span>
              </div>
            </div>

            {userContext && (
              <div className="hidden md:flex items-center space-x-4 text-sm text-gray-600">
                <span>🎯 {userContext.goals} Goals</span>
                <span>✅ {userContext.completedTasks} Completed</span>
                <span>🔥 {userContext.currentStreak} Day Streak</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Chat Interface */}
      <div className="flex flex-col h-[calc(100vh-80px)]">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 border-b">
          <div className="container mx-auto">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Your AI Productivity Coach
                </h1>
                <p className="text-sm text-gray-600">
                  Here to help you achieve your goals and build great habits
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-white shadow border border-gray-200"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.role === "user"
                          ? "text-primary-100"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white shadow border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-500">
                        Coach is thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="container mx-auto max-w-4xl">
            <div className="flex space-x-4">
              <div className="flex-1">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about goals, motivation, habits, or productivity..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="btn-primary px-6 py-2 h-fit"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() =>
                  setInput("I'm feeling unmotivated today, can you help?")
                }
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                Need motivation 💪
              </button>
              <button
                onClick={() => setInput("How do I build better habits?")}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                Build habits 🌱
              </button>
              <button
                onClick={() => setInput("Help me break down a big goal")}
                className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
              >
                Break down goals 🎯
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
