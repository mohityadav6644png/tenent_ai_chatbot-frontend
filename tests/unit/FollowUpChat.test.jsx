import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React, { useState } from 'react';
import { ChatWindow } from '../../src/features/chat/components/ChatWindow.jsx';
import { ChatPage } from '../../src/features/chat/pages/ChatPage.jsx';
import { AuthContext } from '../../src/features/auth/AuthContext.jsx';
import { sendQuery } from '../../src/api/v1/chat.api.js';

vi.mock('../../src/api/v1/chat.api.js', () => ({ sendQuery: vi.fn() }));

function createMockResponse(headline, conversationId, interpretedQuestion = null) {
  return {
    status: 'success',
    conversation_id: conversationId,
    answer: {
      headline,
      detail: '',
      columns: [{ name: 'Col1', type: 'string' }],
      rows: [['Val1']],
      row_count: 1,
      truncated: false,
    },
    follow_ups: [],
    meta: {
      latency_ms: 120,
      conversation_id: conversationId,
      interpreted_question: interpretedQuestion,
    },
  };
}

describe('Follow-up and Conversation ID Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('omits conversation_id on the first turn, receives one, and sends it on subsequent turns', async () => {
    sendQuery
      .mockResolvedValueOnce(createMockResponse('Turn 1 result', 'server-conv-123'))
      .mockResolvedValueOnce(createMockResponse('Turn 2 result', 'server-conv-123', 'Rewritten question'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const onConversationUpdate = vi.fn();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ChatWindow
            conversation={{
              id: 'local-conv-1',
              conversationId: null,
              title: 'New chat',
              messages: [],
            }}
            onConversationUpdate={onConversationUpdate}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    // Turn 1
    const input = screen.getByLabelText('Ask a question about your company data');
    const sendBtn = screen.getByRole('button', { name: 'Send question' });

    fireEvent.change(input, { target: { value: 'How many students in each class?' } });
    fireEvent.click(sendBtn);

    await screen.findByText('Turn 1 result');

    // Turn 1 should NOT have sent conversation_id
    expect(sendQuery).toHaveBeenNthCalledWith(1, expect.objectContaining({
      question: 'How many students in each class?',
    }));
    expect(sendQuery.mock.calls[0][0].conversationId).toBeFalsy();

    // Turn 2
    fireEvent.change(input, { target: { value: 'Only for Class 8' } });
    fireEvent.click(sendBtn);

    await screen.findByText('Turn 2 result');

    // Turn 2 MUST send the conversation_id returned by turn 1
    expect(sendQuery).toHaveBeenNthCalledWith(2, expect.objectContaining({
      question: 'Only for Class 8',
      conversationId: 'server-conv-123',
    }));

    // Check that interpreted_question is rendered
    expect(screen.getByText('Understood as: Rewritten question')).toBeInTheDocument();
  });

  it('opening a past conversation continues with its saved conversation_id', async () => {
    sendQuery.mockResolvedValueOnce(createMockResponse('Turn follow-up result', 'past-conv-999'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ChatWindow
            conversation={{
              id: 'local-conv-past',
              conversationId: 'past-conv-999',
              title: 'Past Chat',
              messages: [
                { id: 'user-msg-1', kind: 'user', content: 'What is our revenue?' },
                {
                  id: 'answer-msg-1',
                  kind: 'answer',
                  answer: {
                    status: 'success',
                    summary: 'Revenue is 100k',
                    table: { columns: [], rows: [] },
                    footer: { rowCount: 0, latencyMs: 50 },
                  },
                },
              ],
            }}
            onConversationUpdate={vi.fn()}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    const input = screen.getByLabelText('Ask a question about your company data');
    const sendBtn = screen.getByRole('button', { name: 'Send question' });

    fireEvent.change(input, { target: { value: 'And for last quarter?' } });
    fireEvent.click(sendBtn);

    await screen.findByText('Turn follow-up result');

    expect(sendQuery).toHaveBeenCalledWith(expect.objectContaining({
      question: 'And for last quarter?',
      conversationId: 'past-conv-999',
    }));
  });

  it('clicking New chat starts a fresh conversation without the previous conversation id', async () => {
    // Seed localStorage with an existing conversation that has a conversationId
    const user = { id: 'test-user-1', name: 'Tester', email: 'test@example.com' };
    localStorage.setItem(
      'company_chatbot_conversations_test-user-1',
      JSON.stringify([
        {
          id: 'old-chat-id',
          conversationId: 'old-server-conv-id',
          title: 'Old Conversation',
          messages: [{ id: 'old-msg-1', kind: 'user', content: 'Old question' }],
          updatedAt: Date.now() - 1000,
        },
      ]),
    );

    sendQuery.mockResolvedValueOnce(createMockResponse('Fresh answer', 'new-server-conv-id'));

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <AuthContext.Provider value={{ user, isAuthenticated: true }}>
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <ChatPage />
          </MemoryRouter>
        </QueryClientProvider>
      </AuthContext.Provider>,
    );

    // Click "New chat" button
    const newChatBtn = screen.getByRole('button', { name: 'New chat' });
    fireEvent.click(newChatBtn);

    // Send a message in the new chat
    const input = screen.getByLabelText('Ask a question about your company data');
    const sendBtn = screen.getByRole('button', { name: 'Send question' });

    fireEvent.change(input, { target: { value: 'Brand new question' } });
    fireEvent.click(sendBtn);

    await screen.findByText('Fresh answer');

    // The new conversation must NOT send old-server-conv-id
    expect(sendQuery).toHaveBeenCalledWith(expect.objectContaining({
      question: 'Brand new question',
    }));
    expect(sendQuery.mock.calls[0][0].conversationId).toBeFalsy();
  });
});
