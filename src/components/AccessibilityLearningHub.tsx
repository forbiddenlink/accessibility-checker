"use client";

import { useState } from "react";

interface LearningResource {
  id: string;
  title: string;
  category: "tutorial" | "casestudy" | "bestpractice";
  content: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

const INITIAL_RESOURCES: LearningResource[] = [
  {
    id: "color-contrast",
    title: "Understanding Color Contrast",
    category: "tutorial",
    difficulty: "beginner",
    content: `Color contrast is essential for making content readable by users with visual impairments.
    WCAG 2.1 requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
    
    Key points:
    • Test all color combinations in your design
    • Consider both normal and large text requirements
    • Don't forget about hover and focus states
    • Test in different lighting conditions`,
    tags: ["color", "contrast", "WCAG", "visual"],
  },
  {
    id: "semantic-html",
    title: "Semantic HTML Best Practices",
    category: "bestpractice",
    difficulty: "beginner",
    content: `Using semantic HTML elements helps screen readers and other assistive technologies 
    understand your content structure.
    
    Best practices:
    • Use proper heading hierarchy (h1-h6)
    • Choose semantic elements over divs when possible
    • Include ARIA labels when needed
    • Ensure form elements have proper labels`,
    tags: ["HTML", "semantic", "structure", "screen-readers"],
  },
  {
    id: "keyboard-nav",
    title: "Keyboard Navigation Essentials",
    category: "tutorial",
    difficulty: "intermediate",
    content: `Many users rely on keyboard navigation. Ensuring your site works without a mouse is crucial.
    
    Key requirements:
    • All interactive elements must be focusable
    • Focus order should be logical
    • Provide visible focus indicators
    • Implement skip links for main content`,
    tags: ["keyboard", "navigation", "focus", "interaction"],
  },
];

export default function AccessibilityLearningHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredResources = INITIAL_RESOURCES.filter((resource) => {
    const matchesCategory =
      selectedCategory === "all" || resource.category === selectedCategory;
    const matchesDifficulty =
      selectedDifficulty === "all" ||
      resource.difficulty === selectedDifficulty;
    const matchesSearch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  return (
    <div className="glass-morphism p-8 rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 text-transparent bg-clip-text">
          Accessibility Learning Hub
        </h2>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 opacity-20 group-hover:opacity-100 transition duration-500 blur"></div>
          <input
            type="text"
            placeholder="Search resources..."
            className="relative w-full p-3 bg-black/50 border border-white/10 rounded-lg text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all backdrop-blur-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="p-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-10 cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="tutorial">Tutorials</option>
              <option value="casestudy">Case Studies</option>
              <option value="bestpractice">Best Practices</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          <div className="relative">
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="p-3 bg-[#0d1117] border border-white/10 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none pr-10 cursor-pointer"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/50">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map((resource) => (
          <article
            key={resource.id}
            className="p-6 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-all hover:border-white/10 hover:shadow-2xl group"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                {resource.title}
              </h3>
              <span
                className={`
                px-3 py-1 rounded-full text-xs font-medium border
                ${
                  resource.difficulty === "beginner"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : resource.difficulty === "intermediate"
                      ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                }
              `}
              >
                {resource.difficulty}
              </span>
            </div>

            <p className="text-gray-400 mb-6 whitespace-pre-line text-sm leading-relaxed">
              {resource.content}
            </p>

            <div className="flex flex-wrap gap-2 mt-auto">
              {resource.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-white/5 border border-white/5 rounded text-xs text-gray-400 font-mono"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
