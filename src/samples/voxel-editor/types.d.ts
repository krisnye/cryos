// Type declarations for File System Access API

interface SaveFilePickerOptions {
    suggestedName?: string;
    types?: ReadonlyArray<{
        readonly description: string;
        readonly accept: Readonly<Record<string, readonly string[]>>;
    }>;
}

interface OpenFilePickerOptions {
    multiple?: boolean;
    types?: ReadonlyArray<{
        readonly description: string;
        readonly accept: Readonly<Record<string, readonly string[]>>;
    }>;
}

declare global {
    interface Window {
        showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
        showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
    }
}

export {};

