import dns from 'dns';
import { promisify } from 'util';

const lookup = promisify(dns.lookup);

export async function validateUrl(urlString: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const url = new URL(urlString);

        // 1. Protocol Check
        if (!['http:', 'https:'].includes(url.protocol)) {
            return { valid: false, error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' };
        }

        // 2. Hostname Blocklist (Basic)
        const hostname = url.hostname.toLowerCase();
        if (
            hostname === 'localhost' ||
            hostname.startsWith('127.') ||
            hostname === '[::1]' ||
            hostname === '0.0.0.0'
        ) {
            return { valid: false, error: 'Access to localhost is denied.' };
        }

        // 3. DNS Resolution to check for private IPs (SSRF Protection)
        // This is a simplified check. For enterprise, use a dedicated library or proxy.
        try {
            const { address } = await lookup(hostname);

            // Private IP Ranges Regex
            // 10.0.0.0 - 10.255.255.255
            // 172.16.0.0 - 172.31.255.255
            // 192.168.0.0 - 192.168.255.255
            const isPrivate =
                /^10\./.test(address) ||
                /^192\.168\./.test(address) ||
                /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(address) ||
                /^127\./.test(address) ||
                address === '0.0.0.0' ||
                address === '::1';

            if (isPrivate) {
                return { valid: false, error: 'Access to private network resources is denied.' };
            }

        } catch (dnsError) {
            // If DNS fails, we can't verify IP, so strictly we might fail or allow if we trust hostname check.
            // Failing safe is better.
            return { valid: false, error: 'Could not resolve hostname.' };
        }

        return { valid: true };
    } catch (e) {
        return { valid: false, error: 'Invalid URL format.' };
    }
}
