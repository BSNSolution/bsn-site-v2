/**
 * Abstração simples para chamar LLMs dos 3 provedores suportados.
 * Sem SDK — apenas fetch — pra não inflar dependências.
 */

type Provider = "openai" | "anthropic" | "google";

interface LLMRequest {
  provider: Provider;
  model: string;
  apiKey: string;
  systemPrompt: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export function buildSystemPrompt(custom?: string | null): string {
  const base = `Você é um redator técnico sênior da BSN Solution, uma software house de Cuiabá-MT especializada em desenvolvimento sob medida, IA aplicada, modernização de legado e squads ágeis.

Voz da BSN:
- Direta, técnica, sem jargão de marketing
- Usa exemplos concretos, números, casos reais
- Escreve em PT-BR (pt-br), sem acentos em código/slugs
- Evita "em 2026...", "no mundo atual...", "cada vez mais..."
- Frases curtas, parágrafos de 2-4 linhas no máximo
- Quando fizer sentido: tabelas, listas numeradas, blocos de código

Nunca mencione:
- Concorrentes específicos por nome
- Fontes externas do conteúdo (como se fosse original BSN)
- Clichês de blog corporativo`;

  return custom ? `${base}\n\nInstruções adicionais:\n${custom}` : base;
}

/**
 * Chama o LLM e retorna o texto gerado (string pura).
 */
export async function callLLM(req: LLMRequest): Promise<string> {
  const { provider, model, apiKey, systemPrompt, userPrompt, temperature, maxTokens } = req;

  if (provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenAI ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data: any = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  }

  if (provider === "anthropic") {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        temperature,
        max_tokens: maxTokens ?? 4000,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Anthropic ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data: any = await res.json();
    return data.content?.[0]?.text ?? "";
  }

  if (provider === "google") {
    // Gemini v1beta
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
          },
        }),
      }
    );
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Google ${res.status}: ${txt.slice(0, 300)}`);
    }
    const data: any = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  throw new Error(`Provider desconhecido: ${provider}`);
}

/**
 * Faz scraping simples de uma URL e retorna { title, text }.
 * Extrai texto do primeiro <main>, <article> ou do <body> — removendo scripts/styles.
 */
export async function scrapeUrl(url: string): Promise<{ title: string; text: string }> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) BSNBot/1.0",
      Accept: "text/html,application/xhtml+xml",
    },
  });
  if (!res.ok) throw new Error(`Falha ao buscar URL (${res.status})`);
  const html = await res.text();

  // Extrai título
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1].trim()) : "";

  // Tenta achar <main> ou <article>, senão usa <body>
  let body = "";
  const mainMatch = html.match(/<(main|article)[^>]*>([\s\S]*?)<\/\1>/i);
  if (mainMatch) {
    body = mainMatch[2];
  } else {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    body = bodyMatch ? bodyMatch[1] : html;
  }

  // Remove scripts, styles, nav, aside, footer, header
  body = body
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  // Remove todas as tags e normaliza espaços
  const text = body
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { title, text: decodeEntities(text) };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "…")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
