import { Page } from 'puppeteer';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface ImagePerformance {
  loadTime: number;
  size: number;
  format: string;
  compressionRatio?: number;
}

export interface ResponsiveImageData {
  hasSrcSet: boolean;
  hasSizes: boolean;
  isResponsive: boolean;
  breakpoints?: string[];
}

export interface ImageAccessibility {
  hasAlt: boolean;
  altText?: string;
  isDecorative: boolean;
  role?: string;
  ariaLabel?: string;
  longDescription?: string;
}

export interface ImageIssue {
  code: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  suggestion?: string;
}

export interface ImageAnalysisResult {
  url: string;
  dimensions: ImageDimensions;
  performance: ImagePerformance;
  accessibility: ImageAccessibility;
  responsive: ResponsiveImageData;
  issues: ImageIssue[];
}

export class ImageAnalyzer {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async analyzeImages(): Promise<ImageAnalysisResult[]> {
    return await this.page.evaluate(() => {
      const images = document.querySelectorAll('img, [role="img"]');
      const results: ImageAnalysisResult[] = [];

      images.forEach((img) => {
        const image = img as HTMLImageElement;
        const issues: ImageIssue[] = [];

        // Basic image data
        const url = image.currentSrc || image.src;
        const dimensions = {
          width: image.naturalWidth,
          height: image.naturalHeight
        };

        // Performance analysis
        const performance = this.analyzePerformance(image);
        if (performance.size > 500000) { // 500KB
          issues.push({
            code: 'LARGE_IMAGE_SIZE',
            message: 'Image file size exceeds recommended limit',
            type: 'warning',
            suggestion: 'Consider compressing the image or using a more efficient format'
          });
        }

        // Accessibility checks
        const accessibility = this.checkAccessibility(image);
        if (!accessibility.hasAlt && !accessibility.isDecorative) {
          issues.push({
            code: 'MISSING_ALT_TEXT',
            message: 'Non-decorative image lacks alternative text',
            type: 'error',
            suggestion: 'Add descriptive alt text to convey the image\'s meaning'
          });
        } else if (accessibility.altText && accessibility.altText.length > 125) {
          issues.push({
            code: 'LONG_ALT_TEXT',
            message: 'Alt text exceeds recommended length',
            type: 'warning',
            suggestion: 'Keep alt text concise and consider using longdesc for detailed descriptions'
          });
        }

        // Responsive image checks
        const responsive = this.checkResponsiveness(image);
        if (!responsive.isResponsive && Math.max(dimensions.width, dimensions.height) > 800) {
          issues.push({
            code: 'NOT_RESPONSIVE',
            message: 'Large image lacks responsive attributes',
            type: 'warning',
            suggestion: 'Use srcset and sizes attributes for responsive images'
          });
        }

        // Aspect ratio checks
        const aspectRatio = dimensions.width / dimensions.height;
        if (aspectRatio > 3 || aspectRatio < 0.33) {
          issues.push({
            code: 'EXTREME_ASPECT_RATIO',
            message: 'Image has an unusual aspect ratio',
            type: 'warning',
            suggestion: 'Verify that the image dimensions are intentional'
          });
        }

        // Background image checks
        if (image.style.backgroundImage) {
          issues.push({
            code: 'BACKGROUND_IMAGE_CONTENT',
            message: 'Content image used as background',
            type: 'warning',
            suggestion: 'Use img element for content images instead of background-image'
          });
        }

        results.push({
          url,
          dimensions,
          performance,
          accessibility,
          responsive,
          issues
        });
      });

      return results;
    });
  }

  private analyzePerformance(image: HTMLImageElement): ImagePerformance {
    const format = this.getImageFormat(image.currentSrc || image.src);
    const size = this.estimateImageSize(image);
    
    return {
      loadTime: this.measureLoadTime(image),
      size,
      format,
      compressionRatio: this.estimateCompressionRatio(image, size)
    };
  }

  private checkAccessibility(image: HTMLImageElement): ImageAccessibility {
    const alt = image.getAttribute('alt');
    const role = image.getAttribute('role');
    const ariaLabel = image.getAttribute('aria-label');
    const longDesc = image.getAttribute('longdesc');
    
    return {
      hasAlt: alt !== null,
      altText: alt || undefined,
      isDecorative: alt === '' || role === 'presentation',
      role: role || undefined,
      ariaLabel: ariaLabel || undefined,
      longDescription: longDesc || undefined
    };
  }

  private checkResponsiveness(image: HTMLImageElement): ResponsiveImageData {
    const srcset = image.srcset;
    const sizes = image.sizes;
    
    return {
      hasSrcSet: !!srcset,
      hasSizes: !!sizes,
      isResponsive: !!srcset && !!sizes,
      breakpoints: srcset ? this.parseSrcSet(srcset) : undefined
    };
  }

  private getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    return extension || 'unknown';
  }

  private estimateImageSize(image: HTMLImageElement): number {
    // Rough estimation based on dimensions and format
    const pixelCount = image.naturalWidth * image.naturalHeight;
    const format = this.getImageFormat(image.currentSrc || image.src);
    
    // Rough bytes per pixel for different formats
    const bppMap: { [key: string]: number } = {
      'jpg': 0.25,
      'jpeg': 0.25,
      'png': 0.5,
      'gif': 0.15,
      'webp': 0.15
    };

    return pixelCount * (bppMap[format] || 0.3);
  }

  private measureLoadTime(image: HTMLImageElement): number {
    // Use performance API if available
    const entry = performance.getEntriesByName(image.currentSrc || image.src)[0];
    return entry ? entry.duration : 0;
  }

  private estimateCompressionRatio(image: HTMLImageElement, actualSize: number): number {
    const rawSize = image.naturalWidth * image.naturalHeight * 3; // 3 bytes per pixel (RGB)
    return rawSize / actualSize;
  }

  private parseSrcSet(srcset: string): string[] {
    return srcset.split(',').map(src => src.trim().split(' ')[1]).filter(Boolean);
  }
} 