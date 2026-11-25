import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnswerMessage } from '../../src/features/chat/components/AnswerMessage.jsx';
import { toCsv } from '../../src/features/chat/services/chat.service.js';

const answer = {
  status: 'success',
  headline: 'Revenue by region',
  detail: 'North led the month.',
  columns: [
    { name: 'Region', type: 'string' },
    { name: 'Revenue', type: 'number' },
  ],
  rows: [['North', 12345], ['South', 9200]],
  rowCount: 2,
  truncated: false,
  latencyMs: 1600,
  followUps: [],
};

describe('AnswerMessage', () => {
  function renderAnswer() {
    const queryClient = new QueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <AnswerMessage answer={answer} messageId="answer-1" />
      </QueryClientProvider>,
    );
  }

  it('renders headline, detail, every row, and footer details', () => {
    renderAnswer();

    expect(screen.getByText('Revenue by region')).toBeInTheDocument();
    expect(screen.getByText('North led the month.')).toBeInTheDocument();
    expect(screen.getByText('North')).toBeInTheDocument();
    expect(screen.getByText('South')).toBeInTheDocument();
    expect(screen.getByText('2 rows · answered in 1.6 s')).toBeInTheDocument();
  });

  it('formats and right-aligns numeric values', () => {
    renderAnswer();
    const cell = screen.getByText('12,345');

    expect(cell.tagName).toBe('TD');
    expect(cell).toHaveClass('result-table__numeric');
    expect(within(cell.closest('tr')).getByText('North')).toBeInTheDocument();
  });

  it('renders interpreted_question line when present with correct styling', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnswerMessage
          answer={{
            ...answer,
            interpretedQuestion: 'What are total sales by region in North for 2025?',
          }}
          messageId="answer-interpreted-1"
        />
      </QueryClientProvider>,
    );

    const line = screen.getByText('Understood as: What are total sales by region in North for 2025?');
    expect(line).toBeInTheDocument();
    expect(line).toHaveClass('answer-interpreted');
    expect(line).toHaveStyle({ fontSize: '12px', color: '#5B6472' });
  });

  it('does not render interpreted_question line when omitted', () => {
    renderAnswer();
    expect(screen.queryByText(/^Understood as:/)).not.toBeInTheDocument();
  });

  it('CSV-escapes formula-leading cells', () => {
    expect(toCsv([{ name: 'Value' }], [['=1+1'], ['+cmd'], ['-1'], ['@name']])).toBe(
      '"Value"\r\n"\'=1+1"\r\n"\'+cmd"\r\n"\'-1"\r\n"\'@name"',
    );
  });

  it('renders profile prompt with 44px skip button and 12px #5B6472 text', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnswerMessage
          answer={{
            ...answer,
            profilePrompt: {
              field: 'name',
              text: 'By the way, what should I call you? (optional)',
              skippable: true,
            },
          }}
          messageId="answer-prompt-1"
        />
      </QueryClientProvider>,
    );

    const promptText = screen.getByText('By the way, what should I call you? (optional)');
    expect(promptText).toBeInTheDocument();
    expect(promptText).toHaveStyle({ fontSize: '12px', color: '#5B6472' });

    const skipBtn = screen.getByRole('button', { name: 'Skip' });
    expect(skipBtn).toBeInTheDocument();
    expect(skipBtn).toHaveStyle({ height: '44px' });

    fireEvent.click(skipBtn);
    expect(screen.queryByText('By the way, what should I call you? (optional)')).not.toBeInTheDocument();
  });

  it('renders success answer with empty rows as headline only (no table)', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnswerMessage
          answer={{
            status: 'success',
            headline: 'Thanks Mohit, noted.',
            columns: [],
            rows: [],
            rowCount: 0,
            latencyMs: 100,
          }}
          messageId="answer-empty-1"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Thanks Mohit, noted.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText(/0 rows/)).not.toBeInTheDocument();
  });

  it('renders multi-doc source badges when multidocMeta has used_multi_doc true', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AnswerMessage
          answer={{
            ...answer,
            multidocMeta: {
              used_multi_doc: true,
              source_names: ['Products.csv', 'Sales_Q1.csv'],
              join_keys_used: ['product_id'],
            },
          }}
          messageId="answer-multidoc-1"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Sources:')).toBeInTheDocument();
    expect(screen.getByText('Products.csv, Sales_Q1.csv')).toBeInTheDocument();
  });
});
