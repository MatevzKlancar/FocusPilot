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
              <Target className="h-8 w-8 text-red-600" />
              <span className="text-2xl font-bold text-gray-900">
                FocusPilot
              </span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link
                href="/coach"
                className="flex items-center space-x-2 text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                <span>💀</span>
                <span>Drill Sergeant</span>
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
          {/* Hardcore Welcome */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Time to Get Your Shit Together 💀
            </h1>
            <p className="text-xl text-gray-600">
              No more excuses. No more "tomorrow." Your drill sergeant is
              waiting.
            </p>
          </div>

          {/* Reality Check Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="card text-center border-l-4 border-l-red-500">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {streak.current_streak}
              </div>
              <div className="text-gray-600">Current Streak</div>
              <div className="text-sm text-gray-500 mt-1">
                {streak.current_streak > 0
                  ? "Keep going, don't get soft"
                  : "Zero consistency. Pathetic."}
              </div>
            </div>
            <div className="card text-center border-l-4 border-l-orange-500">
              <div className="text-3xl font-bold text-orange-600 mb-2">
                {goals.length}
              </div>
              <div className="text-gray-600">Goals Set</div>
              <div className="text-sm text-gray-500 mt-1">
                {goals.length > 0
                  ? "At least you started"
                  : "No direction, no purpose"}
              </div>
            </div>
            <div className="card text-center border-l-4 border-l-green-500">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {completedTasks}
              </div>
              <div className="text-gray-600">Tasks Completed</div>
              <div className="text-sm text-gray-500 mt-1">
                {completedTasks > 0 ? "Actual progress" : "All talk, no action"}
              </div>
            </div>
          </div>

          {/* Single Call to Action */}
          <div className="card bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-red-900 mb-4">
                Stop Scrolling. Start Doing.
              </h2>
              <p className="text-lg text-red-800 mb-6">
                Your drill sergeant AI doesn't care about your feelings. It
                cares about results.
              </p>
            </div>

            {goals.length === 0 ? (
              <div className="text-center">
                <div className="bg-white p-8 rounded-lg border border-red-200 mb-6">
                  <h3 className="text-xl font-bold text-red-900 mb-4">
                    Reality Check: You Have No Goals 💀
                  </h3>
                  <p className="text-red-700 mb-4">
                    You're living without direction. Scrolling through life like
                    everyone else who talks about change but never does anything
                    about it.
                  </p>
                  <p className="text-red-700 mb-6">
                    Time to stop being comfortable with mediocrity. Your drill
                    sergeant will force you to pick something that matters and
                    break it down into daily accountability.
                  </p>
                  <Link
                    href="/coach"
                    className="btn-primary bg-red-600 hover:bg-red-700 text-lg px-8 py-4"
                  >
                    💀 Face Your Drill Sergeant
                  </Link>
                </div>
                <p className="text-sm text-red-600">
                  No forms. No bullshit. Just conversation that forces you to
                  commit.
                </p>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-white p-8 rounded-lg border border-red-200 mb-6">
                  <h3 className="text-xl font-bold text-red-900 mb-4">
                    You Have {goals.length} Goal{goals.length !== 1 ? "s" : ""}{" "}
                    - Now What? 🔥
                  </h3>
                  {completedTasks === 0 ? (
                    <>
                      <p className="text-red-700 mb-4">
                        Great, you set goals. But you haven't completed a single
                        task. You're just another person with wishful thinking.
                      </p>
                      <p className="text-red-700 mb-6">
                        Time to stop planning and start doing. Your drill
                        sergeant will call out every excuse you try to make.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-700 mb-4">
                        {completedTasks} completed tasks.{" "}
                        {streak.current_streak > 0
                          ? `${streak.current_streak}-day streak.`
                          : "Streak broken."}
                        {streak.current_streak > 3
                          ? " Not bad."
                          : " Needs work."}
                      </p>
                      <p className="text-red-700 mb-6">
                        Don't get comfortable. Consistency is what separates
                        winners from quitters. Keep pushing.
                      </p>
                    </>
                  )}
                  <Link
                    href="/coach"
                    className="btn-primary bg-red-600 hover:bg-red-700 text-lg px-8 py-4"
                  >
                    💀 Get Accountability Check
                  </Link>
                </div>
                <p className="text-sm text-red-600">
                  Your AI coach knows your progress. No hiding from the truth.
                </p>
              </div>
            )}
          </div>

          {/* Goals Overview (if they exist) */}
          {goals.length > 0 && (
            <div className="card mt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Your Commitments
                </h2>
                <Link
                  href="/coach"
                  className="text-red-600 hover:text-red-700 font-medium"
                >
                  Add More Goals →
                </Link>
              </div>

              <div className="space-y-4">
                {goals.map((goal: any) => {
                  const goalTasks = tasks.filter((t) => t.goal_id === goal.id);
                  const completedGoalTasks = goalTasks.filter(
                    (t) => t.completed_at
                  );
                  const progressPercent =
                    goalTasks.length > 0
                      ? Math.round(
                          (completedGoalTasks.length / goalTasks.length) * 100
                        )
                      : 0;

                  return (
                    <div
                      key={goal.id}
                      className="border border-gray-200 rounded-lg p-4 hover:border-red-300 transition-colors"
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
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-gray-500">
                              {goalTasks.length} tasks total
                            </span>
                            <span
                              className={`font-medium ${
                                progressPercent > 50
                                  ? "text-green-600"
                                  : progressPercent > 0
                                  ? "text-orange-600"
                                  : "text-red-600"
                              }`}
                            >
                              {progressPercent}% complete
                            </span>
                            {goal.target_date && (
                              <span className="text-gray-500">
                                Due:{" "}
                                {new Date(
                                  goal.target_date
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Link
                            href="/coach"
                            className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-full hover:bg-red-200"
                          >
                            Get Coaching
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Message */}
          <div className="card mt-8 bg-gray-900 text-white">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                Ready to Stop Making Excuses?
              </h3>
              <p className="text-gray-300 mb-4">
                Your drill sergeant AI is waiting. No gentle motivation. No
                participation trophies. Just brutal accountability.
              </p>
              <Link
                href="/coach"
                className="inline-flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <span>💀</span>
                <span>Face the Truth</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
