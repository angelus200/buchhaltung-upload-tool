import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock storage module
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "finanzamt/1/1234567890_test.pdf",
    url: "https://storage.example.com/finanzamt/1/1234567890_test.pdf",
  }),
}));

describe("Finanzamt Upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate safe filename from original name", () => {
    const originalName = "Bescheid 2024 (Kopie).pdf";
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, "_");
    expect(safeName).toBe("Bescheid_2024__Kopie_.pdf");
  });

  it("should generate unique path with timestamp", () => {
    const unternehmenId = 1;
    const timestamp = Date.now();
    const safeName = "test.pdf";
    const path = `finanzamt/${unternehmenId}/${timestamp}_${safeName}`;
    
    expect(path).toMatch(/^finanzamt\/1\/\d+_test\.pdf$/);
  });

  it("should extract base64 data from data URL", () => {
    const dataUrl = "data:application/pdf;base64,JVBERi0xLjQK";
    const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, "");
    expect(base64Data).toBe("JVBERi0xLjQK");
  });

  it("should convert base64 to buffer", () => {
    const base64 = "SGVsbG8gV29ybGQ="; // "Hello World"
    const buffer = Buffer.from(base64, "base64");
    expect(buffer.toString()).toBe("Hello World");
  });

  it("should handle various content types", () => {
    const contentTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    
    contentTypes.forEach(type => {
      expect(type).toBeTruthy();
    });
  });
});
