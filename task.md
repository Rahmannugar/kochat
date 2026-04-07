Next.js Developer Test Project - Kochanet 
Introduction 
Welcome to Kochanet’s Next.js developer test project. 
This task evaluates how you approach real-world frontend engineering challenges. We’re interested in your architectural decisions, how you handle ambiguity, and how you balance tradeoffs when building production systems. 
We don’t expect perfection. We value thoughtful engineering, clear reasoning, and honest communication about what works and what doesn’t. 
Objective 
Build a collaborative chat application with an on-demand AI assistant using Next.js. 
The system should enable real-time human-to-human conversations with a polished UI, featuring an AI assistant that can be invoked to help answer questions, provide suggestions, or offer expertise when needed. 
App Context 
Think of this as building a team workspace application where: 
• Team members chat with each other in real-time 
• An AI assistant “listens” to conversations 
• Users can summon the AI (via @mention or similar) when they need help • The AI understands conversation context and provides relevant assistance 
Example conversation flow: 
Alice: “Hey Bob, the deployment failed again” 
Bob: “Same error as yesterday?” 
Alice: “Yeah, something about Docker networking” 
1
Alice: “@ai what causes Docker containers to lose network connectivity after restart?” 
AI: “Common causes include: 1) Custom bridge networks not persisting across restarts...” 
Bob: “Oh we did create a custom network. Let me check the compose file” 
The AI is a helpful team member that joins when called, not a chatbot that requires every interaction to go through it. 
Timeline 
You have 3 days from receiving this test. 
Aim for 15–20 hours of work. If you’re running out of time, prioritize core functionality and clearly document what you would do differently with more time. 

💡 So your app should support:
🟢 A. Default rooms
Everyone starts somewhere
🟢 B. Direct messages (DMs)
User → user
🟢 C. Group chats
Multiple users
🧱 Real Flow (What actually happens)
New user signs up:
Account created
Automatically:
Add to "General" chat
Redirect to dashboard
User wants to talk to someone:

Option 1:

Click "New Chat"
Select user

Option 2:

Click user name (from anywhere)
User wants a group:
Click "New Room"
Add users
Start chatting
⚠️ What NOT to do

❌ Don’t just show:

“Here’s 500 users… pick one”

That’s:

overwhelming
unrealistic
bad UX
🧠 Think like this instead:

“How do I reduce friction to start chatting?”

Answer:

Put users into conversations immediately
Make starting new ones 1 click away

Requirements 
1. Core Technology 
Required stack: 
• Next.js (App Router) with TypeScript 
• Firebase or Supabase for backend services (your choice — justify it) • BetterAuth for authentication 
• Gemini API for AI functionality 
• A UI component library or design system of your choice 
You may use additional libraries and services as needed. Document your choices and reasoning in your README. 
2. Feature Requirements 
Authentication & Authorization 
Implement a secure authentication system using BetterAuth. Users should be able to sign in and access protected resources. Consider how you’ll handle session management, route protection, and what security measures are appropriate for a production system. 
Support at least one social authentication provider in addition to email/password. Real-Time Chat Interface 
2

Build a real-time chat interface where users can communicate with each other. This is the foundation — get this right before worrying about AI. 
Core real-time features: 
• Messages appear instantly for all participants in a chat 
• Typing indicators — show when someone is composing a message • Presence system — indicate who is currently online/active in the chat • Handle multiple simultaneous users gracefully 
• Responsive design that works on desktop and mobile 
You’ll need to make architectural decisions about: 
• How to implement real-time communication (Supabase Realtime, Firebase Realtime DB / Firestore listeners, WebSockets, etc.) 
• Client-side state management for chat data 
• Optimistic updates vs. server-confirmed updates 
• Handling disconnections and reconnections gracefully in the UI • Synchronizing state when a user joins mid-conversation 
AI Assistant Integration 
This is where it gets interesting. Integrate an AI assistant that: 
• Can be invoked by users during conversations (design the invocation mechanism) 
• Understands the conversation context (not just the message that mentioned it) 
• Responds in the chat like another participant 
• Shows its responses streaming in real-time (typing effect) 
• Maintains awareness across the conversation thread 
Key design questions to solve: 
• How does the AI know when to respond? (@mentions? Keywords? Commands?) 
• How much conversation history should the AI see? 
• What happens if multiple users invoke the AI simultaneously? • How do you manage the AI’s context window as conversations grow? 
• How should the AI’s responses be visually distinguished from human messages? 
• How do you handle the AI “typing” state while generating a response? 3

