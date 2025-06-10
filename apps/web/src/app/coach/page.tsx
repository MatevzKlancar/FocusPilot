"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import {
  MessageCircle,
  Send,
  Sparkles,
  ArrowLeft,
  Target,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  MessageSquare,
  Calendar,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string | null;
  last_message_at: string;
  message_count: number;
  created_at: string;
}

interface ApiMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export default function CoachPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    loadChatSessions();
  }, []);

  useEffect(() => {
    if (currentSessionId) {
      loadSessionMessages(currentSessionId);
    } else {
      // Add welcome message for new session
      const welcomeMessage: Message = {
        id: "welcome",
        role: "assistant",
        content:
          "Listen up. I'm your FocusPilot drill sergeant, and I'm here to get your lazy ass in gear. No more excuses, no more 'tomorrow' bullshit. You want to achieve something real? Then it's time to stop talking and start doing. What goal are you ready to actually work on, or are you just here to waste both our time?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [currentSessionId]);

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

  const loadChatSessions = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/ai/chat/sessions`, {
        headers: {
          Authorization: `Bearer ${
            (
              await supabase.auth.getSession()
            ).data.session?.access_token
          }`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChatSessions(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load chat sessions:", error);
    }
  };

  const loadSessionMessages = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/ai/chat/sessions/${sessionId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const apiMessages: ApiMessage[] = data.data.messages || [];

        const convertedMessages: Message[] = apiMessages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }));

        setMessages(convertedMessages);
      }
    } catch (error) {
      console.error("Failed to load session messages:", error);
    }
  };

  const createNewSession = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/ai/chat/sessions`, {
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
          title: "New Conversation",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.data.id);
        loadChatSessions(); // Refresh the sessions list
      }
    } catch (error) {
      console.error("Failed to create new session:", error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(
        `${apiUrl}/api/ai/chat/sessions/${sessionId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${
              (
                await supabase.auth.getSession()
              ).data.session?.access_token
            }`,
          },
        }
      );

      if (response.ok) {
        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
        }
        loadChatSessions(); // Refresh the sessions list
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
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
          session_id: currentSessionId,
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

      // Update current session ID if it was created
      if (data.session_id && !currentSessionId) {
        setCurrentSessionId(data.session_id);
        loadChatSessions(); // Refresh sessions list
      }

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

  // Component to render goal/task creation results
  const GoalCreatedCard = ({ goal, tasks }: { goal: any; tasks: any[] }) => (
    <div className="mt-3 p-4 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Target className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-red-900">GOAL LOCKED IN</h3>
      </div>
      <p className="text-red-800 font-medium mb-3">{goal.title}</p>

      <div className="space-y-2">
        <p className="text-sm font-medium text-red-700">YOUR DAILY TASKS:</p>
        {tasks.slice(0, 3).map((task, index) => (
          <div key={index} className="flex items-center space-x-2 text-sm">
            <Clock className="h-4 w-4 text-red-500" />
            <span className="text-red-700">{task.title}</span>
            {task.is_recurring && (
              <span className="text-xs bg-red-200 text-red-800 px-2 py-1 rounded-full">
                {task.cadence}
              </span>
            )}
          </div>
        ))}
        {tasks.length > 3 && (
          <p className="text-xs text-red-600">
            ...and {tasks.length - 3} more tasks
          </p>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-red-200">
        <p className="text-xs text-red-600 font-medium">
          NO EXCUSES. START TODAY.
        </p>
      </div>
    </div>
  );

  // Enhanced message parsing to detect goal creation
  const parseMessageForGoalCreation = (
    content: string
  ): { goal: any; tasks: any[] } | null => {
    // Look for patterns that indicate goal creation
    if (
      content.includes("Goal created with") ||
      content.includes("time-based tasks")
    ) {
      // This would be enhanced to parse actual goal/task data from the AI response
      // For now, return null but the structure is ready
      return null;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarOpen ? "w-80" : "w-0"
        } overflow-hidden`}
      >
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Chat History</h2>
              <button
                onClick={createNewSession}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                title="New Conversation"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Chat Sessions List */}
          <div className="flex-1 overflow-y-auto">
            {chatSessions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start chatting to create your first conversation
                </p>
              </div>
            ) : (
              <div className="p-2">
                {chatSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentSessionId === session.id
                        ? "bg-primary-50 border border-primary-200"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => setCurrentSessionId(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {session.title || "New Conversation"}
                        </h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-xs text-gray-500">
                            {session.message_count} messages
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {new Date(
                              session.last_message_at
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSession(session.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-opacity"
                        title="Delete conversation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
                >
                  <MessageSquare className="h-5 w-5" />
                </button>
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
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 border-b">
            <div className="container mx-auto">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    Your AI Drill Sergeant
                  </h1>
                  <p className="text-sm text-gray-600">
                    Here to crush your excuses and force you to get shit done
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

                      {/* Show goal creation card for assistant messages */}
                      {message.role === "assistant" &&
                        (() => {
                          const goalData = parseMessageForGoalCreation(
                            message.content
                          );
                          return (
                            goalData && (
                              <GoalCreatedCard
                                goal={goalData.goal}
                                tasks={goalData.tasks || []}
                              />
                            )
                          );
                        })()}

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
                    placeholder="Tell me what you're avoiding or making excuses about..."
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
                    setInput(
                      "I'm being a lazy piece of shit today, call me out"
                    )
                  }
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  I'm being weak 💀
                </button>
                <button
                  onClick={() =>
                    setInput("Stop me from making excuses and get me moving")
                  }
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  Crush my excuses ⚡
                </button>
                <button
                  onClick={() =>
                    setInput("Make this goal so simple I can't fail")
                  }
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors"
                >
                  Break it down hard 🔨
                </button>
                <button
                  onClick={() =>
                    setInput("I want to create an app but keep procrastinating")
                  }
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                >
                  App Development 📱
                </button>
                <button
                  onClick={() =>
                    setInput("I want to get fit but keep making excuses")
                  }
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                >
                  Get Fit 💪
                </button>
                <button
                  onClick={() =>
                    setInput("I want to learn a new skill but never start")
                  }
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                >
                  Learn Skills 🎓
                </button>
                <button
                  onClick={() =>
                    setInput("I want to build better habits but always quit")
                  }
                  className="px-3 py-1 text-xs bg-red-100 hover:bg-red-200 rounded-full text-red-600 transition-colors"
                >
                  Build Habits 🔄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
