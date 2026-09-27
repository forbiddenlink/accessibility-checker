/**
 * Maps this app's own issue codes (and the axe-core rule ids it forwards)
 * to the WCAG success criterion they violate, with a link to the official
 * W3C "Understanding" page for that criterion.
 *
 * Every mapping below was checked against the criterion it names before
 * being added - see the axe-core rule-descriptions table
 * (https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
 * for the axe-sourced rows, and https://www.w3.org/WAI/WCAG22/Understanding/
 * for the SC text itself. A rule that axe itself classifies as a "best
 * practice" (heading-order, landmark-one-main, region) is recorded as such
 * here too, rather than pinned to a criterion it doesn't actually violate -
 * citing a WCAG number that doesn't apply would be exactly the kind of
 * content error this pass exists to catch.
 */

export interface WcagCriterion {
  /** e.g. "1.4.3" - null when the rule is a best practice, not a numbered SC. */
  num: string | null;
  title: string;
  level: "A" | "AA" | "AAA" | null;
  /** W3C Understanding doc for this SC, or axe-core's best-practices doc. */
  url: string;
}

const UNDERSTANDING = "https://www.w3.org/WAI/WCAG22/Understanding/";
const BEST_PRACTICE: WcagCriterion = {
  num: null,
  title: "Best practice (not a numbered WCAG criterion)",
  level: null,
  url: "https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md",
};

const CRITERIA = {
  "1.1.1": {
    num: "1.1.1",
    title: "Non-text Content",
    level: "A",
    url: `${UNDERSTANDING}non-text-content.html`,
  },
  "1.3.1": {
    num: "1.3.1",
    title: "Info and Relationships",
    level: "A",
    url: `${UNDERSTANDING}info-and-relationships.html`,
  },
  "1.4.3": {
    num: "1.4.3",
    title: "Contrast (Minimum)",
    level: "AA",
    url: `${UNDERSTANDING}contrast-minimum.html`,
  },
  "2.1.1": {
    num: "2.1.1",
    title: "Keyboard",
    level: "A",
    url: `${UNDERSTANDING}keyboard.html`,
  },
  "2.2.1": {
    num: "2.2.1",
    title: "Timing Adjustable",
    level: "A",
    url: `${UNDERSTANDING}timing-adjustable.html`,
  },
  "2.4.1": {
    num: "2.4.1",
    title: "Bypass Blocks",
    level: "A",
    url: `${UNDERSTANDING}bypass-blocks.html`,
  },
  "2.4.3": {
    num: "2.4.3",
    title: "Focus Order",
    level: "A",
    url: `${UNDERSTANDING}focus-order.html`,
  },
  "2.4.4": {
    num: "2.4.4",
    title: "Link Purpose (In Context)",
    level: "A",
    url: `${UNDERSTANDING}link-purpose-in-context.html`,
  },
  "2.4.7": {
    num: "2.4.7",
    title: "Focus Visible",
    level: "AA",
    url: `${UNDERSTANDING}focus-visible.html`,
  },
  "3.1.1": {
    num: "3.1.1",
    title: "Language of Page",
    level: "A",
    url: `${UNDERSTANDING}language-of-page.html`,
  },
  "3.3.1": {
    num: "3.3.1",
    title: "Error Identification",
    level: "A",
    url: `${UNDERSTANDING}error-identification.html`,
  },
  "3.3.2": {
    num: "3.3.2",
    title: "Labels or Instructions",
    level: "A",
    url: `${UNDERSTANDING}labels-or-instructions.html`,
  },
  "4.1.2": {
    num: "4.1.2",
    title: "Name, Role, Value",
    level: "A",
    url: `${UNDERSTANDING}name-role-value.html`,
  },
  "4.1.3": {
    num: "4.1.3",
    title: "Status Messages",
    level: "AA",
    url: `${UNDERSTANDING}status-messages.html`,
  },
} as const satisfies Record<string, WcagCriterion>;

/** axe-core rule id -> WCAG criterion (verified against axe-core's own docs). */
const AXE_RULE_MAP: Record<string, WcagCriterion> = {
  "color-contrast": CRITERIA["1.4.3"],
  "aria-roles": CRITERIA["4.1.2"],
  "aria-valid-attr": CRITERIA["4.1.2"],
  "aria-valid-attr-value": CRITERIA["4.1.2"],
  "aria-required-attr": CRITERIA["4.1.2"],
  label: CRITERIA["4.1.2"],
  "image-alt": CRITERIA["1.1.1"],
  "link-name": CRITERIA["4.1.2"],
  "button-name": CRITERIA["4.1.2"],
  "html-has-lang": CRITERIA["3.1.1"],
  list: CRITERIA["1.3.1"],
  listitem: CRITERIA["1.3.1"],
  "heading-order": BEST_PRACTICE,
  "landmark-one-main": BEST_PRACTICE,
  region: BEST_PRACTICE,
};

/** This app's own issue codes (forms, images, dynamic content analyzers). */
const APP_CODE_MAP: Record<string, WcagCriterion> = {
  FIELD_NO_LABEL: CRITERIA["1.3.1"],
  NO_FIELDSETS: CRITERIA["1.3.1"],
  FIELDSET_NO_LEGEND: CRITERIA["1.3.1"],
  REQUIRED_NO_ARIA: CRITERIA["3.3.2"],
  NO_SUBMISSION_FEEDBACK: CRITERIA["3.3.1"],
  FORM_NO_IDENTIFIER: BEST_PRACTICE,
  FORM_INVALID_METHOD: BEST_PRACTICE,
  MISSING_ALT_TEXT: CRITERIA["1.1.1"],
  BACKGROUND_IMAGE_CONTENT: CRITERIA["1.1.1"],
  LONG_ALT_TEXT: BEST_PRACTICE,
  LARGE_IMAGE_SIZE: BEST_PRACTICE,
  NOT_RESPONSIVE: BEST_PRACTICE,
  EXTREME_ASPECT_RATIO: BEST_PRACTICE,
  LIVE_REGION_NO_LEVEL: CRITERIA["4.1.3"],
  MODAL_NO_ARIA_MODAL: CRITERIA["4.1.2"],
  MODAL_NO_LABEL: CRITERIA["4.1.2"],
  POPUP_NO_EXPANDED: CRITERIA["4.1.2"],
  TOAST_NO_TIMEOUT: CRITERIA["2.2.1"],
};

/**
 * Keyboard nav issues carry a fixed set of message shapes but no discrete
 * code (see NavigationIssue in keyboardNavigationAnalyzer.ts) - matched by
 * the stable substring each message template always contains.
 */
const KEYBOARD_MESSAGE_MAP: Array<[string, WcagCriterion]> = [
  ["keyboard users cannot reach", CRITERIA["2.1.1"]],
  ["Positive tabindex", CRITERIA["2.4.3"]],
  ["visible focus indicator", CRITERIA["2.4.7"]],
  ["accessible name", CRITERIA["4.1.2"]],
  ["Heading level skipped", CRITERIA["1.3.1"]],
  ["skip link", CRITERIA["2.4.1"]],
];

export function criterionForCode(code: string): WcagCriterion | null {
  return AXE_RULE_MAP[code] ?? APP_CODE_MAP[code] ?? null;
}

export function criterionForKeyboardMessage(
  message: string,
): WcagCriterion | null {
  const hit = KEYBOARD_MESSAGE_MAP.find(([needle]) => message.includes(needle));
  return hit ? hit[1] : null;
}