The AI’s personality/behavior is up to you — just make it helpful and appropriate for a professional team workspace. 
Chat Management 
Users should be able to: 
• Create new chat rooms/channels 
• Invite other users to join their chats 
• View their chat history with infinite scroll or pagination 
• Return to previous conversations (with full message history) 
• Search through messages 
Consider: How do permissions work? Can anyone join any chat? Should there be private/public chats? How does the sidebar/navigation work? 
Voice Features 
Support voice input and output: 
• Users can send voice messages (converted to text via speech-to-text) • AI responses can be played back as audio (text-to-speech) 
You may use Gemini speech services or the Web Speech API. Think about how voice messages integrate into the chat experience — do they show a waveform? An inline player? A transcript alongside the audio? 
UI/UX Quality 
This is a frontend test, so the quality of the interface matters. We’re looking for: 
• Clean, intuitive layout and navigation 
• Thoughtful loading states, empty states, and error states 
• Smooth animations and transitions where appropriate 
• Accessibility considerations (keyboard navigation, screen reader support, contrast) 
• Responsive design — the app should work well on mobile 
You don’t need a designer’s eye, but the app should feel polished and intentional, not like a raw prototype. 
Data Persistence 
All conversations and messages must be persisted (via Firebase or Supabase). Consider: 
• What data model makes sense for messages, chats, and participants? 4
• How do you efficiently load chat history when users reconnect? 
• How do you distinguish between human and AI messages in the UI and in storage? 
• How do you handle offline states and data syncing? 
3. Engineering Expectations 
We care deeply about how you approach these challenges: 
Architecture & Design 
• Clear separation of concerns (components, hooks, server actions, utilities) 
• Thoughtful use of Next.js patterns (App Router, Server Components, Server Actions, middleware) 
• Effective client-side state management 
• Appropriate abstraction levels — not over-engineered, not under-engineered 
Real-Time Performance 
• Efficient handling of real-time updates without unnecessary re-renders • Low latency for typing indicators and presence updates 
• Graceful handling of connection failures in the UI 
• Proper state synchronization 
Security & Data Integrity 
• Proper authentication and authorization checks (both client and server-side) • Secure handling of credentials and tokens 
• Input validation and sanitization 
• Users can only access chats they’re authorized for 
• Protected API routes and Server Actions 
Error Handling 
Handle failures gracefully in the UI. Consider scenarios like: 
• Gemini API failures or timeouts 
• Network disconnections during active chats 
• Database/BaaS connection issues 
• Invalid user inputs or malformed messages 
• Race conditions (two users sending messages simultaneously) • Stale data and conflict resolution 
4. Bonus Points (Optional) 
These aren’t required but demonstrate stronger engineering: 
5

