declare module 'html-validator' {
  interface ValidationOptions {
    data: string;
    format: 'json';
  }

  interface ValidationMessage {
    type: 'error' | 'warning' | 'info';
    message: string;
    line?: number;
    column?: number;
  }

  interface ValidationResult {
    messages: ValidationMessage[];
  }

  export default function validate(options: ValidationOptions): Promise<ValidationResult>;
} 