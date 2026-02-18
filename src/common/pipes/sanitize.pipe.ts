import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Pipe para sanitização de inputs contra XSS
 * Remove tags HTML e scripts maliciosos
 */
@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Skip sanitização para uploads de arquivos (Multer File objects)
    if (this.isFileUpload(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (typeof value === 'object' && value !== null) {
      return this.sanitizeObject(value, new WeakSet());
    }

    return value;
  }

  /**
   * Verifica se o valor é um objeto de upload de arquivo do Multer
   */
  private isFileUpload(value: any): boolean {
    return (
      value &&
      typeof value === 'object' &&
      Buffer.isBuffer(value.buffer) &&
      typeof value.fieldname === 'string'
    );
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

    // Não processar Buffers ou Uint8Arrays
    if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
      return obj;
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
