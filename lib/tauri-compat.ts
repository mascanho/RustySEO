/**
 * Tauri Plugin Compatibility Layer
 * Provides web-compatible alternatives to Tauri plugins
 */

// ============== File System Compatibility ==============

export async function writeTextFile(path: string, contents: string, options?: any): Promise<void> {
  // Use browser download for file saving
  const blob = new Blob([contents], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = path.split('/').pop() || 'file.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function writeFile(path: string, contents: Uint8Array, options?: any): Promise<void> {
  const blob = new Blob([contents]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = path.split('/').pop() || 'file';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function readTextFile(path: string, options?: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        resolve(text);
      } else {
        reject(new Error('No file selected'));
      }
    };
    input.click();
  });
}

export const BaseDirectory = {
  App: 0,
  AppConfig: 1,
  AppData: 2,
  AppLocalData: 3,
  Desktop: 4,
  Document: 5,
  Download: 6,
  Home: 7,
  Picture: 8,
  Public: 9,
  Runtime: 10,
  Temp: 11,
  Video: 12,
};

// ============== Dialog Compatibility ==============

export async function save(options?: { defaultPath?: string; filters?: any[] }): Promise<string | null> {
  // In web, we don't have a save dialog - we just return a suggested filename
  return options?.defaultPath || 'download.txt';
}

export async function message(msg: string, options?: { title?: string; type?: string }): Promise<void> {
  alert(msg);
}

export async function ask(msg: string, options?: { title?: string; type?: string }): Promise<boolean> {
  return confirm(msg);
}

export async function open(options?: { multiple?: boolean; filters?: any[] }): Promise<string | string[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = options?.multiple || false;
    
    if (options?.filters) {
      const extensions = options.filters
        .flatMap(f => f.extensions || [])
        .map(ext => `.${ext}`)
        .join(',');
      if (extensions) {
        input.accept = extensions;
      }
    }
    
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        resolve(null);
        return;
      }
      
      if (options?.multiple) {
        resolve(Array.from(files).map(f => f.name));
      } else {
        resolve(files[0].name);
      }
    };
    
    input.oncancel = () => resolve(null);
    input.click();
  });
}

// ============== Event Compatibility ==============

type EventCallback = (event: { payload: any }) => void;
const eventListeners: Map<string, Set<EventCallback>> = new Map();

export function emit(event: string, payload?: any): void {
  const listeners = eventListeners.get(event);
  if (listeners) {
    listeners.forEach(callback => {
      try {
        callback({ payload });
      } catch (e) {
        console.error(`Error in event listener for ${event}:`, e);
      }
    });
  }
}

export function listen(event: string, callback: EventCallback): () => void {
  if (!eventListeners.has(event)) {
    eventListeners.set(event, new Set());
  }
  eventListeners.get(event)!.add(callback);
  
  // Return unlisten function
  return () => {
    eventListeners.get(event)?.delete(callback);
  };
}

// ============== Window Compatibility ==============

export function getCurrentWindow() {
  return {
    setTitle: (title: string) => {
      document.title = title;
    },
    show: () => {},
    hide: () => {},
    close: () => {
      window.close();
    },
    minimize: () => {},
    maximize: () => {},
    unmaximize: () => {},
    isMaximized: async () => false,
    toggleMaximize: () => {},
    setFullscreen: (fullscreen: boolean) => {
      if (fullscreen) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    },
  };
}

// ============== Shell Compatibility ==============

export async function openUrl(url: string): Promise<void> {
  window.open(url, '_blank');
}

export const shell = {
  open: openUrl,
};

