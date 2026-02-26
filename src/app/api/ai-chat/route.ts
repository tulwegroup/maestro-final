import { NextRequest, NextResponse } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

// System prompt for UAE Expert Assistant
const UAE_EXPERT_SYSTEM_PROMPT = `You are MAESTRO AI, an expert assistant for UAE residents. You have deep knowledge in multiple domains:

## Your Expertise Areas:

### 🛂 Immigration Expert
- Visa types, renewal processes, requirements
- Emirates ID applications and renewals
- Passport services, entry permits
- Residency changes, visa cancellations
- Golden Visa, Green Visa programs
- Family sponsorship rules

### 📄 PRO Services (Public Relations Officer)
- Document attestation and legalization
- Trade license applications
- Company formation procedures
- Labor contracts and MOHRE services
- Document translation requirements
- Government portal navigation

### ⚖️ Legal Advisor
- UAE labor law (Federal Decree-Law No. 33 of 2021)
- Employment contracts and termination
- End-of-service gratuity calculations
- Travel ban procedures and resolution
- Civil and criminal case procedures
- Family law matters

### 🚗 RTA Expert
- Vehicle registration and renewal
- Driving license services
- Traffic fines and black points
- Salik and toll gates
- Vehicle testing requirements
- Number plate services

### 🏦 Banking Advisor
- Account opening procedures
- AANI instant payment system
- Personal and auto loans
- Credit card comparisons
- International transfers
- Crypto regulations in UAE

### ✅ Compliance Officer
- KYC requirements
- AML regulations
- Free zone vs mainland requirements
- Business licensing compliance
- Tax regulations (VAT, Corporate Tax)

## Guidelines:
1. Always provide accurate, up-to-date information based on UAE laws and regulations
2. Be helpful, professional, and culturally sensitive
3. When unsure, acknowledge limitations and suggest official sources
4. Provide specific steps, fees, and timelines when applicable
5. Format responses with clear sections and bullet points for readability
6. Include relevant government portal links when helpful
7. Consider the user's context and tailor advice accordingly

## Important Contacts to Reference:
- Dubai Government: 800 60 60
- Abu Dhabi Government: 800 555
- RTA: 800 9090
- Police Emergency: 999
- MOHRE: 800 66473

Always maintain a helpful, professional tone while being efficient with responses.`;

// Store conversations in memory (use Redis/database in production)
const conversations = new Map<string, { role: string; content: string }[]>();

// Initialize ZAI instance
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, message, userProfile, clearHistory } = body;

    if (!message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Message is required' 
      }, { status: 400 });
    }

    const zai = await getZAI();

    // Build context with user profile if available
    let contextPrompt = UAE_EXPERT_SYSTEM_PROMPT;
    if (userProfile) {
      contextPrompt += `\n\n## User Context:
- Name: ${userProfile.fullNameEnglish || 'Not provided'}
- Mobile: ${userProfile.mobile || 'Not provided'}
- UAE Pass Connected: ${userProfile.uaePassConnected ? 'Yes' : 'No'}
- AANI Linked: ${userProfile.aaniLinked ? 'Yes' : 'No'}
${userProfile.visaExpiry ? `- Visa Expiry: ${new Date(userProfile.visaExpiry).toLocaleDateString()}` : ''}
${userProfile.licenseExpiry ? `- License Expiry: ${new Date(userProfile.licenseExpiry).toLocaleDateString()}` : ''}
${userProfile.vehicleExpiry ? `- Vehicle Registration Expiry: ${new Date(userProfile.vehicleExpiry).toLocaleDateString()}` : ''}
- Wallet Balance: AED ${userProfile.walletBalance?.toLocaleString() || 0}`;
    }

    // Get or create conversation history
    let history = conversations.get(sessionId) || [];
    
    // Clear history if requested
    if (clearHistory) {
      history = [];
    }

    // Build messages array
    const messages: { role: 'assistant' | 'user'; content: string }[] = [
      { role: 'assistant', content: contextPrompt },
      ...history.slice(-10), // Keep last 10 messages for context
      { role: 'user', content: message }
    ];

    // Get completion from LLM
    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' }
    });

    const aiResponse = completion.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('Empty response from AI');
    }

    // Update conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: aiResponse });
    conversations.set(sessionId, history);

    // Detect expertise area based on response
    const expertise = detectExpertise(message);

    return NextResponse.json({
      success: true,
      response: aiResponse,
      expertise,
      messageCount: history.length / 2, // User + Assistant pairs
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process request',
    }, { status: 500 });
  }
}

// Detect expertise area from message
function detectExpertise(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('visa') || lowerMessage.includes('passport') || 
      lowerMessage.includes('immigration') || lowerMessage.includes('residency') ||
      lowerMessage.includes('emirates id') || lowerMessage.includes('golden visa')) {
    return 'immigration';
  }
  
  if (lowerMessage.includes('rta') || lowerMessage.includes('vehicle') || 
      lowerMessage.includes('driving') || lowerMessage.includes('fine') ||
      lowerMessage.includes('license') || lowerMessage.includes('salik')) {
    return 'rta';
  }
  
  if (lowerMessage.includes('court') || lowerMessage.includes('legal') || 
      lowerMessage.includes('labor') || lowerMessage.includes('contract') ||
      lowerMessage.includes('travel ban') || lowerMessage.includes('dispute')) {
    return 'legal';
  }
  
  if (lowerMessage.includes('bank') || lowerMessage.includes('loan') || 
      lowerMessage.includes('transfer') || lowerMessage.includes('aani') ||
      lowerMessage.includes('account') || lowerMessage.includes('credit')) {
    return 'banking';
  }
  
  if (lowerMessage.includes('business') || lowerMessage.includes('company') || 
      lowerMessage.includes('license') || lowerMessage.includes('trade') ||
      lowerMessage.includes('pro') || lowerMessage.includes('attestation')) {
    return 'pro';
  }
  
  if (lowerMessage.includes('compliance') || lowerMessage.includes('kyc') || 
      lowerMessage.includes('aml') || lowerMessage.includes('tax') ||
      lowerMessage.includes('vat')) {
    return 'compliance';
  }
  
  return 'general';
}

// GET endpoint to check AI service status
export async function GET() {
  try {
    const zai = await getZAI();
    
    // Simple test completion
    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are a helpful assistant. Respond with only "OK".' },
        { role: 'user', content: 'Status check' }
      ],
      thinking: { type: 'disabled' }
    });

    return NextResponse.json({
      success: true,
      status: 'online',
      model: 'MAESTRO AI',
      expertise: [
        'Immigration Expert',
        'PRO Services',
        'Legal Advisor',
        'RTA Expert',
        'Banking Advisor',
        'Compliance Officer'
      ],
      activeConversations: conversations.size,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error instanceof Error ? error.message : 'AI service unavailable',
    }, { status: 503 });
  }
}

// DELETE endpoint to clear conversation history
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  
  if (sessionId) {
    conversations.delete(sessionId);
  }
  
  return NextResponse.json({
    success: true,
    message: 'Conversation cleared',
  });
}
