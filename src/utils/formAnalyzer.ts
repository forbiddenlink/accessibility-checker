import type { Page } from "playwright-core";

export interface FormField {
  type: string;
  name?: string;
  id?: string;
  hasLabel: boolean;
  required: boolean;
  ariaLabels: boolean;
  value?: string;
}

export interface FormIssue {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  suggestion?: string;
}

export interface FormAnalysisResult {
  role: string;
  name?: string;
  method: string;
  fields: FormField[];
  issues: FormIssue[];
}

export class FormAnalyzer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async analyzeForms(): Promise<FormAnalysisResult[]> {
    return await this.page.evaluate(() => {
      const checkFieldLabel = (field: HTMLElement): boolean => {
        const id = field.getAttribute("id");
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (label) return true;
        }

        if (field.closest("label")) return true;

        return !!(
          field.getAttribute("aria-label") ||
          field.getAttribute("aria-labelledby")
        );
      };

      const checkAriaLabels = (field: HTMLElement): boolean => {
        const ariaAttributes = [
          "aria-label",
          "aria-labelledby",
          "aria-describedby",
          "aria-description",
        ];

        return ariaAttributes.some((attr) => field.hasAttribute(attr));
      };

      const forms = document.querySelectorAll("form");
      const results: FormAnalysisResult[] = [];

      forms.forEach((form) => {
        const fields: FormField[] = [];
        const issues: FormIssue[] = [];

        // Check form attributes
        if (!form.getAttribute("name") && !form.getAttribute("id")) {
          issues.push({
            code: "FORM_NO_IDENTIFIER",
            message: "Form lacks a name or id attribute",
            severity: "warning",
            suggestion: "Add a descriptive name or id attribute to the form",
          });
        }

        // Check form submission method
        const method = form.getAttribute("method")?.toLowerCase() || "get";
        if (!["get", "post"].includes(method)) {
          issues.push({
            code: "FORM_INVALID_METHOD",
            message: "Form has an invalid submission method",
            severity: "error",
            suggestion: "Use either GET or POST as the form method",
          });
        }

        // Analyze form fields
        const formElements = form.querySelectorAll("input, select, textarea");
        formElements.forEach((element) => {
          const field = element as HTMLElement;
          const fieldType =
            (field as HTMLInputElement).type || field.tagName.toLowerCase();

          // Check for labels
          const hasLabel = checkFieldLabel(field);
          if (!hasLabel) {
            issues.push({
              code: "FIELD_NO_LABEL",
              message: `${fieldType} field lacks a proper label`,
              severity: "error",
              suggestion: "Add a label element or aria-label attribute",
            });
          }

          // Check required fields
          const isRequired =
            field.hasAttribute("required") ||
            field.hasAttribute("aria-required");
          if (isRequired && !field.hasAttribute("aria-required")) {
            issues.push({
              code: "REQUIRED_NO_ARIA",
              message: "Required field missing aria-required attribute",
              severity: "warning",
              suggestion: 'Add aria-required="true" to required fields',
            });
          }

          // Check ARIA labels
          const hasAriaLabels = checkAriaLabels(field);

          fields.push({
            type: fieldType,
            name: field.getAttribute("name") || undefined,
            id: field.getAttribute("id") || undefined,
            hasLabel,
            required: isRequired,
            ariaLabels: hasAriaLabels,
            value: (field as HTMLInputElement).value,
          });
        });

        // Check fieldset usage for grouped fields
        const fieldsets = form.querySelectorAll("fieldset");
        if (fieldsets.length === 0 && formElements.length > 3) {
          issues.push({
            code: "NO_FIELDSETS",
            message: "Form with multiple fields lacks grouping",
            severity: "warning",
            suggestion: "Use fieldset elements to group related form controls",
          });
        }

        // Check legend usage in fieldsets
        fieldsets.forEach((fieldset) => {
          if (!fieldset.querySelector("legend")) {
            issues.push({
              code: "FIELDSET_NO_LEGEND",
              message: "Fieldset lacks a legend element",
              severity: "error",
              suggestion: "Add a descriptive legend to each fieldset",
            });
          }
        });

        // Check form submission feedback
        if (!form.getAttribute("aria-live")) {
          issues.push({
            code: "NO_SUBMISSION_FEEDBACK",
            message: "Form lacks submission status announcement",
            severity: "warning",
            suggestion: "Add aria-live region for form submission status",
          });
        }

        results.push({
          role: form.getAttribute("role") || "form",
          name:
            form.getAttribute("name") || form.getAttribute("id") || undefined,
          method,
          fields,
          issues,
        });
      });

      return results;
    });
  }
}
