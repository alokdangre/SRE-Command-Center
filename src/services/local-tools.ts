/**
 * Local Tools for SRE Command Center
 * These are browser-side tools that execute locally without server roundtrips
 */

/**
 * Flush local browser cache and session storage
 */
export async function flushLocalCache(): Promise<{ success: boolean; message: string }> {
    try {
        // Clear localStorage
        localStorage.clear();

        // Clear sessionStorage
        sessionStorage.clear();

        // Clear any caches (if available)
        if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }

        return {
            success: true,
            message: `Cache cleared successfully. Cleared localStorage, sessionStorage, and ${caches ? 'browser caches' : 'no cache API'}.`,
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Restart the current session (clear session data and reload)
 */
export async function restartSession(): Promise<{ success: boolean; message: string }> {
    try {
        // Clear session-specific data
        sessionStorage.clear();

        // Mark session as restarted
        localStorage.setItem('sre-session-restart', new Date().toISOString());

        // Reload the page after a short delay
        setTimeout(() => {
            window.location.reload();
        }, 500);

        return {
            success: true,
            message: 'Session restart initiated. Page will reload momentarily.',
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to restart session: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Copy text to clipboard (for sharing incident details)
 */
export async function copyToClipboard(params: { text: string }): Promise<{ success: boolean; message: string }> {
    try {
        await navigator.clipboard.writeText(params.text);
        return {
            success: true,
            message: 'Text copied to clipboard successfully.',
        };
    } catch (error) {
        return {
            success: false,
            message: `Failed to copy to clipboard: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Get current browser performance metrics
 */
export async function getBrowserPerformance(): Promise<{
    memory?: { usedJSHeapSize: number; totalJSHeapSize: number };
    timing: { pageLoadTime: number; domContentLoaded: number };
    connection?: { effectiveType: string; downlink: number };
}> {
    const performance = window.performance;
    const timing = performance.timing;

    const result: ReturnType<typeof getBrowserPerformance> extends Promise<infer T> ? T : never = {
        timing: {
            pageLoadTime: timing.loadEventEnd - timing.navigationStart,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
        },
    };

    // Memory info (Chrome only)
    const extendedPerformance = performance as Performance & {
        memory?: { usedJSHeapSize: number; totalJSHeapSize: number }
    };
    if (extendedPerformance.memory) {
        result.memory = {
            usedJSHeapSize: extendedPerformance.memory.usedJSHeapSize,
            totalJSHeapSize: extendedPerformance.memory.totalJSHeapSize,
        };
    }

    // Network info
    const nav = navigator as Navigator & {
        connection?: { effectiveType: string; downlink: number };
    };
    if (nav.connection) {
        result.connection = {
            effectiveType: nav.connection.effectiveType,
            downlink: nav.connection.downlink,
        };
    }

    return result;
}

/**
 * Toggle dark/light mode
 */
export async function toggleDarkMode(): Promise<{ success: boolean; isDarkMode: boolean }> {
    const html = document.documentElement;
    const currentMode = html.classList.contains('dark');

    if (currentMode) {
        html.classList.remove('dark');
        localStorage.setItem('sre-theme', 'light');
    } else {
        html.classList.add('dark');
        localStorage.setItem('sre-theme', 'dark');
    }

    return {
        success: true,
        isDarkMode: !currentMode,
    };
}

/**
 * Send browser notification (for alerting)
 */
export async function sendBrowserNotification(params: {
    title: string;
    body: string;
    urgent?: boolean;
}): Promise<{ success: boolean; message: string }> {
    try {
        if (!('Notification' in window)) {
            return { success: false, message: 'Browser notifications not supported' };
        }

        if (Notification.permission === 'denied') {
            return { success: false, message: 'Notification permission denied' };
        }

        if (Notification.permission !== 'granted') {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return { success: false, message: 'Notification permission not granted' };
            }
        }

        new Notification(params.title, {
            body: params.body,
            icon: '/Octo-Icon.svg',
            requireInteraction: params.urgent,
            tag: 'sre-alert',
        });

        return { success: true, message: 'Notification sent successfully' };
    } catch (error) {
        return {
            success: false,
            message: `Failed to send notification: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Export incident data as JSON
 */
export async function exportIncidentData(params: {
    jsonData: string;
    filename?: string;
}): Promise<{ success: boolean; message: string }> {
    try {
        const data = JSON.parse(params.jsonData);
        const jsonStr = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = params.filename || `incident-export-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return { success: true, message: 'Incident data exported successfully' };
    } catch (error) {
        return {
            success: false,
            message: `Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
    }
}

/**
 * Play an alert sound (for critical alerts)
 */
export async function playAlertSound(params: { type?: 'critical' | 'warning' | 'info' }): Promise<{ success: boolean }> {
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different frequencies for different alert types
        const frequencies: Record<string, number> = {
            critical: 880, // High A
            warning: 660,  // E
            info: 440,     // A
        };

        oscillator.frequency.value = frequencies[params.type || 'info'];
        oscillator.type = params.type === 'critical' ? 'sawtooth' : 'sine';

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);

        return { success: true };
    } catch {
        return { success: false };
    }
}

/**
 * Get local time zone info for incident reporting
 */
export async function getTimezoneInfo(): Promise<{
    timezone: string;
    offset: number;
    offsetString: string;
    currentTime: string;
}> {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const offsetHours = Math.abs(Math.floor(offset / 60));
    const offsetMins = Math.abs(offset % 60);
    const offsetSign = offset <= 0 ? '+' : '-';

    return {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        offset: -offset, // Convert to standard offset (positive = east of UTC)
        offsetString: `UTC${offsetSign}${offsetHours.toString().padStart(2, '0')}:${offsetMins.toString().padStart(2, '0')}`,
        currentTime: now.toISOString(),
    };
}
