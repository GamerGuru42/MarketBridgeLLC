// client/utils/loadScript.ts

/**
 * Dynamically loads an external script into the document.
 * Returns a promise that resolves when the script is loaded successfully,
 * or rejects if an error occurs.
 */
export const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        // Check if script already exists
        if (document.querySelector(`script[src="${src}"]`)) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script ${src}`));
        document.body.appendChild(script);
    });
};
