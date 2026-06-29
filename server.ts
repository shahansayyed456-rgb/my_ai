import express from "express";
import path from "path";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";
// @ts-ignore
import pdfParse from "pdf-parse";

dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// Initialize Gemini
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
} catch (error) {
  console.warn("Failed to initialize Gemini API:", error);
}

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.NUMBER,
      description: "Score out of 10 for the user's answer",
    },
    mistakes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of mistakes or areas for improvement in the user's answer",
    },
    idealAnswer: {
      type: Type.STRING,
      description: "The ideal, professional answer to the question",
    },
    nextQuestion: {
      type: Type.STRING,
      description: "The next interview question to ask, strictly based on the resume skills and projects. Progressively increase difficulty.",
    },
    nextQuestionCategory: {
      type: Type.STRING,
      description: "Category of the next question (e.g., Linux, AWS, DevOps, Networking, HR, Projects)",
    },
    nextQuestionDifficulty: {
      type: Type.STRING,
      description: "Difficulty of the next question (Beginner, Intermediate, Advanced)",
    }
  },
  required: ["score", "mistakes", "idealAnswer", "nextQuestion", "nextQuestionCategory", "nextQuestionDifficulty"],
};

const app = express();

app.use(express.json());

// API Routes
  app.post("/api/upload-resume", upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      const data = await pdfParse(req.file.buffer);
      res.json({ text: data.text });
    } catch (error: any) {
      console.error("Error parsing PDF:", error);
      res.status(500).json({ error: "Failed to parse PDF file." });
    }
  });

  app.post("/api/analyze-resume", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }

      const { resumeText } = req.body;
      if (!resumeText) {
         return res.status(400).json({ error: "No resume text provided" });
      }

      const systemInstruction = `
        Analyze this resume thoroughly. Extract all skills, projects, technologies, education, and experience.
        Based on this extraction, generate exactly 40 diverse interview questions spanning technical, behavioral, HR, and project deep dives. Provide complete, ideal answers.
        
        Resume text:
        ${resumeText}
      `;

      const analysisSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          skills: { type: Type.ARRAY, items: { type: Type.STRING } },
          projects: { type: Type.ARRAY, items: { type: Type.STRING } },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                category: { type: Type.STRING },
                difficulty: { type: Type.STRING }
              },
              required: ["id", "question", "answer", "category", "difficulty"]
            }
          }
        },
        required: ["skills", "projects", "questions"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemInstruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: analysisSchema,
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from Gemini");

      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing resume:", error);
      res.status(500).json({ error: error.message || "Failed to analyze resume." });
    }
  });

  app.post("/api/coach", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }

      const { currentQuestion, userDraft, resumeText } = req.body;
      if (!currentQuestion) {
        return res.status(400).json({ error: "Missing currentQuestion" });
      }

      const systemInstruction = `
        You are an expert Interview Coach.
        The candidate is currently facing this interview question: "${currentQuestion}"
        
        The candidate's resume text:
        ${resumeText || "No resume provided"}
        
        The candidate's current drafted answer (may be empty or incomplete):
        "${userDraft || ""}"
        
        Provide a short, highly practical tip on how they should answer this question based on their resume. Give them a bullet point or two on what to highlight. Keep it very concise and encouraging.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemInstruction,
        config: {
          temperature: 0.7,
        }
      });

      res.json({ suggestion: response.text });
    } catch (error: any) {
      console.error("Error in coach:", error);
      res.status(500).json({ error: error.message || "Failed to generate coaching suggestion." });
    }
  });

  app.post("/api/evaluate", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }

      const { currentQuestion, userAnswer, chatHistory, resumeText } = req.body;

      const systemInstruction = `
        You are a Senior Software Engineer, Technical Interviewer, and HR Manager at a top tech company (Google, Amazon, etc.).
        You are conducting a strict, realistic Mock Interview for a candidate with the following resume:
        ${resumeText || "No resume provided, ask general software engineering and behavioral questions."}

        The candidate is answering the following question: "${currentQuestion}"
        The candidate's answer is: "${userAnswer}"

        Your task:
        1. Evaluate the candidate's answer strictly but constructively.
        2. Give a score out of 10.
        3. List specific technical mistakes or missing points.
        4. Provide the ideal, professional answer.
        5. Generate the NEXT question based on the resume. It can be a follow-up, cross-question, scenario-based, or move to a new topic from their resume.
        
        Never ask random questions outside the candidate's resume scope. Keep it highly relevant to their skills and projects.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemInstruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini");
      }

      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("Error evaluating answer:", error);
      res.status(500).json({ error: error.message || "Failed to evaluate answer." });
    }
  });

  // Start initial interview session
  app.post("/api/start-interview", async (req, res) => {
    try {
      if (!ai) {
        return res.status(500).json({ error: "Gemini API key is missing or invalid." });
      }

      const { resumeText } = req.body;
      const systemInstruction = `
        You are a Senior Software Engineer, Technical Interviewer, and HR Manager at a top tech company (Google, Amazon, etc.).
        You are conducting a strict, realistic Mock Interview for a candidate with the following resume:
        ${resumeText || "No resume provided. Assume a software engineer."}

        Generate the VERY FIRST interview question to start the technical interview. It should be an introductory technical or HR question based on one of their core skills or projects.
      `;

      const initialSchema: Schema = {
        type: Type.OBJECT,
        properties: {
          nextQuestion: { type: Type.STRING },
          nextQuestionCategory: { type: Type.STRING },
          nextQuestionDifficulty: { type: Type.STRING }
        },
        required: ["nextQuestion", "nextQuestionCategory", "nextQuestionDifficulty"]
      };

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: systemInstruction,
        config: {
          responseMimeType: "application/json",
          responseSchema: initialSchema,
          temperature: 0.7,
        }
      });

      const responseText = response.text;
      if (!responseText) throw new Error("Empty response from Gemini");

      const result = JSON.parse(responseText);
      res.json(result);
    } catch (error: any) {
      console.error("Error starting interview:", error);
      res.status(500).json({ error: error.message || "Failed to start interview." });
    }
  });


// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  import("vite").then(({ createServer: createViteServer }) => {
    createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    }).then((vite) => {
      app.use(vite.middlewares);
      const PORT = process.env.PORT || 3000;
      app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  
  if (!process.env.VERCEL) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

export default app;
