
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as dotenv from "dotenv";

dotenv.config();

async function checkModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ GEMINI_API_KEY is missing");
    return;
  }
  
  console.log("Checking available models with API key...");
  
  // Direct fetch to list models since SDK might not expose it easily in all versions
  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      const data = await response.json();
      
      if (data.error) {
          console.error("❌ API Error:", data.error);
          return;
      }
      
      console.log("✅ Available Models:");
      if (data.models) {
          data.models.forEach((m: any) => {
              if (m.name.includes("gemini")) {
                  console.log(` - ${m.name} (${m.supportedGenerationMethods.join(", ")})`);
              }
          });
      } else {
          console.log("No models found or different response structure:", data);
      }
  } catch (e: any) {
      console.error("❌ Fetch failed:", e.message);
  }
}

checkModels();
