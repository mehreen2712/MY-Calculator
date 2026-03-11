/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { 
  Calculator as CalculatorIcon, 
  History, 
  MessageSquare, 
  Trash2, 
  Copy, 
  X, 
  ChevronRight, 
  Sparkles,
  Send,
  RotateCcw,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { askAI } from './services/gemini';
import { CalculationHistory, Message } from './types';

const math = create(all);

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiMessages]);

  const handleNumber = (num: string) => {
    if (display === '0' || display === 'Error') {
      setDisplay(num);
    } else {
      setDisplay(display + num);
    }
  };

  const handleOperator = (op: string) => {
    if (display === 'Error') return;
    setExpression(expression + display + ' ' + op + ' ');
    setDisplay('0');
  };

  const handleFunction = (fn: string) => {
    if (display === 'Error') return;
    try {
      const val = display === '0' ? '' : display;
      const newExpr = `${fn}(${val})`;
      const result = math.evaluate(newExpr);
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
      
      const newHistory: CalculationHistory = {
        id: Date.now().toString(),
        expression: newExpr,
        result: formattedResult,
        timestamp: Date.now(),
      };
      
      setHistory([newHistory, ...history]);
      setDisplay(formattedResult);
      setExpression('');
    } catch (err) {
      setDisplay('Error');
    }
  };

  const calculate = () => {
    try {
      const fullExpr = expression + display;
      const result = math.evaluate(fullExpr);
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
      
      const newHistory: CalculationHistory = {
        id: Date.now().toString(),
        expression: fullExpr,
        result: formattedResult,
        timestamp: Date.now(),
      };
      
      setHistory([newHistory, ...history]);
      setDisplay(formattedResult);
      setExpression('');
    } catch (err) {
      setDisplay('Error');
    }
  };

  const clear = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim() || isAiLoading) return;

    const userMsg: Message = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const context = expression ? `Current expression: ${expression}${display}` : `Last result: ${display}`;
      const response = await askAI(aiInput, context);
      setAiMessages(prev => [...prev, { role: 'assistant', content: response || "I'm sorry, I couldn't process that." }]);
    } catch (error) {
      setAiMessages(prev => [...prev, { role: 'assistant', content: "Error connecting to AI assistant." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const buttons = [
    { label: 'sin', action: () => handleFunction('sin'), type: 'func' },
    { label: 'cos', action: () => handleFunction('cos'), type: 'func' },
    { label: 'tan', action: () => handleFunction('tan'), type: 'func' },
    { label: 'deg', action: () => {}, type: 'func', disabled: true },
    
    { label: 'log', action: () => handleFunction('log10'), type: 'func' },
    { label: 'ln', action: () => handleFunction('log'), type: 'func' },
    { label: '(', action: () => setDisplay(display + '('), type: 'func' },
    { label: ')', action: () => setDisplay(display + ')'), type: 'func' },

    { label: '√', action: () => handleFunction('sqrt'), type: 'func' },
    { label: '^', action: () => handleOperator('^'), type: 'op' },
    { label: 'π', action: () => setDisplay(math.pi.toString()), type: 'func' },
    { label: 'e', action: () => setDisplay(math.e.toString()), type: 'func' },

    { label: '7', action: () => handleNumber('7'), type: 'num' },
    { label: '8', action: () => handleNumber('8'), type: 'num' },
    { label: '9', action: () => handleNumber('9'), type: 'num' },
    { label: '÷', action: () => handleOperator('/'), type: 'op' },

    { label: '4', action: () => handleNumber('4'), type: 'num' },
    { label: '5', action: () => handleNumber('5'), type: 'num' },
    { label: '6', action: () => handleNumber('6'), type: 'num' },
    { label: '×', action: () => handleOperator('*'), type: 'op' },

    { label: '1', action: () => handleNumber('1'), type: 'num' },
    { label: '2', action: () => handleNumber('2'), type: 'num' },
    { label: '3', action: () => handleNumber('3'), type: 'num' },
    { label: '−', action: () => handleOperator('-'), type: 'op' },

    { label: '0', action: () => handleNumber('0'), type: 'num' },
    { label: '.', action: () => handleNumber('.'), type: 'num' },
    { label: '=', action: calculate, type: 'equals' },
    { label: '+', action: () => handleOperator('+'), type: 'op' },
  ];

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      <div className="max-w-6xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Header */}
        <header className="lg:col-span-12 flex items-center justify-between border-b border-[#141414] pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#141414] text-[#E4E3E0] rounded-lg">
              <CalculatorIcon size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight uppercase">AI Scientific</h1>
              <p className="text-[10px] font-mono opacity-50 uppercase tracking-widest">Advanced Computing System v2.0</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isHistoryOpen ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/10"
              )}
            >
              <History size={20} />
            </button>
            <button 
              onClick={() => setIsAIOpen(!isAIOpen)}
              className={cn(
                "p-2 rounded-full transition-colors",
                isAIOpen ? "bg-[#141414] text-[#E4E3E0]" : "hover:bg-[#141414]/10"
              )}
            >
              <Sparkles size={20} />
            </button>
          </div>
        </header>

        {/* Main Calculator Section */}
        <main className={cn(
          "lg:col-span-8 transition-all duration-500",
          isAIOpen ? "lg:col-span-7" : "lg:col-span-12"
        )}>
          <div className="bg-[#141414] rounded-2xl p-6 shadow-2xl border border-[#141414] overflow-hidden relative">
            {/* Display */}
            <div className="mb-8 text-right min-h-[120px] flex flex-col justify-end">
              <div className="text-[#E4E3E0]/40 font-mono text-sm mb-1 h-6 overflow-hidden whitespace-nowrap">
                {expression}
              </div>
              <div className="text-[#E4E3E0] font-mono text-5xl md:text-6xl font-light tracking-tighter break-all">
                {display}
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-4 gap-3">
              <button 
                onClick={clear}
                className="col-span-2 h-14 bg-[#FF4444] text-white rounded-xl font-bold uppercase tracking-widest hover:brightness-110 transition-all active:scale-95"
              >
                Clear
              </button>
              <button 
                onClick={backspace}
                className="h-14 bg-[#E4E3E0]/10 text-[#E4E3E0] rounded-xl flex items-center justify-center hover:bg-[#E4E3E0]/20 transition-all active:scale-95"
              >
                <RotateCcw size={20} />
              </button>
              <button 
                onClick={() => handleFunction('abs')}
                className="h-14 bg-[#E4E3E0]/10 text-[#E4E3E0] rounded-xl font-mono hover:bg-[#E4E3E0]/20 transition-all active:scale-95"
              >
                abs
              </button>

              {buttons.map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  disabled={btn.disabled}
                  className={cn(
                    "h-14 rounded-xl font-medium text-lg transition-all active:scale-95 flex items-center justify-center",
                    btn.type === 'num' && "bg-[#E4E3E0]/5 text-[#E4E3E0] hover:bg-[#E4E3E0]/15",
                    btn.type === 'op' && "bg-[#E4E3E0]/10 text-[#E4E3E0] hover:bg-[#E4E3E0]/20",
                    btn.type === 'func' && "bg-[#E4E3E0]/10 text-[#E4E3E0] hover:bg-[#E4E3E0]/20 font-mono text-sm italic",
                    btn.type === 'equals' && "bg-[#E4E3E0] text-[#141414] hover:brightness-90",
                    btn.disabled && "opacity-20 cursor-not-allowed"
                  )}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </main>

        {/* AI Assistant Panel */}
        <AnimatePresence>
          {isAIOpen && (
            <motion.aside 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-5 h-[600px] lg:h-auto flex flex-col bg-white rounded-2xl border border-[#141414]/10 shadow-xl overflow-hidden"
            >
              <div className="p-4 border-b border-[#141414]/10 flex items-center justify-between bg-[#141414] text-[#E4E3E0]">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} />
                  <span className="font-bold uppercase text-xs tracking-widest">AI Math Tutor</span>
                </div>
                <button onClick={() => setIsAIOpen(false)} className="hover:opacity-70">
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F9F9F8]">
                {aiMessages.length === 0 && (
                  <div className="text-center py-12 px-6">
                    <div className="w-12 h-12 bg-[#141414]/5 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Info className="text-[#141414]/30" size={24} />
                    </div>
                    <p className="text-sm text-[#141414]/50 italic">
                      Ask me to explain a concept, solve a word problem, or show steps for your current calculation.
                    </p>
                  </div>
                )}
                {aiMessages.map((msg, i) => (
                  <div key={i} className={cn(
                    "max-w-[85%] p-3 rounded-2xl text-sm",
                    msg.role === 'user' 
                      ? "bg-[#141414] text-[#E4E3E0] ml-auto rounded-tr-none" 
                      : "bg-white border border-[#141414]/10 text-[#141414] mr-auto rounded-tl-none shadow-sm"
                  )}>
                    {msg.content}
                  </div>
                ))}
                {isAiLoading && (
                  <div className="bg-white border border-[#141414]/10 text-[#141414] mr-auto rounded-2xl rounded-tl-none p-3 shadow-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-[#141414]/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={handleAiSubmit} className="p-4 border-t border-[#141414]/10 bg-white">
                <div className="relative">
                  <input 
                    type="text"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="Ask anything..."
                    className="w-full bg-[#F3F3F1] border-none rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-[#141414] transition-all"
                  />
                  <button 
                    type="submit"
                    disabled={!aiInput.trim() || isAiLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#141414] disabled:opacity-20"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* History Sidebar */}
        <AnimatePresence>
          {isHistoryOpen && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fixed inset-y-0 left-0 w-80 bg-white shadow-2xl z-50 border-r border-[#141414]/10 flex flex-col"
            >
              <div className="p-6 border-b border-[#141414]/10 flex items-center justify-between">
                <h2 className="font-bold uppercase tracking-widest text-sm">Calculation History</h2>
                <button onClick={() => setIsHistoryOpen(false)} className="hover:opacity-70">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-20 text-[#141414]/30 italic text-sm">
                    No calculations yet
                  </div>
                ) : (
                  history.map((item) => (
                    <div key={item.id} className="group p-4 rounded-xl bg-[#F9F9F8] border border-[#141414]/5 hover:border-[#141414]/20 transition-all">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] font-mono opacity-30">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => copyToClipboard(item.result)} className="text-[#141414]/40 hover:text-[#141414]">
                            <Copy size={14} />
                          </button>
                          <button onClick={() => setHistory(history.filter(h => h.id !== item.id))} className="text-[#FF4444]/40 hover:text-[#FF4444]">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs font-mono opacity-50 mb-1 truncate">{item.expression} =</div>
                      <div className="text-lg font-bold tracking-tight">{item.result}</div>
                      <button 
                        onClick={() => {
                          setDisplay(item.result);
                          setIsHistoryOpen(false);
                        }}
                        className="mt-2 text-[10px] uppercase font-bold tracking-widest text-[#141414]/40 hover:text-[#141414] flex items-center gap-1"
                      >
                        Use result <ChevronRight size={10} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {history.length > 0 && (
                <div className="p-4 border-t border-[#141414]/10">
                  <button 
                    onClick={() => setHistory([])}
                    className="w-full py-3 text-xs uppercase font-bold tracking-widest text-[#FF4444] hover:bg-[#FF4444]/5 rounded-xl transition-colors"
                  >
                    Clear All History
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
