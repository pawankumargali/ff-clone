// src/api/notes.chat.ts
import OpenAI from "openai";
import config from "../../config.js";

const openai = new OpenAI({ apiKey: config.OPENAI_API_KEY! });

export default openai;
