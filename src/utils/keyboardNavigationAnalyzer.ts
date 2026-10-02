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
    // Put the page in keyboard modality first. Chromium only matches
    // :focus-visible on a scripted focus() when the last input was the
    // keyboard, so without a real key press the focus ring a user sees on Tab
    // would be invisible to the checks below.
    await this.page.keyboard.press("Tab");

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

      // Transitions would leave computed styles at their start values right
      // after focus(), hiding a ring that fades in. Freeze them while measuring.
      const freeze = document.createElement("style");
      freeze.textContent =
        "*,*::before,*::after{transition:none!important;animation:none!important}";
      document.head.appendChild(freeze);

      const snapshot = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        const outlineVisible =
          style.outlineStyle !== "none" &&
          parseFloat(style.outlineWidth) > 0 &&
          style.outlineColor !== "transparent" &&
          !/rgba\(.*,\s*0\)$/.test(style.outlineColor);
        return {
          outline: outlineVisible
            ? `${style.outlineStyle}|${style.outlineWidth}|${style.outlineColor}|${style.outlineOffset}`
            : "none",
          boxShadow: style.boxShadow,
          border: `${style.borderTopWidth}|${style.borderRightWidth}|${style.borderBottomWidth}|${style.borderLeftWidth}|${style.borderTopColor}|${style.borderRightColor}|${style.borderBottomColor}|${style.borderLeftColor}`,
          background: style.backgroundColor,
          textDecoration: style.textDecorationLine,
          color: style.color,
        };
      };

      /**
       * Focus the element and compare its styles against the unfocused state.
       * A focus indicator is something that CHANGES when focus arrives: an
       * outline, a box-shadow, a border, a background, a color or an
       * underline. Reading an unfocused element (the old behavior) cannot see
       * a :focus-visible rule, and treats a decorative shadow that is always
       * there as an indicator. Returns null when the element will not take
       * focus (disabled, inert), since that is not a 2.4.7 failure.
       */
      const measureFocus = (el: HTMLElement): boolean | null => {
        // The Tab press in analyze() leaves the first control focused; blur it
        // so "before" really is the unfocused state.
        (document.activeElement as HTMLElement | null)?.blur();
        const before = snapshot(el);
        el.focus({ preventScroll: true, focusVisible: true } as FocusOptions);
        if (document.activeElement !== el) return null;
        const after = snapshot(el);
        el.blur();

        if (after.outline !== "none" && after.outline !== before.outline) {
          return true;
        }
        return (
          after.boxShadow !== before.boxShadow ||
          after.border !== before.border ||
          after.background !== before.background ||
          after.textDecoration !== before.textDecoration ||
          after.color !== before.color
        );
      };

      const truncate = (text: string): string => {
        return text.length > 500 ? `${text.slice(0, 500)}...` : text;
      };

      const focusable = document.querySelectorAll<HTMLElement>(
        'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      // Clickable non-interactive elements are the most common keyboard trap
      // and were invisible here: they match no part of the focusable selector,
      // so a page built entirely from <div onclick> reported zero issues.
      const INTERACTIVE_ROLES = new Set([
        "button",
        "link",
        "checkbox",
        "menuitem",
        "menuitemcheckbox",
        "menuitemradio",
        "option",
        "radio",
        "switch",
        "tab",
      ]);

      document.querySelectorAll<HTMLElement>("[onclick]").forEach((element) => {
        if (element.matches("a[href], button, input, select, textarea")) {
          return;
        }
        if (!isElementVisible(element)) return;

        const role = element.getAttribute("role");
        const reachable =
          element.hasAttribute("tabindex") && element.tabIndex >= 0;

        if (!reachable || !role || !INTERACTIVE_ROLES.has(role)) {
          issues.push({
            type: "error",
            message: `Click handler on non-interactive <${element.tagName.toLowerCase()}> that keyboard users cannot reach`,
            element: truncate(element.outerHTML),
            suggestion:
              'Use a <button>, or add role plus tabindex="0" and a key handler for Enter/Space.',
          });
        }
      });

      focusable.forEach((element) => {
        const visible = isElementVisible(element);
        const focusResult = visible ? measureFocus(element) : false;
        // Visible but unfocusable (disabled): not in the tab order at all.
        if (focusResult === null) return;

        const elementInfo: FocusableElement = {
          tagName: element.tagName.toLowerCase(),
          tabIndex: element.tabIndex,
          hasVisibleFocus: focusResult,
          ariaLabel: element.getAttribute("aria-label") || undefined,
          role: element.getAttribute("role") || undefined,
          text: element.textContent?.trim() || undefined,
        };
        focusableElements.push(elementInfo);

        if (!visible) {
          return;
        }

        // A positive tabindex jumps the element ahead of everything in the
        // natural order, so it desynchronises tab order from reading order for
        // the whole page (WCAG 2.4.3).
        if (element.tabIndex > 0) {
          issues.push({
            type: "error",
            message: `Positive tabindex (${element.tabIndex}) found on ${element.tagName.toLowerCase()}`,
            element: truncate(element.outerHTML),
            suggestion:
              'Use tabindex="0" and order the DOM instead. A positive tabindex forces this element ahead of every other control.',
          });
        }

        if (!elementInfo.hasVisibleFocus) {
          issues.push({
            type: "error",
            message: "Element lacks visible focus indicator",
            element: truncate(element.outerHTML),
            suggestion:
              "Add :focus-visible styles with a clear outline or box shadow. Removing the default outline needs a replacement.",
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

      freeze.remove();
      return { focusableElements, issues };
    });
  }
}
