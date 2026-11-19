import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatWindow } from '../../src/features/chat/components/ChatWindow.jsx';
import { sendQuery } from '../../src/api/v1/chat.api.js';

vi.mock('../../src/api/v1/chat.api.js', () => ({ sendQuery: vi.fn() }));

function response(headline, followUps = []) {
  return {
    status: 'success',
    answer: {
      headline,
      detail: '',
      columns: [],
      rows: [],
      row_count: 0,
      truncated: false,
    },
    follow_ups: followUps,
    meta: { latency_ms: 200 },
  };
}

function renderChat() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ChatWindow
          conversation={{
            id: 'conversation-1',
            conversationId: 'session-1',
            title: 'New chat',
            messages: [],
          }}
          onConversationUpdate={vi.fn()}
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ChatWindow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends the question selected from a follow-up chip', async () => {
    sendQuery.mockResolvedValueOnce(response('Sales total', ['Show sales by region']))
      .mockResolvedValueOnce(response('Sales by region'));
    renderChat();

    fireEvent.change(screen.getByLabelText('Ask a question about your company data'), {
      target: { value: 'What are total sales?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send question' }));
    await screen.findByText('Sales total');
    fireEvent.click(screen.getByRole('button', { name: 'Show sales by region' }));

    await screen.findByText('Sales by region');
    expect(sendQuery).toHaveBeenNthCalledWith(2, expect.objectContaining({
      question: 'Show sales by region',
    }));
  });
});
