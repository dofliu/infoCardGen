
import { ImageModelType, AICost } from '../types';

// Pricing Constants (USD) based on Google Cloud Vertex AI / AI Studio Pricing (Approximate)
// Updated as of late 2024 / early 2025 estimates
const PRICING = {
  gemini_flash_text: {
    input_per_1k_chars: 0.00001875, // ~$0.075 / 1M tokens (~4M chars) -> 0.075 / 4000 = 0.00001875
    output_per_1k_chars: 0.000075,   // ~$0.30 / 1M tokens (~4M chars) -> 0.30 / 4000 = 0.000075
  },
  gemini_flash_image: {
    per_image: 0.003 // Estimated low cost for flash image generation
  },
  gemini_pro_image: {
    per_image: 0.04 // Standard Pro image generation cost
  }
};

export const estimateCost = (
  inputCharCount: number,
  outputCharCount: number,
  imageCount: number,
  imageModel: ImageModelType | 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image'
): AICost => {
  
  // Calculate Text Cost
  const inputCost = (inputCharCount / 1000) * PRICING.gemini_flash_text.input_per_1k_chars;
  const outputCost = (outputCharCount / 1000) * PRICING.gemini_flash_text.output_per_1k_chars;

  // Calculate Image Cost
  let imageUnitCost = 0;
  if (imageModel === 'gemini-3-pro-image-preview') {
    imageUnitCost = PRICING.gemini_pro_image.per_image;
  } else {
    imageUnitCost = PRICING.gemini_flash_image.per_image;
  }
  const imageCost = imageCount * imageUnitCost;

  const totalCost = inputCost + outputCost + imageCost;

  return {
    totalCost: Number(totalCost.toFixed(5)), // Keep 5 decimals for micro-costs
    currency: 'USD',
    breakdown: {
      textInput: Number(inputCost.toFixed(5)),
      textOutput: Number(outputCost.toFixed(5)),
      imageGeneration: Number(imageCost.toFixed(5)),
      imageCount,
      imageModel
    }
  };
};
