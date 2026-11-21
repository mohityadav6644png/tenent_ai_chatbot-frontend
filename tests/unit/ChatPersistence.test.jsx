import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import React, { useState } from 'react';
import { AuthContext } from '../../src/features/auth/AuthContext.jsx';
import { useConversations } from '../../src/features/chat/hooks/useConversations.js';

function createWrapper(initialUser) {
  return function Wrapper({ children }) {
    const [user, setUser] = useState(initialUser);
    const value = {
      user,
      isAuthenticated: Boolean(user),
      setUser,
      logout: async () => setUser(null),
    };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  };
}

describe('Chat Persistence and User Isolation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists conversations for the logged in user to localStorage', () => {
    const userA = { id: 'user-a', name: 'Alice', email: 'alice@example.com' };
    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(userA),
    });

    const activeConv = result.current.currentConversation;
    expect(activeConv).toBeDefined();

    act(() => {
      result.current.updateConversation(activeConv.id, {
        title: 'Monthly Revenue',
        messages: [
          { kind: 'user', content: 'What is monthly revenue?' },
          { kind: 'answer', answer: { headline: '$50,000' } },
        ],
      });
    });

    const storedRaw = localStorage.getItem('company_chatbot_conversations_user-a');
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw);
    expect(stored[0].title).toBe('Monthly Revenue');
    expect(stored[0].messages).toHaveLength(2);
    expect(stored[0].messages[0].content).toBe('What is monthly revenue?');
  });

  it('resets in-memory conversation when user logs out so previous chat is not visible', () => {
    let authContextRef;
    const userA = { id: 'user-a', name: 'Alice', email: 'alice@example.com' };

    function TestWrapper({ children }) {
      const [user, setUser] = useState(userA);
      authContextRef = { user, setUser };
      return (
        <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user) }}>
          {children}
        </AuthContext.Provider>
      );
    }

    const { result } = renderHook(() => useConversations(), { wrapper: TestWrapper });

    act(() => {
      result.current.updateConversation(result.current.currentConversation.id, {
        title: 'Private Q3 Earnings',
        messages: [{ kind: 'user', content: 'Show Q3 earnings' }],
      });
    });

    expect(result.current.currentConversation.title).toBe('Private Q3 Earnings');

    // Simulate logout (user set to null)
    act(() => {
      authContextRef.setUser(null);
    });

    // In-memory conversation must be reset to a fresh chat, not showing previous user's chat
    expect(result.current.currentConversation.title).toBe('New chat');
    expect(result.current.currentConversation.messages).toEqual([]);
  });

  it('isolates chats between different users', () => {
    // User A has saved chat
    localStorage.setItem(
      'company_chatbot_conversations_user-a',
      JSON.stringify([
        {
          id: 'conv-a',
          title: "Alice's Secret Chat",
          messages: [{ kind: 'user', content: 'Secret info' }],
          updatedAt: Date.now(),
        },
      ]),
    );

    const userB = { id: 'user-b', name: 'Bob', email: 'bob@example.com' };
    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(userB),
    });

    // User B should NOT see User A's chat
    expect(result.current.currentConversation.title).toBe('New chat');
    expect(result.current.conversations.find((c) => c.title === "Alice's Secret Chat")).toBeUndefined();
  });

  it('restores previous conversations when user logs back in', () => {
    localStorage.setItem(
      'company_chatbot_conversations_user-a',
      JSON.stringify([
        {
          id: 'conv-a1',
          title: 'Restored Discussion',
          messages: [{ kind: 'user', content: 'Restored question' }],
          updatedAt: 12345,
        },
      ]),
    );

    const userA = { id: 'user-a', name: 'Alice', email: 'alice@example.com' };
    const { result } = renderHook(() => useConversations(), {
      wrapper: createWrapper(userA),
    });

    expect(result.current.conversations).toHaveLength(1);
    expect(result.current.currentConversation.title).toBe('Restored Discussion');
    expect(result.current.currentConversation.messages[0].content).toBe('Restored question');
  });
});
