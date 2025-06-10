"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function NewGoalPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to coach after a brief message
    const timer = setTimeout(() => {
      router.push("/coach");
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center space-x-4 mb-8">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          {/* Redirect Message */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <MessageCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Hold Up, Soldier! 💀
              </h1>
              <p className="text-lg text-gray-700 mb-4">
                We don't do boring forms here. Your drill sergeant AI will
                handle goal creation through conversation.
              </p>
              <p className="text-gray-600 mb-6">
                No more filling out paperwork like a corporate drone. Time for
                some real coaching.
              </p>
            </div>

            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Redirecting you to your AI coach in 3 seconds...
              </p>

              <div className="flex space-x-4 justify-center">
                <Link href="/coach" className="btn-primary">
                  💀 Talk to Drill Sergeant Now
                </Link>
                <Link href="/dashboard" className="btn-secondary">
                  ← Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="mt-8 p-4 bg-red-50 rounded-lg">
              <p className="text-sm text-red-700 font-medium">
                Why the change?
              </p>
              <p className="text-sm text-red-600 mt-1">
                The AI can interrogate you, demand time commitments, and create
                better goals than any form ever could. Stop wasting time and
                start talking to your coach.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
