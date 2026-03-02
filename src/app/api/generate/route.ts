import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || typeof keyword !== 'string') {
      return NextResponse.json({ error: '请输入关键词' }, { status: 400 });
    }
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key未配置' }, { status: 500 });
    }
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'user',
          content: `作为SEO专家，请根据种子关键词「${keyword}」生成20个中文长尾关键词。每个关键词包含：keyword（长尾关键词）、intent（搜索意图：信息型/商业型/交易型/导航型）、competition（竞争度：低/中/高）。只返回JSON数组，不要其他内容。格式：[{"keyword":"...","intent":"...","competition":"..."}]`
        }],
        temperature: 0.7,
        max_tokens: 2000
      })
    });
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '[]';
    const jsonMatch = content.match(/\[.*\]/s);
    const keywords = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    return NextResponse.json({ keywords });
  } catch (error) {
    return NextResponse.json({ error: '生成失败，请重试' }, { status: 500 });
  }
}