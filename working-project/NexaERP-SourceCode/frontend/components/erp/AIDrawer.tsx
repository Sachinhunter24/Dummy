import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { ChatMessage } from '../../types/erp';

const erpResponses: Record<string, string> = {
  'stock': '📦 Current low-stock alerts: **Dolo 650mg** (8 units), **Britannia Bread** (5 units), **Fortune Oil** (12 units). Want me to generate a purchase order?',
  'revenue': '💰 Today\'s revenue is **₹25,500** with **18 invoices** raised. This week\'s total stands at **₹1,83,300** — up 12% from last week!',
  'udhaar': '📒 Total outstanding: **₹9,600** across 5 accounts. Deepak Verma has the oldest due (₹4,500 · 85 days). Shall I send a WhatsApp reminder?',
  'expenses': '📊 This month\'s expenses total **₹58,400**. Salary is the biggest cost (₹1.76L). Your expense-to-revenue ratio is **32%** — within healthy range.',
  'staff': '👥 8 staff members active. Vikas Sharma is currently **blocked**. Average attendance this month: **93.4%**. Payroll due in **8 days**.',
  'invoice': '🧾 I can generate a GST invoice. Please go to the **POS Billing** module, select customer, add items, and tap **Generate Invoice**. I\'ll auto-calculate GST + IGST.',
  'gst': '📋 GST rates applied: 0% (food essentials), 5% (packaged food), 12% (medicines), 18% (electronics, services), 28% (luxury). Your GSTIN is **07NEXAERP123Z1**.',
  'report': '📈 Monthly P&L: Revenue **₹5.2L** | Expenses **₹1.8L** | Net Profit **₹3.4L** (65% margin). Want me to export as PDF?',
  'customer': '👤 You have **10 customers** — 3 VIP, 5 Active, 2 Inactive. Mohan Yadav & Suresh Menon are your highest-value customers. CRM follow-up due for 3 inactive clients.',
  'hello': '👋 Hi! I\'m your AI Business Assistant. I can help with inventory, billing, expense analysis, staff management, customer insights, and more. What would you like to know?',
  'help': '🤖 I can assist with:\n• **Stock & Inventory** queries\n• **Revenue & P&L** reports\n• **Udhaar / Khata** tracking\n• **Staff & Payroll** info\n• **GST & Invoicing** help\n• **Lead & CRM** insights\n\nJust ask naturally!',
};

function getAIResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(erpResponses)) {
    if (lower.includes(key)) return val;
  }
  if (lower.includes('sale') || lower.includes('billing')) return '🛒 Today\'s sales: **₹25,500** (18 bills). Best-selling item: **Basmati Rice 5kg** (12 units). Average bill value: **₹1,416**.';
  if (lower.includes('lead') || lower.includes('pipeline')) return '🎯 Sales pipeline: **2 New**, **2 Discussion**, **2 Proposal**, **2 Closed**. Pipeline value: **₹32.97L**. Sunrise Exports (₹12L) is the biggest deal.';
  if (lower.includes('pay') || lower.includes('salary')) return '💵 Payroll this month: **₹1,76,000** for 8 staff. Next payout: 1st Feb 2025. Vikas Sharma\'s salary is on hold (blocked status).';
  if (lower.includes('whatsapp') || lower.includes('sms')) return '📱 I can trigger WhatsApp reminders to overdue customers. Go to **Udhaar Book → Select customer → Send Reminder** or use the **Client Directory** for bulk reminders.';
  if (lower.includes('barcode') || lower.includes('scan')) return '📷 Use the **📸 Scan button** (bottom right) to scan barcodes. Supported formats: QR Code, EAN-13, UPC-A, Code-128. The scanner auto-fetches product details.';
  return '🤖 I\'m analysing your request. Based on your ERP data, here\'s a suggestion: check the relevant module for real-time data. Need a specific report? Just mention the topic — revenue, stock, staff, expenses, or customers!';
}

export function AIDrawer() {
  const { isAIOpen, setIsAIOpen } = useApp();
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'assistant', content: '👋 Hello! I\'m **UniversalAI**, your enterprise business assistant. Ask me about inventory, revenue, staff, GST, customers, or anything ERP-related!', timestamp: 'now' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', content: text, timestamp: 'now' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      const reply: ChatMessage = { id: (Date.now() + 1).toString(), role: 'assistant', content: getAIResponse(text), timestamp: 'now' };
      setMessages(prev => [...prev, reply]);
      setIsTyping(false);
    }, 900 + Math.random() * 600);
  };

  const quickPrompts = ['📦 Stock status', '💰 Today\'s revenue', '📒 Udhaar total', '👥 Staff info'];

  if (!isAIOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsAIOpen(false)} />
      <div className="relative w-full max-w-sm h-full flex flex-col slide-in-right erp-bg dark:erp-bg shadow-2xl">
        {/* Header */}
        <div className="glass-header flex items-center gap-3 px-5 py-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>🤖</div>
          <div className="flex-1">
            <div className="font-bold text-indigo-900 dark:text-white text-sm">UniversalAI Assistant</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
              <span className="text-xs text-indigo-700 dark:text-white/55">Online · ERP-Aware</span>
            </div>
          </div>
          <button onClick={() => setIsAIOpen(false)} className="btn-glass w-8 h-8 rounded-xl flex items-center justify-center text-sm">✕</button>
        </div>

        {/* Quick prompts */}
        <div className="flex gap-2 px-4 py-3 flex-wrap">
          {quickPrompts.map(p => (
            <button key={p} onClick={() => { setInput(p.replace(/^[^\s]+\s/, '')); }}
              className="btn-glass text-xs px-3 py-1.5 rounded-lg font-medium text-indigo-900 dark:text-white/80">
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>🤖</div>
              )}
              <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                ${m.role === 'user'
                  ? 'bg-violet-600 text-white rounded-tr-sm'
                  : 'glass text-indigo-900 dark:text-white/90 rounded-tl-sm'
                }`}>
                {m.content.split('**').map((part, i) =>
                  i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                )}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}>🤖</div>
              <div className="glass px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="glass-header px-4 py-3 flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Ask about stock, revenue, GST..."
            className="glass-input flex-1 rounded-xl px-4 py-2.5 text-sm outline-none"
          />
          <button onClick={send} disabled={!input.trim()}
            className="btn-primary w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
