import { describe, it, expect } from 'vitest';
import { validateUrl } from './security';

describe('validateUrl', () => {
    describe('protocol validation', () => {
        it('rejects ftp protocol', async () => {
            const result = await validateUrl('ftp://example.com');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
        });

        it('rejects file protocol', async () => {
            const result = await validateUrl('file:///etc/passwd');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid protocol. Only HTTP and HTTPS are allowed.');
        });

        it('rejects javascript protocol', async () => {
            const result = await validateUrl('javascript:alert(1)');
            expect(result.valid).toBe(false);
        });

        it('rejects data protocol', async () => {
            const result = await validateUrl('data:text/html,<script>alert(1)</script>');
            expect(result.valid).toBe(false);
        });
    });

    describe('localhost blocking', () => {
        it('blocks localhost', async () => {
            const result = await validateUrl('http://localhost');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks localhost with port', async () => {
            const result = await validateUrl('http://localhost:3000');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks localhost with https', async () => {
            const result = await validateUrl('https://localhost');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks 127.0.0.1', async () => {
            const result = await validateUrl('http://127.0.0.1');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks 127.x.x.x variations', async () => {
            const result = await validateUrl('http://127.0.0.2');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks 127.255.255.255', async () => {
            const result = await validateUrl('http://127.255.255.255');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks [::1] IPv6 loopback', async () => {
            const result = await validateUrl('http://[::1]');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });

        it('blocks 0.0.0.0', async () => {
            const result = await validateUrl('http://0.0.0.0');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Access to localhost is denied.');
        });
    });

    describe('invalid URL format', () => {
        it('rejects malformed URLs', async () => {
            const result = await validateUrl('not-a-url');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid URL format.');
        });

        it('rejects empty string', async () => {
            const result = await validateUrl('');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Invalid URL format.');
        });

        it('rejects URL with no host', async () => {
            const result = await validateUrl('http://');
            expect(result.valid).toBe(false);
        });

        it('rejects URLs with spaces', async () => {
            const result = await validateUrl('http://example .com');
            expect(result.valid).toBe(false);
        });
    });

    describe('DNS resolution and private IP blocking', () => {
        // These tests verify the DNS lookup error handling
        it('rejects unresolvable hostnames', async () => {
            // Using an invalid TLD that won't resolve
            const result = await validateUrl('http://thishostname.invalidtld123xyz');
            expect(result.valid).toBe(false);
            expect(result.error).toBe('Could not resolve hostname.');
        }, 10000); // Longer timeout for DNS

        // Note: Private IP tests (10.x, 192.168.x, 172.16.x) would require
        // DNS mocking or infrastructure setup to properly test
    });
});
