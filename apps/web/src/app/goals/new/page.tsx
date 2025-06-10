"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Target, ArrowLeft, Sparkles, Lightbulb } from "lucide-react";

export default function NewGoalPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const router = useRouter();
  const supabase = createClient();

  const getAISuggestions = async () => {
    if (!title.trim()) return;

    setAiLoading(true);
    try {
      // Simple AI suggestion using a basic prompt
      const prompt = `For the goal "${title}"${
        description ? ` (${description})` : ""
      }, suggest 3-5 specific, actionable tasks that would help achieve this goal. Each task should be:
1. Specific and measurable
2. Achievable within a reasonable timeframe
3. Contributing directly to the goal

Format as a simple list. Be practical and focus on first steps and ongoing actions.`;

      // For now, let's create some smart suggestions based on common goal patterns
      let suggestions = [];

      const goalLower = title.toLowerCase();

      if (
        goalLower.includes("write") ||
        goalLower.includes("novel") ||
        goalLower.includes("book")
      ) {
        suggestions = [
          "Write 500 words daily",
          "Create detailed chapter outline",
          "Set up dedicated writing space",
          "Research publishing options",
          "Join a writers group for feedback",
        ];
      } else if (goalLower.includes("learn") || goalLower.includes("study")) {
        suggestions = [
          "Practice 30 minutes daily",
          "Complete one lesson/chapter per week",
          "Find practice partner or study group",
          "Take online course or tutorial",
          "Set up regular review schedule",
        ];
      } else if (
        goalLower.includes("fitness") ||
        goalLower.includes("exercise") ||
        goalLower.includes("fit")
      ) {
        suggestions = [
          "Exercise 30 minutes, 3 times per week",
          "Track daily nutrition and water intake",
          "Set up home workout space",
          "Schedule regular health checkups",
          "Find workout accountability partner",
        ];
      } else if (
        goalLower.includes("business") ||
        goalLower.includes("startup") ||
        goalLower.includes("app")
      ) {
        suggestions = [
          "Research target market and competitors",
          "Create MVP or prototype",
          "Set up basic business structure",
          "Build landing page or initial marketing",
          "Network with potential customers",
        ];
      } else {
        // Generic suggestions
        suggestions = [
          "Research and plan first steps",
          "Set up daily/weekly practice routine",
          "Find mentor or learning resources",
          "Track progress with measurable metrics",
          "Connect with community or support group",
        ];
      }

      setAiSuggestions(suggestions);
    } catch (error) {
      console.error("AI suggestion error:", error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Create the goal
      const { data: goal, error: goalError } = await supabase
        .from("goals")
        .insert({
          title,
          description,
          target_date: targetDate || null,
          user_id: user.id,
        })
        .select()
        .single();

      if (goalError) throw goalError;

      // Create suggested tasks if any were generated
      if (aiSuggestions.length > 0 && goal) {
        const today = new Date();
        const tasksToCreate = aiSuggestions.map((suggestion, index) => {
          const dueDate = new Date(today);
          dueDate.setDate(today.getDate() + index); // Spread tasks over next few days

          return {
            title: suggestion,
            description: `AI-suggested task for: ${title}`,
            due_date: dueDate.toISOString().split("T")[0],
            goal_id: goal.id,
            user_id: user.id,
            is_recurring:
              suggestion.toLowerCase().includes("daily") ||
              suggestion.toLowerCase().includes("weekly"),
            cadence: suggestion.toLowerCase().includes("daily")
              ? "daily"
              : suggestion.toLowerCase().includes("weekly")
              ? "weekly"
              : null,
          };
        });

        const { error: tasksError } = await supabase
          .from("tasks")
          .insert(tasksToCreate);

        if (tasksError) {
          console.error("Error creating AI tasks:", tasksError);
          // Don't fail the whole operation if tasks fail
        }
      }

      router.push("/dashboard");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">
                FocusPilot
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Your Goal 🎯
            </h1>
            <p className="text-gray-600">
              Let AI help you break down your goal into actionable steps
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="label">
                  Goal Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Write a novel, Learn Spanish, Get fit"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="label">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="textarea"
                  rows={4}
                  placeholder="Describe your goal in more detail. What does success look like?"
                />
              </div>

              {/* Target Date */}
              <div>
                <label htmlFor="targetDate" className="label">
                  Target Date (Optional)
                </label>
                <input
                  id="targetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="input"
                />
                <p className="text-sm text-gray-500 mt-1">
                  When would you like to achieve this goal?
                </p>
              </div>

              {/* AI Suggestions */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                    <Sparkles className="h-5 w-5 text-primary-600" />
                    <span>AI Task Suggestions</span>
                  </h3>
                  <button
                    type="button"
                    onClick={getAISuggestions}
                    disabled={!title.trim() || aiLoading}
                    className="btn-secondary text-sm"
                  >
                    {aiLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-secondary-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Thinking...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <Lightbulb className="h-4 w-4" />
                        <span>Get Suggestions</span>
                      </div>
                    )}
                  </button>
                </div>

                {aiSuggestions.length > 0 && (
                  <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 mb-3">
                      🤖 Here are some AI-suggested tasks to help you achieve
                      your goal:
                    </p>
                    <ul className="space-y-2">
                      {aiSuggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-primary-600 mt-1">•</span>
                          <span className="text-sm text-gray-700">
                            {suggestion}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-gray-600 mt-3">
                      These tasks will be automatically created when you save
                      your goal!
                    </p>
                  </div>
                )}

                {title.trim() && aiSuggestions.length === 0 && !aiLoading && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">
                      Click "Get Suggestions" to see AI-generated tasks for your
                      goal
                    </p>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading || !title.trim()}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Creating Goal...
                    </div>
                  ) : (
                    <>
                      Create Goal
                      {aiSuggestions.length > 0 &&
                        ` + ${aiSuggestions.length} Tasks`}
                    </>
                  )}
                </button>
                <Link href="/dashboard" className="btn-ghost">
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">
              💡 Tips for Great Goals
            </h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Make it specific and measurable</li>
              <li>• Set a realistic but challenging timeline</li>
              <li>• Think about why this goal matters to you</li>
              <li>• Let AI help break it down into daily actions</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
