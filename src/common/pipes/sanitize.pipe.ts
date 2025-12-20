import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe para sanitização de inputs contra XSS
 * Remove tags HTML e scripts maliciosos
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value, new WeakSet());
    }

    return value;
  }

  /**
   * Sanitiza uma string removendo HTML e scripts
   */
  private sanitizeString(value: string): string {
    if (!value) return value;

    // Remove tags HTML
    let sanitized = value.replace(/<[^>]*>/g, '');

    // Remove javascript: URLs
    sanitized = sanitized.replace(/javascript:/gi, '');

    // Remove on* event handlers (onclick, onerror, etc)
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');

    // Remove script tags mesmo que quebrados
    sanitized = sanitized.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');

    // Escapa caracteres perigosos
    sanitized = this.escapeHtml(sanitized);

    return sanitized;
  }

  /**
   * Sanitiza um objeto recursivamente (com proteção contra referências circulares)
   */
  private sanitizeObject(obj: any, seen: WeakSet<any>): any {
    // Proteção contra referências circulares
    if (seen.has(obj)) {
      return undefined;
    }

    if (Array.isArray(obj)) {
      seen.add(obj);
      return obj.map((item) =>
        typeof item === 'object' && item !== null
          ? this.sanitizeObject(item, seen)
          : typeof item === 'string'
            ? this.sanitizeString(item)
            : item,
      );
    }

    if (typeof obj === 'object' && obj !== null) {
      seen.add(obj);
      const sanitized: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (typeof value === 'string') {
            sanitized[key] = this.sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = this.sanitizeObject(value, seen);
          } else {
            sanitized[key] = value;
          }
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Escapa caracteres HTML perigosos
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;',
    };

    return text.replace(/[&<>"'/]/g, (char) => map[char]);
  }
}
