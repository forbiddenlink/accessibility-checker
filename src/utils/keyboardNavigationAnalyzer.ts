import type { Page } from "playwright-core";

export interface FocusableElement {
  tagName: string;
  tabIndex: number;
  hasVisibleFocus: boolean;
  ariaLabel?: string;
  role?: string;
  text?: string;
}

export interface NavigationIssue {
  type: "error" | "warning";
  message: string;
  element?: string;
  suggestion: string;
}

export interface KeyboardNavigationAnalysis {
  focusableElements: FocusableElement[];
  issues: NavigationIssue[];
}

export class KeyboardNavigationAnalyzer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async analyze(): Promise<KeyboardNavigationAnalysis> {
    return await this.page.evaluate(() => {
      const focusableElements: FocusableElement[] = [];
      const issues: NavigationIssue[] = [];

      const isElementVisible = (el: HTMLElement): boolean => {
        const style = window.getComputedStyle(el);
        return style.display !== "none" && style.visibility !== "hidden";
      };

      const hasAccessibleName = (el: HTMLElement): boolean => {
        const ariaLabel = el.getAttribute("aria-label");
        const ariaLabelledBy = el.getAttribute("aria-labelledby");
        const text = el.textContent?.trim();
        const title = el.getAttribute("title");
        return !!(ariaLabel || ariaLabelledBy || title || text);
      };

      const hasVisibleFocus = (el: HTMLElement): boolean => {
        const style = window.getComputedStyle(el);
        const hasOutline =
          style.outlineStyle !== "none" && style.outlineWidth !== "0px";
        const hasBoxShadow = style.boxShadow !== "none";
        return hasOutline || hasBoxShadow;
      };

      const truncate = (text: string): string => {
        return text.length > 500 ? `${text.slice(0, 500)}...` : text;
      };

      const focusable = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      focusable.forEach((element) => {
        const elementInfo: FocusableElement = {
          tagName: element.tagName.toLowerCase(),
          tabIndex: element.tabIndex,
          hasVisibleFocus: hasVisibleFocus(element),
          ariaLabel: element.getAttribute("aria-label") || undefined,
          role: element.getAttribute("role") || undefined,
          text: element.textContent?.trim() || undefined,
        };
        focusableElements.push(elementInfo);

        if (!isElementVisible(element)) {
          return;
        }

        if (element.tabIndex < 0) {
          issues.push({
            type: "warning",
            message: `Element with negative tabindex found: ${element.tagName.toLowerCase()}`,
            element: truncate(element.outerHTML),
            suggestion:
              "Avoid negative tabindex unless intentionally removing focus.",
          });
        }

        if (!elementInfo.hasVisibleFocus) {
          issues.push({
            type: "error",
            message: "Element lacks visible focus indicator",
            element: truncate(element.outerHTML),
            suggestion:
              "Add focus-visible styles with a clear outline or box shadow.",
          });
        }

        if (
          ["a", "button", "input", "select", "textarea"].includes(
            elementInfo.tagName,
          ) &&
          !hasAccessibleName(element)
        ) {
          issues.push({
            type: "error",
            message: `Interactive element (${elementInfo.tagName}) lacks an accessible name`,
            element: truncate(element.outerHTML),
            suggestion: "Add text content, aria-label, or aria-labelledby.",
          });
        }
      });

      const headings = Array.from(
        document.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6"),
      );
      let previousLevel = 0;
      headings.forEach((heading) => {
        const level = Number(heading.tagName[1]);
        if (previousLevel > 0 && level - previousLevel > 1) {
          issues.push({
            type: "warning",
            message: `Heading level skipped from h${previousLevel} to h${level}`,
            element: truncate(heading.outerHTML),
            suggestion: "Maintain sequential heading hierarchy.",
          });
        }
        previousLevel = level;
      });

      const skipLink = document.querySelector(
        'a[href^="#main"], a[href^="#content"]',
      );
      if (!skipLink) {
        issues.push({
          type: "warning",
          message: "No skip link found",
          suggestion: "Add a skip link at the top of the page.",
        });
      }

      return { focusableElements, issues };
    });
  }
}
