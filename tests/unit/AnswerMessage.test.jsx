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
    expect(screen.getByRole('button', { name: 'Download CSV' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Helpful' })).toBeInTheDocument();
  });

  it('formats and right-aligns numeric values', () => {
    renderAnswer();
    const cell = screen.getByText('12,345');

    expect(cell.tagName).toBe('TD');
    expect(cell).toHaveClass('result-table__numeric');
    expect(within(cell.closest('tr')).getByText('North')).toBeInTheDocument();
  });

  it('CSV-escapes formula-leading cells', () => {
    expect(toCsv([{ name: 'Value' }], [['=1+1'], ['+cmd'], ['-1'], ['@name']])).toBe(
      '"Value"\r\n"\'=1+1"\r\n"\'+cmd"\r\n"\'-1"\r\n"\'@name"',
    );
  });

  it('changes Helpful to Thanks after feedback resolves', async () => {
    renderAnswer();
    fireEvent.click(screen.getByRole('button', { name: 'Helpful' }));

    expect(await screen.findByRole('button', { name: 'Thanks' })).toBeDisabled();
  });
});
