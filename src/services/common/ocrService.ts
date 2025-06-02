import { OCRResult } from '../../../models/Inventory';

// OCR Provider interface
interface OCRProvider {
    name: string;
    extractText(imagePath: string): Promise<OCRResult>;
}

// Mock OCR Provider (replace with actual implementation)
class MockOCRProvider implements OCRProvider {
    name = 'mock-ocr';

    async extractText(imagePath: string): Promise<OCRResult> {
        // Simulate OCR processing delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock serial number extraction
        const mockSerialNumbers = [
            'SN123456789',
            'PKG-2024-001',
            'INV-ABC-123',
            'SERIAL-XYZ-789',
        ];

        const extractedText =
            mockSerialNumbers[
                Math.floor(Math.random() * mockSerialNumbers.length)
            ];

        return {
            extractedText,
            confidence: 0.95,
            processedAt: new Date(),
            ocrProvider: this.name,
        };
    }
}

// OCR Service class
class OCRService {
    private providers: Map<string, OCRProvider> = new Map();
    private defaultProvider: string;

    constructor() {
        // Register available providers
        this.registerProvider(new MockOCRProvider());

        // Set default provider
        this.defaultProvider = 'mock-ocr';
    }

    registerProvider(provider: OCRProvider): void {
        this.providers.set(provider.name, provider);
    }

    async extractSerialNumber(
        imagePath: string,
        providerName?: string
    ): Promise<OCRResult> {
        const provider = this.providers.get(
            providerName || this.defaultProvider
        );

        if (!provider) {
            throw new Error(
                `OCR provider '${
                    providerName || this.defaultProvider
                }' not found`
            );
        }

        try {
            const result = await provider.extractText(imagePath);

            // Post-process the extracted text to find serial number patterns
            const cleanedText = this.cleanExtractedText(result.extractedText);

            return {
                ...result,
                extractedText: cleanedText,
            };
        } catch (error) {
            throw new Error(`OCR processing failed: ${error.message}`);
        }
    }

    private cleanExtractedText(text: string): string {
        // Remove extra whitespace and newlines
        let cleaned = text.replace(/\s+/g, ' ').trim();

        // Look for common serial number patterns
        const patterns = [
            /[A-Z]{2,3}[-_]?\d{6,}/g, // Pattern like "SN123456" or "PKG-123456"
            /\d{8,}/g, // 8+ digit numbers
            /[A-Z]{3,}-[A-Z0-9]{3,}/g, // Pattern like "INV-ABC-123"
        ];

        for (const pattern of patterns) {
            const matches = cleaned.match(pattern);
            if (matches && matches.length > 0) {
                return matches[0];
            }
        }

        // If no pattern matches, return the first word that looks like a serial
        const words = cleaned.split(' ');
        for (const word of words) {
            if (word.length >= 6 && /[A-Z0-9]/.test(word)) {
                return word;
            }
        }

        return cleaned;
    }

    getAvailableProviders(): string[] {
        return Array.from(this.providers.keys());
    }

    setDefaultProvider(providerName: string): void {
        if (!this.providers.has(providerName)) {
            throw new Error(`Provider '${providerName}' not registered`);
        }
        this.defaultProvider = providerName;
    }
}

// Export singleton instance
export const ocrService = new OCRService();
export { OCRService, OCRProvider };
export default ocrService;
