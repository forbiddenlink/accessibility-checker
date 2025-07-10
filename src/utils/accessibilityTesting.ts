import { run, configure, Result, AxeResults } from 'axe-core';

export interface AccessibilityViolation {
  id: string;
  impact: string;
  description: string;
  nodes: string[];
  help: string;
  helpUrl: string;
}

export interface AccessibilityTestResult {
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
  inapplicable: number;
}

configure({
  rules: [
    { id: 'color-contrast', enabled: true },
    { id: 'aria-roles', enabled: true },
    { id: 'aria-valid-attr', enabled: true },
    { id: 'heading-order', enabled: true },
    { id: 'label', enabled: true },
    { id: 'landmark-one-main', enabled: true },
    { id: 'region', enabled: true },
  ],
});

export const runAccessibilityTests = async (
  selector: string = 'body'
): Promise<AccessibilityTestResult> => {
  try {
    const results: AxeResults = await run(selector);

    const violations: AccessibilityViolation[] = results.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact || 'minor',
      description: violation.description,
      nodes: violation.nodes.map((node) => node.html),
      help: violation.help,
      helpUrl: violation.helpUrl,
    }));

    return {
      violations,
      passes: results.passes.length,
      incomplete: results.incomplete.length,
      inapplicable: results.inapplicable.length,
    };
  } catch (error) {
    console.error('Error running accessibility tests:', error);
    throw new Error('Failed to run accessibility tests');
  }
};

export const getAccessibilityScore = (results: AccessibilityTestResult): number => {
  const totalIssues = results.violations.length;
  const baseScore = 100;
  const deductionPerViolation = {
    critical: 20,
    serious: 10,
    moderate: 5,
    minor: 2,
  };

  let score = baseScore;

  results.violations.forEach((violation) => {
    score -= deductionPerViolation[violation.impact as keyof typeof deductionPerViolation] || 2;
  });

  return Math.max(0, score);
};

export const generateAccessibilityReport = (
  results: AccessibilityTestResult
): string => {
  const score = getAccessibilityScore(results);
  const timestamp = new Date().toISOString();

  let report = `# Accessibility Audit Report\n\n`;
  report += `Generated: ${timestamp}\n`;
  report += `Overall Score: ${score}/100\n\n`;

  report += `## Summary\n`;
  report += `- Passes: ${results.passes}\n`;
  report += `- Violations: ${results.violations.length}\n`;
  report += `- Incomplete: ${results.incomplete}\n`;
  report += `- Inapplicable: ${results.inapplicable}\n\n`;

  if (results.violations.length > 0) {
    report += `## Violations\n\n`;
    results.violations.forEach((violation) => {
      report += `### ${violation.id} (${violation.impact})\n`;
      report += `${violation.description}\n\n`;
      report += `Help: ${violation.help}\n`;
      report += `More info: ${violation.helpUrl}\n\n`;
      report += `Affected elements:\n`;
      violation.nodes.forEach((node) => {
        report += `\`\`\`html\n${node}\n\`\`\`\n`;
      });
      report += `\n`;
    });
  }

  return report;
}; 