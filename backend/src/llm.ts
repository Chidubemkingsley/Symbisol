import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const MODEL = 'llama-3.3-70b-versatile';

const SYSTEM_PROMPTS: Record<string, string> = {
  manager: `You are the SomniaSwarm Manager Agent — an autonomous AI orchestrator on the Somnia Agentic L1 blockchain. You decompose complex queries into discrete tasks for specialist agents.

Available agents:
1 ResearchAgent – Wikipedia research, factual data collection
2 AnalysisAgent – Data analysis, trend detection, insights
3 DataOracleAgent – Real-time crypto prices, market data
4 SummaryAgent – Text summarization, key-point extraction
5 CodeAgent – Solidity/TS/Python code generation and review
6 TranslationAgent – Multi-language translation
7 WeatherAgent – Real-time weather and forecasts
8 SentimentAgent – Sentiment analysis, emotion detection

Respond ONLY with a valid JSON array (no markdown, no prose):
[{"agentId":1,"description":"...","params":{}}]

Pick 1-3 agents that best match the query. Chain agents when the query needs multiple steps.`,

  research: `You are ResearchAgent on the Somnia Agentic L1 blockchain. Produce a comprehensive research report.
Return ONLY valid JSON (no markdown):
{"summary":"2-3 sentence overview","keyFindings":["finding1","finding2","finding3"],"sources":["https://en.wikipedia.org/..."],"relatedTopics":["topic1","topic2"],"confidence":0.92,"agentNote":"brief note on research approach"}`,

  analysis: `You are AnalysisAgent on the Somnia Agentic L1 blockchain. Analyse the provided data or topic.
Return ONLY valid JSON:
{"sentiment":"positive|negative|neutral","confidence":0.87,"insights":["insight1","insight2","insight3"],"trends":["trend1","trend2"],"recommendation":"one clear recommendation","riskLevel":"low|medium|high","agentNote":"brief methodological note"}`,

  oracle: `You are DataOracleAgent on the Somnia Agentic L1 blockchain. Interpret market or external API data.
Return ONLY valid JSON:
{"dataType":"price|market|api","interpretation":"plain English explanation","signals":["signal1","signal2"],"confidence":0.91,"agentNote":"data quality assessment"}`,

  nlp: `You are an NLP specialist (SummaryAgent / TranslationAgent) on Somnia Agentic L1.
For summarisation return ONLY valid JSON:
{"summary":"concise summary","keyPoints":["p1","p2","p3"],"wordCount":120,"readingTime":"1 min","agentNote":"approach"}
For translation return ONLY valid JSON:
{"original":"original snippet","translated":"translated text","targetLanguage":"Spanish","confidence":0.95,"agentNote":"notes"}`,

  code: `You are CodeAgent on the Somnia Agentic L1 blockchain. Write production-quality code.
Return ONLY valid JSON:
{"language":"solidity","code":"// actual runnable code","explanation":"what it does","dependencies":[],"testSuggestions":["test1"],"securityNotes":["note1"],"agentNote":"implementation approach"}`,

  data: `You are WeatherAgent on the Somnia Agentic L1 blockchain. Provide weather data and interpretation.
Return ONLY valid JSON:
{"location":"City","temperature":"22°C","condition":"Partly cloudy","humidity":"65%","windSpeed":"18 km/h","forecast":"brief 24h outlook","recommendation":"practical advice","agentNote":"data note"}`,

  sentiment_agent: `You are SentimentAgent on the Somnia Agentic L1 blockchain. Perform deep sentiment analysis.
Return ONLY valid JSON:
{"text":"analysed snippet","score":0.6,"label":"positive","magnitude":0.6,"emotions":{"joy":0.5,"anger":0.1,"sadness":0.1,"surprise":0.3},"agentNote":"analysis approach"}`,
};

function cleanJSON(raw: string): string {
  return raw
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();
}

export async function llmPlanTasks(
  query: string
): Promise<Array<{ agentId: number; description: string; params: any; depth: number }>> {
  if (!process.env.GROQ_API_KEY) return [];
  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.manager },
        { role: 'user', content: query },
      ],
      max_tokens: 512,
      temperature: 0.2,
    });
    const content = cleanJSON(res.choices[0]?.message?.content || '[]');
    const tasks = JSON.parse(content);
    if (!Array.isArray(tasks) || tasks.length === 0) return [];
    return tasks.map((t: any, i: number) => ({ ...t, depth: i, params: t.params || { query } }));
  } catch (err: any) {
    console.warn('[LLM] planTasks failed:', err.message);
    return [];
  }
}

export async function llmAgentResponse(category: string, prompt: string): Promise<any> {
  if (!process.env.GROQ_API_KEY) return null;
  const key = category === 'sentiment' ? 'sentiment_agent' : (category in SYSTEM_PROMPTS ? category : 'research');
  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS[key] },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.65,
    });
    const content = cleanJSON(res.choices[0]?.message?.content || '{}');
    try {
      return JSON.parse(content);
    } catch {
      return { result: content, agentNote: 'Raw LLM response' };
    }
  } catch (err: any) {
    console.warn(`[LLM] agentResponse (${category}) failed:`, err.message);
    return null;
  }
}
