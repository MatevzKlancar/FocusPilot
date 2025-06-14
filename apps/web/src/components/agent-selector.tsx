"use client";

import { useState } from "react";
import {
  Bot,
  Dumbbell,
  BookOpen,
  Settings,
  ChevronDown,
  Sparkles,
  Lock,
} from "lucide-react";

interface Agent {
  id: string;
  name: string;
  description: string;
  available: boolean;
  icon: React.ReactNode;
}

// TODO: Import from lib-openai when agent system is fully integrated
const agents: Agent[] = [
  {
    id: "app-builder",
    name: "The App Builder",
    description:
      "Hardcore entrepreneurial drill sergeant for shipping products",
    available: true,
    icon: <Bot className="h-5 w-5" />,
  },
  {
    id: "performance-coach",
    name: "The Performance Coach",
    description: "Elite athletic mindset for fitness and performance goals",
    available: false,
    icon: <Dumbbell className="h-5 w-5" />,
  },
  {
    id: "master-craftsman",
    name: "The Master Craftsman",
    description: "Deep work specialist for skill mastery and creativity",
    available: false,
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    id: "systems-engineer",
    name: "The Systems Engineer",
    description: "Habit architect for sustainable behavior change",
    available: false,
    icon: <Settings className="h-5 w-5" />,
  },
];

interface AgentSelectorProps {
  currentAgentId: string;
  onAgentChange: (agentId: string) => void;
  className?: string;
}

export function AgentSelector({
  currentAgentId,
  onAgentChange,
  className = "",
}: AgentSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentAgent = agents.find((agent) => agent.id === currentAgentId);

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center space-x-2">
          {currentAgent?.icon}
          <div className="text-left">
            <p className="font-medium text-gray-900">{currentAgent?.name}</p>
            <p className="text-xs text-gray-500">{currentAgent?.description}</p>
          </div>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Choose Your Coach</h3>
            <p className="text-sm text-gray-600">
              Different agents for different goal types
            </p>
          </div>

          <div className="p-2">
            {agents.map((agent) => (
              <button
                key={agent.id}
                onClick={() => {
                  if (agent.available) {
                    onAgentChange(agent.id);
                    setIsOpen(false);
                  }
                }}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left ${
                  agent.id === currentAgentId
                    ? "bg-red-50 border border-red-200"
                    : agent.available
                    ? "hover:bg-gray-50"
                    : "opacity-50 cursor-not-allowed"
                }`}
                disabled={!agent.available}
              >
                <div className="flex-shrink-0">
                  {agent.available ? (
                    agent.icon
                  ) : (
                    <div className="relative">
                      {agent.icon}
                      <Lock className="h-3 w-3 absolute -top-1 -right-1 text-gray-400" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-medium ${
                        agent.id === currentAgentId
                          ? "text-red-900"
                          : "text-gray-900"
                      }`}
                    >
                      {agent.name}
                    </span>
                    {agent.id === currentAgentId && (
                      <Sparkles className="h-4 w-4 text-red-600" />
                    )}
                    {!agent.available && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm ${
                      agent.id === currentAgentId
                        ? "text-red-700"
                        : "text-gray-500"
                    }`}
                  >
                    {agent.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          <div className="p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-600">
              💡 Agent selection will be automatic based on your goal types in
              future updates
            </p>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
