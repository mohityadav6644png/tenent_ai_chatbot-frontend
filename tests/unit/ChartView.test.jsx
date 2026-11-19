import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChartView } from '../../src/features/chat/components/ChartView.jsx';

const chart = {
  type: 'bar',
  label: 'Total sales',
  values: [
    { label: 'May', value: 120 },
    { label: 'June', value: 180 },
    { label: 'October', value: 240 },
  ],
};

describe('ChartView', () => {
  it('renders one bar per row, highlights the largest, and has an accessible label', () => {
    const { container } = render(<ChartView chart={chart} />);

    expect(screen.getByRole('img', {
      name: 'Bar chart of Total sales, rising from May to October',
    })).toBeInTheDocument();
    expect(container.querySelectorAll('.answer-chart__bar')).toHaveLength(3);
    expect(container.querySelectorAll('.answer-chart__bar.is-largest')).toHaveLength(1);
    expect(container.querySelector('.answer-chart__item:last-child .answer-chart__bar'))
      .toHaveClass('is-largest');
  });

  it('renders nothing with fewer than two rows', () => {
    const { container } = render(
      <ChartView chart={{ ...chart, values: chart.values.slice(0, 1) }} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
