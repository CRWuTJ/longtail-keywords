'use client';
import { useState } from 'react';

interface Keyword { keyword: string; intent: string; competition: string; }

export default function Home() {
  const [seed, setSeed] = useState('');
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const generate = async () => {
    if (!seed.trim()) return;
    setLoading(true); setError(''); setKeywords([]);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: seed.trim() })
      });
      const data = await res.json();
      if (data.error) { setError(data.error); } else { setKeywords(data.keywords || []); }
    } catch { setError('网络错误，请重试'); }
    setLoading(false);
  };

  const copyAll = () => {
    const text = keywords.map(k => k.keyword).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-2">AI 长尾关键词助手</h1>
        <p className="text-center text-gray-500 mb-8">输入种子关键词，AI 为你生成20个高质量长尾关键词</p>
        <div className="flex gap-3 mb-8">
          <input value={seed} onChange={e => setSeed(e.target.value)} onKeyDown={e => e.key === 'Enter' && generate()}
            placeholder="输入种子关键词，如：减肥" className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-lg" />
          <button onClick={generate} disabled={loading || !seed.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg whitespace-nowrap">
            {loading ? '生成中...' : '生成关键词'}
          </button>
        </div>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {keywords.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-600">共 {keywords.length} 个关键词</span>
              <button onClick={copyAll} className="px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50">一键复制全部</button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full">
                <thead className="bg-gray-50"><tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">序号</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">长尾关键词</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">搜索意图</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">竞争度</th>
                </tr></thead>
                <tbody>{keywords.map((k, i) => (
                  <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">{i + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{k.keyword}</td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${k.intent === '信息型' ? 'bg-green-100 text-green-700' : k.intent === '商业型' ? 'bg-yellow-100 text-yellow-700' : k.intent === '交易型' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{k.intent}</span></td>
                    <td className="px-4 py-3 text-sm"><span className={`px-2 py-1 rounded text-xs ${k.competition === '低' ? 'bg-green-100 text-green-700' : k.competition === '中' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{k.competition}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}