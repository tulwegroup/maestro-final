'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  User, 
  Bot,
  Scale,
  FileText,
  Car,
  Building2,
  Shield,
  Plane,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  expertise?: string;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile?: any;
}

const EXPERTISE_AREAS = [
  { id: 'immigration', label: 'Immigration Expert', icon: Plane, description: 'Visa, residency, citizenship' },
  { id: 'pro', label: 'PRO Services', icon: FileText, description: 'Document processing, government services' },
  { id: 'legal', label: 'Legal Advisor', icon: Scale, description: 'UAE laws, contracts, disputes' },
  { id: 'rta', label: 'RTA Expert', icon: Car, description: 'Vehicles, fines, licensing' },
  { id: 'banking', label: 'Banking Advisor', icon: Building2, description: 'Accounts, loans, transfers' },
  { id: 'compliance', label: 'Compliance Officer', icon: Shield, description: 'Regulations, KYC, AML' },
];

const QUICK_QUESTIONS = [
  "What documents do I need for visa renewal?",
  "How do I check for travel bans?",
  "What are the RTA fine discounts?",
  "How to start a business in UAE?",
  "Explain UAE labor law notice period",
  "How to apply for Emirates ID?",
];

// Generate a unique session ID
function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

export function AIAssistant({ isOpen, onClose, userProfile }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(generateSessionId);
  const [aiStatus, setAiStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check AI service status
  const checkAiStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/ai-chat');
      const data = await res.json();
      setAiStatus(data.success ? 'online' : 'offline');
    } catch {
      setAiStatus('offline');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkAiStatus();
      if (messages.length === 0) {
        // Initial greeting
        const greeting: Message = {
          id: '1',
          role: 'assistant',
          content: `**Assalamu Alaikum! 👋**

I'm MAESTRO AI, your personal expert for all UAE government and life services. I'm powered by advanced AI to provide accurate, helpful guidance.

**I specialize in:**
- 🛂 Immigration & Visa matters
- 📄 PRO & Document services
- ⚖️ Legal advice (UAE laws)
- 🚗 RTA & Vehicle services
- 🏦 Banking & Finance
- ✅ Compliance & Regulations

**Quick actions I can help with:**
• Check your visa renewal requirements
• Explain travel ban procedures
• Guide you through RTA services
• Answer labor law questions
• Business setup guidance

**How can I assist you today?**`,
          timestamp: new Date()
        };
        setMessages([greeting]);
      }
    }
  }, [isOpen, messages.length, checkAiStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message: input,
          userProfile: {
            fullNameEnglish: userProfile?.fullNameEnglish,
            mobile: userProfile?.mobile,
            uaePassConnected: userProfile?.uaePassConnected,
            aaniLinked: userProfile?.aaniLinked,
            visaExpiry: userProfile?.visaExpiry,
            licenseExpiry: userProfile?.licenseExpiry,
            vehicleExpiry: userProfile?.vehicleExpiry,
            walletBalance: userProfile?.walletBalance,
          }
        })
      });

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        expertise: data.expertise
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      // Add fallback message
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I apologize, but I'm having trouble connecting to my AI backend. Please try again or contact support if the issue persists.\n\n**Error:** ${err instanceof Error ? err.message : 'Unknown error'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const clearConversation = async () => {
    setMessages([]);
    try {
      await fetch(`/api/ai-chat?sessionId=${sessionId}`, { method: 'DELETE' });
    } catch {
      // Ignore errors
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-600" />
            MAESTRO AI - Your UAE Expert
            <Badge className={aiStatus === 'online' ? 'bg-green-100 text-green-700' : aiStatus === 'offline' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}>
              {aiStatus === 'online' ? 'AI Online' : aiStatus === 'offline' ? 'Offline' : 'Checking...'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Expertise Areas */}
        <div className="flex flex-wrap gap-2 py-2 border-b">
          {EXPERTISE_AREAS.map(area => (
            <Badge 
              key={area.id}
              variant="outline" 
              className="cursor-pointer hover:bg-teal-50"
              onClick={() => setInput(`I need help with ${area.label.toLowerCase()} services`)}
            >
              <area.icon className="w-3 h-3 mr-1" />
              {area.label}
            </Badge>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-slate-50 rounded-lg">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <Card className={`max-w-[80%] p-3 ${
                message.role === 'user' 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-white border-slate-200'
              }`}>
                {message.expertise && (
                  <div className="flex items-center gap-1 mb-2 pb-2 border-b border-slate-100">
                    <Badge variant="outline" className="text-xs">
                      {EXPERTISE_AREAS.find(e => e.id === message.expertise)?.label || 'Expert'}
                    </Badge>
                  </div>
                )}
                <div className={`prose prose-sm ${message.role === 'user' ? 'prose-invert' : ''}`}>
                  <div className="whitespace-pre-wrap text-sm" dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }} />
                </div>
                <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-teal-100' : 'text-slate-400'}`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </Card>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <Card className="p-3 bg-white">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                  <span className="text-sm text-slate-500">Thinking...</span>
                </div>
              </Card>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="flex flex-wrap gap-2 py-2 border-t">
          {QUICK_QUESTIONS.slice(0, 3).map((q, i) => (
            <Button
              key={i}
              variant="ghost"
              size="sm"
              className="text-xs text-slate-600"
              onClick={() => handleQuickQuestion(q)}
            >
              {q}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-500 ml-auto"
            onClick={clearConversation}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>

        {/* Input */}
        <div className="flex gap-2 pt-2 border-t">
          <Input
            placeholder="Ask me anything about UAE services..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1"
            disabled={isLoading || aiStatus === 'offline'}
          />
          <Button 
            onClick={handleSend} 
            disabled={!input.trim() || isLoading || aiStatus === 'offline'} 
            className="bg-teal-600 hover:bg-teal-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Status indicator */}
        {aiStatus === 'offline' && (
          <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-xs">
            <AlertCircle className="w-3 h-3" />
            AI service is currently offline. Using fallback responses.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
