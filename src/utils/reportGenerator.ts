import jsPDF from 'jspdf';
import { AccessibilityTestResult, AccessibilityViolation } from './accessibilityTesting';
import { ColorResult } from '@/types';

interface ReportOptions {
  includeScreenshots?: boolean;
  includeDatetime?: boolean;
  includeColorAnalysis?: boolean;
}

export class AccessibilityReportGenerator {
  private doc: jsPDF;
  private currentY: number;
  private pageWidth: number;
  private margins: { left: number; right: number };

  constructor() {
    this.doc = new jsPDF();
    this.currentY = 20;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.margins = { left: 20, right: 20 };
  }

  private addHeading(text: string, size: number = 16) {
    this.doc.setFontSize(size);
    this.doc.text(text, this.margins.left, this.currentY);
    this.currentY += 10;
  }

  private addParagraph(text: string, size: number = 12) {
    this.doc.setFontSize(size);
    const splitText = this.doc.splitTextToSize(
      text,
      this.pageWidth - this.margins.left - this.margins.right
    );
    
    splitText.forEach((line: string) => {
      if (this.currentY > this.doc.internal.pageSize.height - 20) {
        this.doc.addPage();
        this.currentY = 20;
      }
      this.doc.text(line, this.margins.left, this.currentY);
      this.currentY += 7;
    });
    
    this.currentY += 5;
  }

  private addColorContrastSection(colorResult: ColorResult) {
    this.addHeading('Color Contrast Analysis', 14);
    
    const contrastInfo = [
      `Contrast Ratio: ${colorResult.contrast.toFixed(2)}:1`,
      `WCAG AA Compliance: ${colorResult.AA ? 'Pass' : 'Fail'}`,
      `WCAG AAA Compliance: ${colorResult.AAA ? 'Pass' : 'Fail'}`,
      `WCAG AA Large Text: ${colorResult.AALarge ? 'Pass' : 'Fail'}`,
      `WCAG AAA Large Text: ${colorResult.AAALarge ? 'Pass' : 'Fail'}`,
    ];

    contrastInfo.forEach(info => {
      this.addParagraph(info);
    });
  }

  private addViolationsSection(violations: AccessibilityViolation[]) {
    this.addHeading('Accessibility Violations', 14);
    
    if (violations.length === 0) {
      this.addParagraph('No accessibility violations found.');
      return;
    }

    violations.forEach((violation, index) => {
      this.addParagraph(`${index + 1}. ${violation.id} (${violation.impact})`);
      this.addParagraph(`Description: ${violation.description}`);
      this.addParagraph(`Help: ${violation.help}`);
      this.addParagraph(`More Information: ${violation.helpUrl}`);
      
      if (violation.nodes.length > 0) {
        this.addParagraph('Affected Elements:');
        violation.nodes.forEach(node => {
          this.addParagraph(`- ${node}`, 10);
        });
      }
      
      this.currentY += 5;
    });
  }

  generateReport(
    testResults: AccessibilityTestResult,
    colorResult?: ColorResult,
    options: ReportOptions = {}
  ): Uint8Array {
    // Title
    this.addHeading('Accessibility Audit Report', 20);

    // Date and Time
    if (options.includeDatetime) {
      this.addParagraph(`Generated: ${new Date().toLocaleString()}`);
      this.currentY += 10;
    }

    // Summary
    this.addHeading('Summary', 16);
    this.addParagraph(`Total Issues Found: ${testResults.violations.length}`);
    this.addParagraph(`Passes: ${testResults.passes}`);
    this.addParagraph(`Incomplete Tests: ${testResults.incomplete}`);
    this.addParagraph(`Inapplicable Tests: ${testResults.inapplicable}`);
    this.currentY += 10;

    // Color Contrast Analysis
    if (options.includeColorAnalysis && colorResult) {
      this.addColorContrastSection(colorResult);
      this.currentY += 10;
    }

    // Violations
    this.addViolationsSection(testResults.violations);

    // Generate PDF
    const arrayBuffer = this.doc.output('arraybuffer');
    return new Uint8Array(arrayBuffer);
  }

  downloadReport(
    testResults: AccessibilityTestResult,
    colorResult?: ColorResult,
    options: ReportOptions = {}
  ): void {
    this.generateReport(testResults, colorResult, options);
    this.doc.save('accessibility-report.pdf');
  }
} 