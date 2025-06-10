import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Target, LogOut } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch user's data
  const [goalsResult, tasksResult, streakResult] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", user.id),
    supabase.from("tasks").select("*").eq("user_id", user.id),
    supabase.from("streaks").select("*").eq("user_id", user.id).single(),
  ]);

  const goals = goalsResult.data || [];
  const tasks = tasksResult.data || [];
  const streak = streakResult.data || { current_streak: 0, best_streak: 0 };

  const completedTasks = tasks.filter((task) => task.completed_at).length;

  const handleSignOut = async () => {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">
                FocusPilot
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                href="/coach"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 bg-gradient-to-r from-primary-50 to-secondary-50 px-3 py-2 rounded-lg"
              >
                <span>🤖</span>
                <span>AI Coach</span>
              </Link>
              <span className="text-gray-600">Welcome, {user.email}</span>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Your FocusPilot Dashboard! 🎯
            </h1>
            <p className="text-xl text-gray-600">
              Your productivity journey starts here. Let's turn your goals into
              achievements!
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {streak.current_streak}
              </div>
              <div className="text-gray-600">Current Streak</div>
              <div className="text-sm text-gray-500 mt-1">
                🔥{" "}
                {streak.current_streak > 0
                  ? "Keep going!"
                  : "Start your streak!"}
              </div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-secondary-600 mb-2">
                {goals.length}
              </div>
              <div className="text-gray-600">Goals Created</div>
              <div className="text-sm text-gray-500 mt-1">
                🎯 {goals.length > 0 ? "Great start!" : "Start dreaming big"}
              </div>
            </div>
            <div className="card text-center">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {completedTasks}
              </div>
              <div className="text-gray-600">Tasks Completed</div>
              <div className="text-sm text-gray-500 mt-1">
                ✅ {completedTasks > 0 ? "Well done!" : "One step at a time"}
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="card">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              🚀 Ready to Get Started?
            </h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4 p-4 bg-primary-50 rounded-lg">
                <div className="w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Set Your First Goal
                  </h3>
                  <p className="text-gray-600 mb-2">
                    What would you like to achieve? Our AI will help break it
                    down into manageable steps.
                  </p>
                  <Link href="/goals/new" className="btn-primary">
                    Create Your First Goal
                  </Link>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-secondary-50 rounded-lg">
                <div className="w-8 h-8 bg-secondary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Get Your Daily Tasks
                  </h3>
                  <p className="text-gray-600 mb-2">
                    View and complete your tasks scheduled for today to build
                    momentum.
                  </p>
                  <Link href="/today" className="btn-secondary">
                    View Today's Tasks
                  </Link>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 bg-success-50 rounded-lg">
                <div className="w-8 h-8 bg-success-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    Chat with Your AI Coach
                  </h3>
                  <p className="text-gray-600 mb-2">
                    Get personalized motivation, goal breakdowns, and habit
                    advice from your AI productivity coach.
                  </p>
                  <Link href="/coach" className="btn-success">
                    Start Coaching
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Your Goals */}
          {goals.length > 0 && (
            <div className="card mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  🎯 Your Goals
                </h2>
                <Link href="/goals/new" className="btn-secondary">
                  Add New Goal
                </Link>
              </div>

              <div className="space-y-4">
                {goals.map((goal: any) => (
                  <div
                    key={goal.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {goal.title}
                        </h3>
                        {goal.description && (
                          <p className="text-gray-600 text-sm mb-2">
                            {goal.description}
                          </p>
                        )}
                        {goal.target_date && (
                          <p className="text-sm text-gray-500">
                            Target:{" "}
                            {new Date(goal.target_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/tasks/new?goalId=${goal.id}`}
                          className="text-sm bg-primary-100 text-primary-700 px-3 py-1 rounded-full hover:bg-primary-200"
                        >
                          Add Task
                        </Link>
                        <div className="text-sm text-gray-500">
                          Created{" "}
                          {new Date(goal.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Coach Section */}
          <div className="card mt-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              🤖 Your AI Productivity Coach
            </h2>
            <div className="bg-gradient-to-r from-primary-50 to-secondary-50 p-6 rounded-lg">
              {/* Personalized Message Based on User's Current State */}
              {goals.length === 0 ? (
                <>
                  <p className="text-gray-700 mb-4">
                    "Hey there! 👋 I'm excited to be your productivity coach. I
                    notice you haven't set any goals yet - that's the perfect
                    place to start!
                  </p>
                  <p className="text-gray-700 mb-4">I can help you:</p>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 mb-4">
                    <li>Turn big dreams into smart, achievable goals</li>
                    <li>Break goals down into daily actionable tasks</li>
                    <li>Build consistent habits and momentum</li>
                    <li>Stay motivated with personalized guidance</li>
                  </ul>
                  <p className="text-gray-700 mb-4">
                    Ready to start your productivity journey? Let's create your
                    first goal together! 🎯"
                  </p>
                  <div className="flex space-x-3">
                    <Link href="/goals/new" className="btn-primary">
                      🚀 Create Your First Goal
                    </Link>
                    <Link href="/coach" className="btn-secondary">
                      💬 Chat with Coach
                    </Link>
                  </div>
                </>
              ) : completedTasks === 0 && tasks.length > 0 ? (
                <>
                  <p className="text-gray-700 mb-4">
                    "I see you have {goals.length} goal
                    {goals.length !== 1 ? "s" : ""} and {tasks.length} task
                    {tasks.length !== 1 ? "s" : ""} set up - great work on the
                    planning! 📋
                  </p>
                  <p className="text-gray-700 mb-4">
                    Now comes the fun part: taking action! Every completed task
                    builds momentum and gets you closer to your dreams.
                  </p>
                  <p className="text-gray-700 mb-4">
                    💡 Pro tip: Start with just ONE small task today. Progress
                    beats perfection every time!"
                  </p>
                  <Link href="/today" className="btn-primary">
                    ✅ View Today's Tasks
                  </Link>
                </>
              ) : streak.current_streak > 0 ? (
                <>
                  <p className="text-gray-700 mb-4">
                    "Outstanding! 🔥 You're on a {streak.current_streak}-day
                    streak and have completed {completedTasks} task
                    {completedTasks !== 1 ? "s" : ""} - I'm genuinely impressed!
                  </p>
                  <p className="text-gray-700 mb-4">
                    You're proving to yourself what consistency can achieve.
                    This momentum you're building? It's going to compound into
                    something amazing.
                  </p>
                  <p className="text-gray-700 mb-4">
                    Keep riding this wave - you've got this! 💪"
                  </p>
                  <div className="flex space-x-3">
                    <Link href="/today" className="btn-primary">
                      Continue Streak
                    </Link>
                    <Link href="/goals/new" className="btn-secondary">
                      Add New Goal
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-gray-700 mb-4">
                    "Hey champion! 🌟 I see you've completed {completedTasks}{" "}
                    task{completedTasks !== 1 ? "s" : ""} across {goals.length}{" "}
                    goal{goals.length !== 1 ? "s" : ""} - every step forward
                    counts!
                  </p>
                  <p className="text-gray-700 mb-4">
                    {tasks.filter((task) => !task.completed_at).length > 0
                      ? `You have ${
                          tasks.filter((task) => !task.completed_at).length
                        } task${
                          tasks.filter((task) => !task.completed_at).length !==
                          1
                            ? "s"
                            : ""
                        } waiting for your attention. Ready to make more progress?`
                      : "Time to plan your next moves! What would you like to focus on?"}
                  </p>
                  <div className="flex space-x-3">
                    {tasks.filter((task) => !task.completed_at).length > 0 ? (
                      <Link href="/today" className="btn-primary">
                        View Tasks
                      </Link>
                    ) : (
                      <Link href="/tasks/new" className="btn-primary">
                        Add Tasks
                      </Link>
                    )}
                    <Link href="/goals/new" className="btn-secondary">
                      New Goal
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
