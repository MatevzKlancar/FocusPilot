"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Target, ArrowLeft, Calendar } from "lucide-react";

export default function NewTaskPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [cadence, setCadence] = useState("daily");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<any[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const goalId = searchParams.get("goalId");
  const supabase = createClient();

  useEffect(() => {
    const fetchGoals = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data) {
        setGoals(data);
        // Pre-select goal if goalId is provided in URL
        if (goalId && data.find((g) => g.id === goalId)) {
          setSelectedGoalId(goalId);
        } else if (data.length > 0) {
          setSelectedGoalId(data[0].id);
        }
      }
    };

    fetchGoals();
  }, [goalId, supabase]);

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

      if (!selectedGoalId) {
        setError("Please select a goal for this task");
        return;
      }

      const { error } = await supabase.from("tasks").insert({
        title,
        description,
        due_date: dueDate || null,
        is_recurring: isRecurring,
        cadence: isRecurring ? cadence : null,
        goal_id: selectedGoalId,
        user_id: user.id,
      });

      if (error) throw error;

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
              Add New Task ✅
            </h1>
            <p className="text-gray-600">
              Break down your goal into actionable tasks
            </p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Goal Selection */}
              <div>
                <label htmlFor="goalId" className="label">
                  Goal *
                </label>
                <select
                  id="goalId"
                  value={selectedGoalId}
                  onChange={(e) => setSelectedGoalId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">Select a goal</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Task Title */}
              <div>
                <label htmlFor="title" className="label">
                  Task Title *
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="e.g., Write 500 words, Practice Spanish for 30 min"
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
                  rows={3}
                  placeholder="Add more details about this task..."
                />
              </div>

              {/* Due Date */}
              <div>
                <label htmlFor="dueDate" className="label">
                  Due Date
                </label>
                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input"
                />
              </div>

              {/* Recurring Task */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    id="recurring"
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded"
                  />
                  <label
                    htmlFor="recurring"
                    className="text-sm font-medium text-gray-700"
                  >
                    This is a recurring task
                  </label>
                </div>

                {isRecurring && (
                  <div>
                    <label htmlFor="cadence" className="label">
                      Frequency
                    </label>
                    <select
                      id="cadence"
                      value={cadence}
                      onChange={(e) => setCadence(e.target.value)}
                      className="input"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
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
                  disabled={loading || !title.trim() || !selectedGoalId}
                  className="btn-primary flex-1"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                      Adding Task...
                    </div>
                  ) : (
                    "Add Task"
                  )}
                </button>
                <Link href="/dashboard" className="btn-ghost">
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          {/* Tips */}
          <div className="mt-8 bg-gradient-to-r from-success-50 to-primary-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Task Tips</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Make tasks specific and actionable</li>
              <li>• Use recurring tasks for daily habits</li>
              <li>• Break big tasks into smaller ones</li>
              <li>• Set realistic due dates</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
