import Link from "next/link";
import { Target, TrendingUp, Zap, Brain } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">FocusPilot</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="btn-ghost">
              Sign In
            </Link>
            <Link href="/login" className="btn-primary">
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            Transform Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              Productivity
            </span>{" "}
            with AI
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Meet your AI productivity coach. Set meaningful goals, break them
            into daily wins, and build unstoppable momentum with personalized
            guidance and streak tracking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login" className="btn-primary text-lg px-8 py-4">
              Start Your Journey 🚀
            </Link>
            <Link href="#features" className="btn-ghost text-lg px-8 py-4">
              Learn More
            </Link>
          </div>

          {/* Demo Preview */}
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-500 ml-4">
                  FocusPilot Dashboard
                </span>
              </div>

              <div className="text-left space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="streak-badge">🔥 5-day streak</div>
                  <span className="text-gray-600">
                    Good morning! Ready to hit your goals?
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Today's Focus
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" readOnly className="rounded" />
                      <span className="text-gray-700">
                        Write 500 words for novel
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="rounded"
                      />
                      <span className="text-gray-500 line-through">
                        Complete Duolingo lesson
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" readOnly className="rounded" />
                      <span className="text-gray-700">
                        30-minute morning run
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Your AI-Powered Productivity Arsenal
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to turn big dreams into daily victories
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Smart Goal Setting
              </h3>
              <p className="text-gray-600">
                AI helps you discover meaningful goals and breaks them into
                actionable tasks
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Daily Focus
              </h3>
              <p className="text-gray-600">
                Get personalized daily tasks that move you closer to your goals
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Streak Tracking
              </h3>
              <p className="text-gray-600">
                Build momentum with visual streak counters and motivational
                coaching
              </p>
            </div>

            {/* Feature 4 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Progress Analytics
              </h3>
              <p className="text-gray-600">
                Track your growth with insights and celebrate your achievements
              </p>
            </div>

            {/* Feature 5 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain className="h-6 w-6 text-secondary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                AI Coaching
              </h3>
              <p className="text-gray-600">
                Get personalized motivation and guidance from your AI
                productivity coach
              </p>
            </div>

            {/* Feature 6 */}
            <div className="card text-center">
              <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-success-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Habit Building
              </h3>
              <p className="text-gray-600">
                Transform goals into sustainable habits with consistent daily
                actions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Transform Your Productivity?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are achieving their goals with
            FocusPilot
          </p>
          <Link
            href="/login"
            className="btn bg-white text-primary-600 hover:bg-gray-50 text-lg px-8 py-4"
          >
            Start Free Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="h-6 w-6 text-primary-400" />
              <span className="text-xl font-bold">FocusPilot</span>
            </div>
            <p className="text-gray-400">
              © 2024 FocusPilot. Transform your productivity, one task at a
              time.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
