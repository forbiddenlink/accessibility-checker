# Accessibility Color Checker

A modern, professional web application for checking color contrast accessibility according to WCAG guidelines. Built with Next.js, TypeScript, and Tailwind CSS.

![Accessibility Color Checker Screenshot](public/screenshot.png)

## Features

- 🎨 Real-time color contrast checking
- ✅ WCAG 2.1 compliance verification (AA and AAA levels)
- 👁 Color blindness simulation
- 💾 Save and manage color palettes
- 📱 Fully responsive design
- 🔄 RESTful API for external use
- ⌨️ Keyboard shortcuts for improved accessibility
- 📊 Detailed contrast analysis and suggestions
- 📤 Export results in multiple formats

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Vercel](https://vercel.com)

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/accessibility-checker.git
   cd accessibility-checker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Usage

The application provides a RESTful API for checking color contrast. Here's a quick example:

```javascript
fetch('/api/v1/contrast', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    foreground: '#000000',
    background: '#FFFFFF'
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

For detailed API documentation, visit `/api/docs` when running the application.

## Color Contrast Calculation

The application uses the following formula for calculating color contrast ratios according to WCAG 2.1:

1. Calculate relative luminance (L) for each color
2. Determine contrast ratio: (L1 + 0.05) / (L2 + 0.05)
   - Where L1 is the lighter color's luminance
   - And L2 is the darker color's luminance

## WCAG Compliance Levels

- **AA Level**
  - Normal text (4.5:1 minimum)
  - Large text (3:1 minimum)

- **AAA Level**
  - Normal text (7:1 minimum)
  - Large text (4.5:1 minimum)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Color blindness simulation algorithms from [Color Laboratory](https://www.color-blindness.com/)
