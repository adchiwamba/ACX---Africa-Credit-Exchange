import express from "express";
import cors from "cors";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.post("/api/ocr", upload.single('file'), async (req, res) => {
    try {
      const file = req.file;
      const { docType } = req.body;

      console.log(`[OCR] POST /api/ocr - Type: ${docType}, File: ${file?.originalname}, Size: ${file?.size} bytes`);

      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const base64Data = file.buffer.toString('base64');
      const mimeType = file.mimetype;

      let prompt = "";
      const responseSchema: {
        type: Type;
        properties: Record<string, unknown>;
        required: string[];
      } = {
        type: Type.OBJECT,
        properties: {
          success: { type: Type.BOOLEAN },
          extractedValue: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          errorMessage: { type: Type.STRING }
        },
        required: ["success"]
      };

      if (docType === 'nationalId' || docType === 'passport') {
        prompt = "You are an OCR expert. Extract the unique identification number (National ID or Passport) from this image. Set 'success' to true if you find it, otherwise false. Return the number as a string in 'extractedValue'. Only return digits and capital letters.";
      } else if (docType === 'payslip') {
        prompt = "You are an OCR expert. Extract 'Net Pay' and 'Gross Pay' from this payslip. Set 'success' to true if you find them, otherwise false. Return the net pay value as a string in 'extractedValue'.";
        responseSchema.properties.grossSalary = { type: Type.STRING };
        responseSchema.properties.netSalary = { type: Type.STRING };
      } else {
        console.warn(`[OCR] Invalid docType: ${docType}`);
        return res.status(400).json({ error: "Invalid document type for OCR" });
      }

      // Allowed models according to gemini-api skill
      const modelsToTry = ["gemini-3-flash-preview", "gemini-flash-latest", "gemini-3.1-flash-lite"];
      
      let attempts = 0;
      const maxAttempts = 3;
      let lastModelError: { status?: number; error?: { code?: number }; message?: string } | null = null;
      
      while (attempts < maxAttempts) {
        const modelName = modelsToTry[attempts % modelsToTry.length];
        console.log(`[OCR] Attempt ${attempts + 1} processing ${docType} with ${modelName}`);
        
        try {
          const result = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            config: {
              responseMimeType: "application/json",
              responseSchema
            }
          });

          let responseText = "{}";
          try {
            responseText = result.text || "{}";
          } catch (textErr) {
            console.warn(`[OCR] result.text access failed, trying fallback:`, textErr);
            const resAsDynamic = result as unknown as { response: { text: () => string } };
            if (resAsDynamic.response) {
              responseText = resAsDynamic.response.text();
            }
          }
          
          console.log(`[OCR] SUCCESS for ${docType} using ${modelName}`);
          const ocrData = JSON.parse(responseText);
          return res.json(ocrData);
        } catch (error: unknown) {
          lastModelError = error;
          const err = error as { status?: number; error?: { code?: number }; message?: string };
          attempts++;
          const status = err.status || (err.error && err.error.code);
          
          console.error(`[OCR] Gemini Error: Status=${status}, Model=${modelName}, Attempt=${attempts}, Message=${err.message}`);

          if (status === 503 || status === 429 || status === 404 || status === 401) {
            const delay = attempts * 1000;
            console.warn(`[OCR] Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          break; // Stop retrying for non-retriable errors (like 400 Bad Request)
        }
      }

      const finalStatus = lastModelError?.status || (lastModelError?.error && lastModelError?.error.code) || 500;
      console.error(`[OCR] Final Failure for ${docType} after ${attempts} attempts. Status: ${finalStatus}`);
      
      return res.status(finalStatus).json({ 
        error: "Failed to process document with AI", 
        details: lastModelError?.message || "All model attempts failed",
        code: finalStatus
      });

    } catch (error: unknown) {
      const err = error as Error;
      console.error("[OCR CRITICAL ERROR]", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Server error during OCR processing", details: err.message });
      }
    }
  });

  // Global Error Handler to catch middleware errors (like Multer) and return JSON
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error & { status?: number }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("[SERVER ERROR]", err);
    res.status(err.status || 500).json({
      error: "Server Error",
      message: err.message || "An unexpected error occurred",
      details: process.env.NODE_ENV === 'development' ? err : undefined
    });
  });

  // Mock Database state (in-memory for demo)
  let balance = 1250000;
  
  app.get("/api/user/balance", (req, res) => {
    res.json({ balance });
  });

  app.post("/api/user/deposit", (req, res) => {
    const { amount } = req.body;
    if (typeof amount === 'number' && amount > 0) {
      balance += amount;
      res.json({ success: true, newBalance: balance });
    } else {
      res.status(400).json({ error: "Invalid amount" });
    }
  });

  app.post("/api/notify/download", (req, res) => {
    const { type, email, userName } = req.body;
    console.log(`[NOTIFICATION] Sending email to ${email || 'user'}: "Your ${type || 'document'} has been downloaded by ${userName || 'you'}."`);
    res.json({ success: true, message: "Notification sent." });
  });

  app.post("/api/auth/2fa", (req, res) => {
    const { email } = req.body;
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`\n================================================\n[2FA AUTH] Code for ${email}: ${code}\n================================================\n`);
    res.json({ success: true, code }); // In a real app, don't return the code!
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
