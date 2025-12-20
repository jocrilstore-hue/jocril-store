import { describe, it, expect } from "vitest";
import {
  generateSlug,
  generateReferenceCode,
  generateSkuPrefix,
  calculatePriceWithVAT,
} from "@/lib/validations/product-schemas";

describe("Product Schemas Utilities", () => {
  describe("generateSlug", () => {
    it("should convert name to lowercase slug", () => {
      expect(generateSlug("Product Name")).toBe("product-name");
    });

    it("should remove special characters", () => {
      expect(generateSlug("Produto Acrílico #1")).toBe("produto-acrilico-1");
    });

    it("should handle multiple spaces", () => {
      expect(generateSlug("Multiple   Spaces")).toBe("multiple-spaces");
    });

    it("should handle empty string", () => {
      expect(generateSlug("")).toBe("");
    });

    it("should handle Portuguese characters", () => {
      expect(generateSlug("Exposição Ação")).toBe("exposicao-acao");
    });
  });

  describe("generateReferenceCode", () => {
    it("should generate a reference code with J- prefix", () => {
      const code = generateReferenceCode();
      expect(code).toMatch(/^J-/);
    });

    it("should generate 8 character codes (J- + 6 chars)", () => {
      const code = generateReferenceCode();
      expect(code).toHaveLength(8);
    });

    it("should generate unique codes", () => {
      const code1 = generateReferenceCode();
      const code2 = generateReferenceCode();
      // Note: There's a tiny chance they could be equal, but extremely unlikely
      expect(code1).not.toBe(code2);
    });
  });

  describe("generateSkuPrefix", () => {
    it("should generate uppercase initials from name", () => {
      // Implementation takes first letter of each word
      const prefix = generateSkuPrefix("Vitrine Acrílica");
      expect(prefix).toBe("VA");
    });

    it("should handle single word names", () => {
      const prefix = generateSkuPrefix("Box");
      expect(prefix).toBe("B");
    });

    it("should handle multiple words", () => {
      const prefix = generateSkuPrefix("Expositor De Mesa Grande");
      expect(prefix).toBe("EDMG");
    });

    it("should limit to 5 characters max", () => {
      const prefix = generateSkuPrefix("One Two Three Four Five Six Seven");
      expect(prefix).toHaveLength(5);
    });

    it("should handle empty string", () => {
      expect(generateSkuPrefix("")).toBe("");
    });
  });

  describe("calculatePriceWithVAT", () => {
    it("should add 23% VAT to price", () => {
      expect(calculatePriceWithVAT(100)).toBe(123);
    });

    it("should handle decimal prices", () => {
      const result = calculatePriceWithVAT(10.5);
      expect(result).toBeCloseTo(12.92, 2);
    });

    it("should handle zero", () => {
      expect(calculatePriceWithVAT(0)).toBe(0);
    });

    it("should accept custom VAT rate", () => {
      expect(calculatePriceWithVAT(100, 0.10)).toBe(110);
    });
  });
});
