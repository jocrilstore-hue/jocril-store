const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
}

interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function callOpenRouter(
  config: OpenRouterConfig,
  messages: ChatMessage[],
  options?: {
    maxTokens?: number;
    temperature?: number;
  },
): Promise<{ content: string; usage?: OpenRouterResponse["usage"] }> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "Jocril Admin SEO",
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: options?.maxTokens || 500,
      temperature: options?.temperature ?? 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: OpenRouterResponse = await response.json();
  const content = data.choices[0]?.message?.content || "";

  return { content, usage: data.usage };
}

export async function testConnection(
  config: OpenRouterConfig,
): Promise<boolean> {
  try {
    const result = await callOpenRouter(
      config,
      [{ role: "user", content: "Say only: OK" }],
      { maxTokens: 10 },
    );
    // If we got any response, the connection works
    return result.content.length > 0;
  } catch {
    return false;
  }
}

// SEO-specific generation functions

export interface ProductContext {
  name: string;
  category?: string;
  material?: string;
  shortDescription?: string;
  fullDescription?: string;
  advantages?: string;
}

export async function generateMetaDescription(
  config: OpenRouterConfig,
  product: ProductContext,
): Promise<string> {
  const prompt = `Gera uma meta descrição SEO em português de Portugal para este produto de acrílico.

Produto: ${product.name}
Categoria: ${product.category || "Expositores"}
Material: ${product.material || "Acrílico"}
${product.shortDescription ? `Descrição curta: ${product.shortDescription}` : ""}
${product.advantages ? `Vantagens: ${product.advantages}` : ""}

Requisitos:
- Máximo 155 caracteres
- Inclui palavras-chave relevantes
- Apelativo para cliques
- Em português de Portugal (não brasileiro)
- Não uses aspas na resposta
- Responde APENAS com a meta descrição, sem explicações`;

  const result = await callOpenRouter(config, [
    {
      role: "system",
      content:
        "És um especialista em SEO para e-commerce em português de Portugal. Respondes apenas com o texto pedido, sem formatação extra.",
    },
    { role: "user", content: prompt },
  ]);

  return result.content.trim().replace(/^["']|["']$/g, "");
}

export async function generateUniqueTitle(
  config: OpenRouterConfig,
  product: ProductContext,
  existingTitles: string[],
): Promise<string> {
  const prompt = `Gera um título SEO único em português de Portugal para este produto de acrílico.

Produto atual: ${product.name}
Categoria: ${product.category || "Expositores"}
Material: ${product.material || "Acrílico"}

Títulos já existentes (evita duplicar):
${existingTitles
  .slice(0, 10)
  .map((t) => `- ${t}`)
  .join("\n")}

Requisitos:
- Máximo 60 caracteres
- Único e diferenciado dos existentes
- Inclui palavras-chave relevantes
- Em português de Portugal
- Não uses aspas na resposta
- Responde APENAS com o título, sem explicações`;

  const result = await callOpenRouter(config, [
    {
      role: "system",
      content:
        "És um especialista em SEO para e-commerce em português de Portugal. Respondes apenas com o texto pedido, sem formatação extra.",
    },
    { role: "user", content: prompt },
  ]);

  return result.content.trim().replace(/^["']|["']$/g, "");
}

export async function generateImageAltText(
  config: OpenRouterConfig,
  imageUrl: string,
  productContext: ProductContext,
): Promise<string> {
  // Check if model supports vision
  const supportsVision =
    config.model.includes("gemini") ||
    config.model.includes("gpt-4") ||
    config.model.includes("claude-3");

  if (supportsVision) {
    // Use vision capability
    const result = await callOpenRouter(config, [
      {
        role: "system",
        content:
          "És um especialista em acessibilidade web e SEO. Descreves imagens de produtos de forma clara e otimizada para SEO em português de Portugal.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Descreve esta imagem de produto para usar como alt text.

Contexto do produto:
- Nome: ${productContext.name}
- Categoria: ${productContext.category || "Expositores de acrílico"}
- Material: ${productContext.material || "Acrílico"}

Requisitos:
- Máximo 125 caracteres
- Descritivo e útil para utilizadores com deficiência visual
- Inclui palavras-chave relevantes para SEO
- Em português de Portugal
- Responde APENAS com o alt text, sem aspas nem explicações`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ]);

    return result.content.trim().replace(/^["']|["']$/g, "");
  } else {
    // Fallback: generate based on product context only
    const prompt = `Gera alt text para uma imagem de produto.

Produto: ${productContext.name}
Categoria: ${productContext.category || "Expositores de acrílico"}
Material: ${productContext.material || "Acrílico"}

Requisitos:
- Máximo 125 caracteres
- Descritivo para acessibilidade
- Em português de Portugal
- Responde APENAS com o alt text, sem aspas`;

    const result = await callOpenRouter(config, [
      {
        role: "system",
        content:
          "És um especialista em acessibilidade web e SEO em português de Portugal.",
      },
      { role: "user", content: prompt },
    ]);

    return result.content.trim().replace(/^["']|["']$/g, "");
  }
}
