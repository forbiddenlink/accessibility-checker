import type { Page } from '@playwright/test';

export interface LiveRegion {
  element: string;
  role: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
  ariaAtomic?: boolean;
  ariaBusy?: boolean;
  ariaRelevant?: string[];
}

export interface DynamicElement {
  type: 'modal' | 'popup' | 'toast' | 'menu' | 'tabpanel' | 'other';
  role: string;
  hasAriaControls: boolean;
  hasAriaExpanded: boolean;
  hasAriaHidden: boolean;
  hasAriaModal?: boolean;
  focusManagement: {
    trapsFocus: boolean;
    restoresFocus: boolean;
    hasKeyboardNav: boolean;
  };
  escapeKey: boolean;
}

export interface DynamicContentIssue {
  code: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  element: string;
  suggestion?: string;
}

export interface DynamicContentAnalysis {
  liveRegions: LiveRegion[];
  dynamicElements: DynamicElement[];
  issues: DynamicContentIssue[];
}

export class DynamicContentAnalyzer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async analyzeDynamicContent(): Promise<DynamicContentAnalysis> {
    return await this.page.evaluate(() => {
      const getElementDescription = (element: Element): string => {
        const id = element.id ? `#${element.id}` : '';
        const classes = Array.from(element.classList).map(c => `.${c}`).join('');
        const tag = element.tagName.toLowerCase();
        return `${tag}${id}${classes}`;
      };

      const checkFocusManagement = (element: Element): DynamicElement['focusManagement'] => {
        const trapsFocus = element.hasAttribute('data-focus-trap') || 
                          element.querySelector('[data-focus-trap]') !== null;
        
        const restoresFocus = element.hasAttribute('data-focus-restore') ||
                             element.querySelector('[data-focus-restore]') !== null;
        
        const hasKeyboardNav = element.hasAttribute('data-keyboard-nav') ||
                              element.querySelector('[role="button"], [role="link"], [tabindex]') !== null;

        return {
          trapsFocus,
          restoresFocus,
          hasKeyboardNav
        };
      };

      const checkEscapeKeyHandler = (element: Element): boolean => {
        return element.hasAttribute('data-escape-dismiss') ||
               element.querySelector('[data-escape-dismiss]') !== null;
      };

      const liveRegions: LiveRegion[] = [];
      const dynamicElements: DynamicElement[] = [];
      const issues: DynamicContentIssue[] = [];

      // Analyze live regions
      document.querySelectorAll('[aria-live]').forEach((element) => {
        const role = element.getAttribute('role') || 'region';
        const ariaLive = element.getAttribute('aria-live') as LiveRegion['ariaLive'];
        
        liveRegions.push({
          element: getElementDescription(element),
          role,
          ariaLive,
          ariaAtomic: element.getAttribute('aria-atomic') === 'true',
          ariaBusy: element.getAttribute('aria-busy') === 'true',
          ariaRelevant: element.getAttribute('aria-relevant')?.split(' ') as string[]
        });

        // Check for common live region issues
        if (!ariaLive) {
          issues.push({
            code: 'LIVE_REGION_NO_LEVEL',
            message: 'Live region lacks politeness level',
            type: 'error',
            element: getElementDescription(element),
            suggestion: 'Add aria-live="polite" or aria-live="assertive"'
          });
        }
      });

      // Analyze modals and dialogs
      document.querySelectorAll('[role="dialog"], [role="alertdialog"]').forEach((element) => {
        const hasAriaModal = element.getAttribute('aria-modal') === 'true';
        const hasAriaLabel = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
        
        dynamicElements.push({
          type: 'modal',
          role: element.getAttribute('role') || '',
          hasAriaControls: element.hasAttribute('aria-controls'),
          hasAriaExpanded: element.hasAttribute('aria-expanded'),
          hasAriaHidden: element.hasAttribute('aria-hidden'),
          hasAriaModal,
          focusManagement: checkFocusManagement(element),
          escapeKey: checkEscapeKeyHandler(element)
        });

        if (!hasAriaModal) {
          issues.push({
            code: 'MODAL_NO_ARIA_MODAL',
            message: 'Modal dialog lacks aria-modal attribute',
            type: 'warning',
            element: getElementDescription(element),
            suggestion: 'Add aria-modal="true" to indicate modal behavior'
          });
        }

        if (!hasAriaLabel) {
          issues.push({
            code: 'MODAL_NO_LABEL',
            message: 'Modal lacks accessible name',
            type: 'error',
            element: getElementDescription(element),
            suggestion: 'Add aria-label or aria-labelledby attribute'
          });
        }
      });

      // Analyze popups and tooltips
      document.querySelectorAll('[role="tooltip"], [aria-haspopup]').forEach((element) => {
        dynamicElements.push({
          type: 'popup',
          role: element.getAttribute('role') || '',
          hasAriaControls: element.hasAttribute('aria-controls'),
          hasAriaExpanded: element.hasAttribute('aria-expanded'),
          hasAriaHidden: element.hasAttribute('aria-hidden'),
          focusManagement: checkFocusManagement(element),
          escapeKey: checkEscapeKeyHandler(element)
        });

        if (!element.hasAttribute('aria-expanded')) {
          issues.push({
            code: 'POPUP_NO_EXPANDED',
            message: 'Popup element lacks aria-expanded state',
            type: 'warning',
            element: getElementDescription(element),
            suggestion: 'Add aria-expanded attribute to indicate popup state'
          });
        }
      });

      // Analyze toast notifications
      document.querySelectorAll('[role="alert"], [role="status"]').forEach((element) => {
        const hasTimeout = element.hasAttribute('data-timeout') || 
                         element.hasAttribute('data-dismiss-delay');
        
        dynamicElements.push({
          type: 'toast',
          role: element.getAttribute('role') || '',
          hasAriaControls: element.hasAttribute('aria-controls'),
          hasAriaExpanded: element.hasAttribute('aria-expanded'),
          hasAriaHidden: element.hasAttribute('aria-hidden'),
          focusManagement: checkFocusManagement(element),
          escapeKey: checkEscapeKeyHandler(element)
        });

        if (!hasTimeout) {
          issues.push({
            code: 'TOAST_NO_TIMEOUT',
            message: 'Toast notification lacks timeout mechanism',
            type: 'warning',
            element: getElementDescription(element),
            suggestion: 'Add timeout mechanism for automatic dismissal'
          });
        }
      });

      return {
        liveRegions,
        dynamicElements,
        issues
      };
    });
  }
}
