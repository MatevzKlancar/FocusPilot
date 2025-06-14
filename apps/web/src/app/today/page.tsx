"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Target,
  Calendar,
  CheckCircle,
  Circle,
  Plus,
  MessageCircle,
  X,
  Send,
} from "lucide-react";
import { MarkdownText } from "@/components/markdown-text";

export default function TodayPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState<string | null>(null);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const fetchTasks = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      const { data } = await supabase
        .from("tasks")
        .select(
          `
          *,
          goals (title)
        `
        )
        .eq("user_id", user.id)
        .eq("due_date", today)
        .order("created_at", { ascending: true });

      if (data) {
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const toggleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    setCompletingTask(taskId);

    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          completed_at: isCompleted ? null : new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;

      // Refetch tasks to get updated data
      await fetchTasks();
    } catch (error) {
      console.error("Error updating task:", error);
    } finally {
      setCompletingTask(null);
    }
  };

  const openTaskChat = (task: any) => {
    setSelectedTask(task);
    setChatModalOpen(true);
    // Initialize with a welcome message specific to the task
    setChatMessages([
      {
        id: "1",
        role: "assistant",
        content: `Hey! 👋 I'm here to help you with "${task.title}". What would you like to work on? I can help you:

• Break this down into smaller steps
• Find the best time to tackle it
• Overcome any obstacles you're facing
• Stay motivated and focused

What's on your mind about this task?`,
        timestamp: new Date(),
      },
    ]);
  };

  const closeTaskChat = () => {
    setChatModalOpen(false);
    setSelectedTask(null);
    setChatMessages([]);
    setChatInput("");
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setChatLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${apiUrl}/api/ai/task-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          message: chatInput.trim(),
          task: selectedTask,
          conversationHistory: chatMessages.slice(1), // Exclude initial welcome message
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          data.message ||
          "I'm here to help! Could you tell me more about what you need?",
        timestamp: new Date(),
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending chat message:", error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having some technical difficulties, but I'm still here to help! Try asking again in a moment. 🤖💙",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const completedTasks = tasks.filter((task) => task.completed_at);
  const pendingTasks = tasks.filter((task) => !task.completed_at);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="spinner w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">
                FocusPilot
              </span>
            </div>

            <nav className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/tasks/new"
                className="btn-primary flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Task</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Today's Focus 📅
            </h1>
            <p className="text-gray-600">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>

          {/* Progress Overview */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {tasks.length}
              </div>
              <div className="text-gray-600">Total Tasks</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {completedTasks.length}
              </div>
              <div className="text-gray-600">Completed</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-secondary-600 mb-2">
                {pendingTasks.length}
              </div>
              <div className="text-gray-600">Remaining</div>
            </div>
          </div>

          {/* Tasks */}
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  🎯 Tasks to Complete
                </h2>
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <button
                        onClick={() => toggleTaskCompletion(task.id, false)}
                        disabled={completingTask === task.id}
                        className="mt-1 text-gray-400 hover:text-success-600 transition-colors"
                      >
                        {completingTask === task.id ? (
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                            {task.goals?.title || "No Goal"}
                          </span>
                          {task.is_recurring && (
                            <span className="text-xs bg-secondary-100 text-secondary-700 px-2 py-1 rounded">
                              {task.cadence}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openTaskChat(task)}
                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Chat with AI about this task"
                      >
                        <MessageCircle className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  ✅ Completed Today
                </h2>
                <div className="space-y-3">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-start space-x-3 p-3 bg-success-50 rounded-lg"
                    >
                      <button
                        onClick={() => toggleTaskCompletion(task.id, true)}
                        disabled={completingTask === task.id}
                        className="mt-1 text-success-600 hover:text-gray-400 transition-colors"
                      >
                        {completingTask === task.id ? (
                          <div className="w-5 h-5 border-2 border-success-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <CheckCircle className="h-5 w-5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 line-through">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1 line-through">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                            {task.goals?.title || "No Goal"}
                          </span>
                          <span className="text-xs text-success-600">
                            Completed at{" "}
                            {new Date(task.completed_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Tasks */}
            {tasks.length === 0 && (
              <div className="card text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No tasks scheduled for today
                </h3>
                <p className="text-gray-600 mb-4">
                  Add some tasks to stay productive!
                </p>
                <Link href="/tasks/new" className="btn-primary">
                  Add Your First Task
                </Link>
              </div>
            )}
          </div>

          {/* Motivational Message */}
          {tasks.length > 0 && (
            <div className="card mt-8 bg-gradient-to-r from-primary-50 to-secondary-50">
              <div className="text-center">
                {pendingTasks.length === 0 ? (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      🎉 All done for today!
                    </h3>
                    <p className="text-gray-700">
                      Excellent work! You've completed all your tasks. Take a
                      moment to celebrate your progress!
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      💪 Keep going!
                    </h3>
                    <p className="text-gray-700">
                      You've got {pendingTasks.length} task
                      {pendingTasks.length !== 1 ? "s" : ""} left. Each
                      completed task brings you closer to your goals!
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Task Chat Modal */}
      {chatModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">AI Task Coach</h3>
                  <p className="text-sm text-gray-600 truncate max-w-xs">
                    "{selectedTask.title}"
                  </p>
                </div>
              </div>
              <button
                onClick={closeTaskChat}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-sm px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-primary-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <MarkdownText
                      content={message.content}
                      className="text-sm whitespace-pre-wrap"
                    />
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
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
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setChatInput("Help me break this task into smaller steps")
                  }
                  className="text-xs px-3 py-1 bg-primary-100 text-primary-700 rounded-full hover:bg-primary-200 transition-colors"
                  disabled={chatLoading}
                >
                  Break it down
                </button>
                <button
                  onClick={() =>
                    setChatInput(
                      "I'm procrastinating on this task. How can I get started?"
                    )
                  }
                  className="text-xs px-3 py-1 bg-secondary-100 text-secondary-700 rounded-full hover:bg-secondary-200 transition-colors"
                  disabled={chatLoading}
                >
                  Beat procrastination
                </button>
                <button
                  onClick={() =>
                    setChatInput(
                      "How long should this task take and when's the best time to do it?"
                    )
                  }
                  className="text-xs px-3 py-1 bg-success-100 text-success-700 rounded-full hover:bg-success-200 transition-colors"
                  disabled={chatLoading}
                >
                  Time & schedule
                </button>
                <button
                  onClick={() =>
                    setChatInput(
                      "What's the best way to stay focused while working on this?"
                    )
                  }
                  className="text-xs px-3 py-1 bg-warning-100 text-warning-700 rounded-full hover:bg-warning-200 transition-colors"
                  disabled={chatLoading}
                >
                  Focus tips
                </button>
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex space-x-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={handleChatKeyPress}
                  placeholder="Ask me anything about this task..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={chatLoading}
                />
                <button
                  onClick={sendChatMessage}
                  disabled={!chatInput.trim() || chatLoading}
                  className="btn-primary px-4 py-2 h-fit"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
