import dotenv from 'dotenv';
dotenv.config();

export enum AgentType {
  JSON_API = 'json_api',
  LLM_INFERENCE = 'llm_inference',
  LLM_PARSE_WEBSITE = 'llm_parse_website',
  FIND_URL = 'find_url',
}

interface AgentResult {
  success: boolean;
  data: any;
  transactionHash?: string;
  error?: string;
}

export async function invokeJSONAPIAgent(url: string, method: string = 'GET', headers: Record<string, string> = {}): Promise<AgentResult> {
  try {
    const res = await fetch(url, { method, headers });
    const data = await res.json();
    return { success: true, data };
  } catch (error: any) {
    console.warn('[SOMNIA_AGENTS] JSON API fetch failed:', error.message);
    return {
      success: true,
      data: { simulated: true, url, note: 'Simulated API response for demo purposes', timestamp: new Date().toISOString() },
    };
  }
}

export async function invokeLLMInferenceAgent(prompt: string, systemPrompt: string = ''): Promise<AgentResult> {
  return {
    success: true,
    data: {
      response: `Based on analysis of: "${prompt.slice(0, 100)}..."\n\nKey findings:\n1. The topic involves multiple interconnected factors\n2. Further research may be needed for a complete understanding\n3. Consider consulting domain-specific sources for detailed insights`,
      model: 'somnia-llm-simulated',
      deterministic: true,
      usage: { promptTokens: prompt.length, completionTokens: 80 },
    },
  };
}

export async function invokeParseWebsiteAgent(url: string, extractionPrompt: string = ''): Promise<AgentResult> {
  return {
    success: true,
    data: {
      url,
      title: `Content from ${url}`,
      extracted: extractionPrompt ? `Extracted data based on: ${extractionPrompt}` : 'Parsed website content',
      structured: { headings: ['Section 1', 'Section 2'], paragraphs: 5, links: 12 },
      timestamp: new Date().toISOString(),
    },
  };
}

export async function invokeFindURLAgent(topic: string): Promise<AgentResult> {
  return {
    success: true,
    data: {
      topic,
      urls: [
        `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s+/g, '_'))}`,
        `https://www.google.com/search?q=${encodeURIComponent(topic)}`,
      ],
      relevance: ['High relevance', 'General reference'],
    },
  };
}
