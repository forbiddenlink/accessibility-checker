import React, { useState } from 'react';
import { Tab } from '@headlessui/react';

interface LearningResource {
  id: string;
  title: string;
  category: 'tutorial' | 'casestudy' | 'bestpractice';
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

const INITIAL_RESOURCES: LearningResource[] = [
  {
    id: 'color-contrast',
    title: 'Understanding Color Contrast',
    category: 'tutorial',
    difficulty: 'beginner',
    content: `Color contrast is essential for making content readable by users with visual impairments.
    WCAG 2.1 requires a contrast ratio of at least 4.5:1 for normal text and 3:1 for large text.
    
    Key points:
    • Test all color combinations in your design
    • Consider both normal and large text requirements
    • Don't forget about hover and focus states
    • Test in different lighting conditions`,
    tags: ['color', 'contrast', 'WCAG', 'visual']
  },
  {
    id: 'semantic-html',
    title: 'Semantic HTML Best Practices',
    category: 'bestpractice',
    difficulty: 'beginner',
    content: `Using semantic HTML elements helps screen readers and other assistive technologies 
    understand your content structure.
    
    Best practices:
    • Use proper heading hierarchy (h1-h6)
    • Choose semantic elements over divs when possible
    • Include ARIA labels when needed
    • Ensure form elements have proper labels`,
    tags: ['HTML', 'semantic', 'structure', 'screen-readers']
  },
  {
    id: 'keyboard-nav',
    title: 'Keyboard Navigation Essentials',
    category: 'tutorial',
    difficulty: 'intermediate',
    content: `Many users rely on keyboard navigation. Ensuring your site works without a mouse is crucial.
    
    Key requirements:
    • All interactive elements must be focusable
    • Focus order should be logical
    • Provide visible focus indicators
    • Implement skip links for main content`,
    tags: ['keyboard', 'navigation', 'focus', 'interaction']
  }
];

export default function AccessibilityLearningHub() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = INITIAL_RESOURCES.filter(resource => {
    const matchesCategory = selectedCategory === 'all' || resource.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || resource.difficulty === selectedDifficulty;
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">Accessibility Learning Hub</h2>
      
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <input
          type="text"
          placeholder="Search resources..."
          className="w-full p-2 border rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All Categories</option>
            <option value="tutorial">Tutorials</option>
            <option value="casestudy">Case Studies</option>
            <option value="bestpractice">Best Practices</option>
          </select>
          
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="p-2 border rounded-lg"
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredResources.map(resource => (
          <article
            key={resource.id}
            className="p-6 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-xl font-semibold">{resource.title}</h3>
              <span className={`
                px-3 py-1 rounded-full text-sm
                ${resource.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                  resource.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}
              `}>
                {resource.difficulty}
              </span>
            </div>
            
            <p className="text-gray-600 mb-4 whitespace-pre-line">{resource.content}</p>
            
            <div className="flex flex-wrap gap-2">
              {resource.tags.map(tag => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  {tag}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
} 