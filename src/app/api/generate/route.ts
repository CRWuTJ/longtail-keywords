import { NextRequest, NextResponse } from 'next/server';

const MAX_BODY_BYTES = 1024;

function errorResponse(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const bodySize = new TextEncoder().encode(rawBody).length;

    if (bodySize > MAX_BODY_BYTES) {
      return errorResponse('请求体过大', 'BODY_TOO_LARGE', 413);
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse('请求体必须是有效的JSON', 'INVALID_BODY', 400);
    }

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return errorResponse('请求体必须是JSON对象', 'INVALID_BODY', 400);
    }

    if (!('keyword' in body)) {
      return errorResponse('缺少keyword字段', 'MISSING_KEYWORD', 400);
    }

    const { keyword } = body as { keyword: unknown };
    if (typeof keyword !== 'string') {
      return errorResponse('keyword必须是字符串', 'INVALID_KEYWORD', 400);
    }

    const trimmedKeyword = keyword.trim();
    if (!trimmedKeyword) {
      return errorResponse('keyword不能为空', 'INVALID_KEYWORD', 400);
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return errorResponse('API Key未配置', 'API_KEY_MISSING', 500);
    }

    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `作为SEO专家，请根据种子关键词「${trimmedKeyword}」生成20个中文长尾关键词。每个关键词包含：keyword（长尾关键词）、intent（搜索意图：信息型/商业型/交易型/导航型）、competition（竞争度：低/中/高）。只返回JSON数组，不要其他内容。格式：[{"keyword":"...","intent":"...","competition":"..."}]`
        }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error('DeepSeek upstream error', { status: response.status });
      return errorResponse('上游服务错误', 'UPSTREAM_ERROR', 502);
    }

    let data: any;
    try {
      data = await response.json();
    } catch {
      console.error('DeepSeek response parse error', { status: response.status });
      return errorResponse('上游响应解析失败', 'PARSE_ERROR', 502);
    }

    const content = data.choices?.[0]?.message?.content || '[]';

    let keywords = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      console.error('DeepSeek content parse error', { status: response.status });
      return errorResponse('上游响应解析失败', 'PARSE_ERROR', 502);
    }

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error('Generate route internal error', {
      type: error instanceof Error ? error.name : typeof error
    });
    return errorResponse('生成失败，请重试', 'INTERNAL_ERROR', 500);
  }
}