• Streaming AI responses (show the response token-by-token as it’s generated) 
• Smart context management (e.g., summarizing old messages when context gets too long) 
• Read receipts or message delivery confirmations 
• Rate limiting or usage quotas on AI invocations 
• Multiple social auth providers 
• Advanced chat features (edit messages, reactions, threads, reply-to) • Dark mode / theme switching 
• Keyboard shortcuts for power users 
• Message search with highlighting 
• File/image sharing in chat 
• AI can reference specific earlier messages (“as I mentioned 5 minutes ago...”) • PWA support or push notifications 
5. Testing & Documentation 
Deployed Instance 
Deploy your application to a publicly accessible URL (Vercel, Netlify, or similar). We should be able to test the full system without local setup. 
Documentation 
Provide clear documentation for your application. Ensure we can understand: 
• Application architecture and how modules are organized 
• How authentication flows work 
• How real-time features are implemented 
• How to invoke the AI assistant 
• Any environment variables or external services required 
Test Credentials & Demo Instructions 
Provide: 
• At least 2 test user accounts (so we can test multi-user features) 
• Instructions on how to see real-time features in action (e.g., open two browser tabs) 
• Example commands/messages to invoke the AI 
Submission Requirements 
Submit via: https://airtable.com/app6yvIltizp9X6XC/shrtpgZYOMJGg4wWy 6

1. Repository 
Public GitHub repository with complete source code. 
2. Live Demo 
Deployed application with: 
• Application URL 
• Test credentials (minimum 2 users) 
• Instructions for testing real-time and AI features 
3. Video Walkthrough (5–10 minutes, camera on) 
Record a video where you: 
• Demonstrate the working system (show real-time chat, typing indicators, AI invocation) 
• Walk through your project structure and key architectural decisions • Explain how you implemented the real-time features 
• Discuss how the AI integration works 
• Explain major tradeoffs and design decisions 
• Share challenges you faced and how you solved them 
• Discuss what you’d improve with more time 
4. README 
Your README should include: 
• Architecture overview (high-level design decisions) 
• Technology choices and justification (especially Firebase vs. Supabase decision) 
• How you implemented real-time communication 
• How the AI invocation and context management works 
• Component structure and state management approach 
• Assumptions you made 
• Known limitations or trade-offs 
• What you would do differently with more time 
• Setup instructions (if we want to run locally) 
Evaluation Criteria 
We’ll evaluate your submission based on: 
Technical Execution (40%) 
7
• Does the system work as specified? 
• Quality and reliability of real-time features 
• AI integration — does it understand context appropriately? 
• Handling of edge cases and error scenarios 
• Security implementation 
UI/UX & Frontend Quality (20%) 
• Visual polish and attention to detail 
• Responsive design and accessibility 
• Loading, empty, and error states 
• Performance (no unnecessary re-renders, efficient data fetching) 
Code Quality & Architecture (20%) 
• Overall architecture and system design 
• Code organization and maintainability 
• Appropriate use of TypeScript and Next.js patterns 
• Component design and reusability 
• Data modeling decisions 
Engineering Judgment (10%) 
• How you handled ambiguous requirements 
• Tradeoffs you made and why 
• Technology and architecture choices 
• Scope management (what you prioritized vs. left out) 
• Understanding of scalability and performance considerations 
Communication (10%) 
• Quality and clarity of documentation 
• Video walkthrough — how well you explain your work 
• README — clarity of your reasoning and decision-making 
Important Notes 
On Ambiguity: Some requirements are intentionally open-ended. We want to see how you handle uncertainty, make assumptions, and justify your decisions. There isn’t always a “correct” answer — your reasoning matters more than finding some perfect solution. 
On Scope: If you’re running out of time, prioritize a smaller set of well-implemented features over a larger set of half-working ones. Be strategic about what you build and transparent about what you didn’t get to. 
8
On Perfection: We don’t expect production-ready code in 3 days. We’re looking for solid engineering instincts, clear thinking, and the ability to make smart pragmatic decisions under constraints. 
On AI Tools: You’re welcome to use AI coding assistants, but remember: we’re evaluating YOUR engineering judgment, not the AI’s. Make sure you understand the code thoroughly and can explain every decision in your video walkthrough. 
Good luck! We’re looking forward to seeing what you build. 

9


import localFont from "next/font/local";

export const aeonik = localFont({
  variable: "--font-aeonik",
  src: [
    {
      path: "../../public/fonts/AeonikTRIAL-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/AeonikTRIAL-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  display: "swap",
});
