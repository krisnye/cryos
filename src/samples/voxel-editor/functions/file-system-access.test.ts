import { describe, expect, test, vi, beforeEach } from "vitest";
import { saveToFile, loadFromFile } from "./file-system-access.js";

describe("file-system-access", () => {
    // Mock File System Access API
    beforeEach(() => {
        // Reset mocks before each test
        vi.restoreAllMocks();
    });

    describe("saveToFile", () => {
        test("saves content without prompting when handle provided", async () => {
            const mockWritable = {
                write: vi.fn(),
                close: vi.fn(),
            };
            
            const mockHandle = {
                createWritable: vi.fn().mockResolvedValue(mockWritable),
            };
            
            const content = "test content";
            await saveToFile(content, mockHandle as any);
            
            expect(mockHandle.createWritable).toHaveBeenCalled();
            expect(mockWritable.write).toHaveBeenCalledWith(content);
            expect(mockWritable.close).toHaveBeenCalled();
        });

        test("prompts for file location when no handle provided", async () => {
            const mockWritable = {
                write: vi.fn(),
                close: vi.fn(),
            };
            
            const mockHandle = {
                createWritable: vi.fn().mockResolvedValue(mockWritable),
            };
            
            const mockShowSaveFilePicker = vi.fn().mockResolvedValue(mockHandle);
            window.showSaveFilePicker = mockShowSaveFilePicker;
            
            const content = "test content";
            const result = await saveToFile(content);
            
            expect(mockShowSaveFilePicker).toHaveBeenCalledWith({
                suggestedName: "model.json",
                types: [{
                    description: "JSON Files",
                    accept: { "application/json": [".json"] }
                }],
                excludeAcceptAllOption: true
            });
            expect(result).toBe(mockHandle);
        });

        test("returns null when user cancels save dialog", async () => {
            const mockShowSaveFilePicker = vi.fn().mockRejectedValue(new Error("User cancelled"));
            window.showSaveFilePicker = mockShowSaveFilePicker;
            
            const result = await saveToFile("content");
            
            expect(result).toBeNull();
        });
    });

    describe("loadFromFile", () => {
        test("reads file contents as text", async () => {
            const mockFile = {
                text: vi.fn().mockResolvedValue("file contents"),
            };
            
            const mockHandle = {
                getFile: vi.fn().mockResolvedValue(mockFile),
            };
            
            const mockShowOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
            window.showOpenFilePicker = mockShowOpenFilePicker;
            
            const result = await loadFromFile();
            
            expect(mockShowOpenFilePicker).toHaveBeenCalledWith({
                types: [{
                    description: "JSON Files",
                    accept: { "application/json": [".json"] }
                }],
                excludeAcceptAllOption: true,
                multiple: false
            });
            expect(result).toEqual({
                content: "file contents",
                handle: mockHandle
            });
        });

        test("returns null when user cancels open dialog", async () => {
            const mockShowOpenFilePicker = vi.fn().mockRejectedValue(new Error("User cancelled"));
            window.showOpenFilePicker = mockShowOpenFilePicker;
            
            const result = await loadFromFile();
            
            expect(result).toBeNull();
        });

        test("filters for .json files", async () => {
            const mockFile = {
                text: vi.fn().mockResolvedValue("content"),
            };
            
            const mockHandle = {
                getFile: vi.fn().mockResolvedValue(mockFile),
            };
            
            const mockShowOpenFilePicker = vi.fn().mockResolvedValue([mockHandle]);
            window.showOpenFilePicker = mockShowOpenFilePicker;
            
            await loadFromFile();
            
            const callArgs = mockShowOpenFilePicker.mock.calls[0][0];
            expect(callArgs.types[0].accept["application/json"]).toContain(".json");
        });
    });
});

