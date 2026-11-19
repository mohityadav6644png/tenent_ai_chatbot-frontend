import { formatNumber } from '../../../shared/utils/formatNumber.js';

export function ChartView({ chart }) {
  if (!chart || !['bar', 'line'].includes(chart.type) || chart.values.length < 2) return null;

  const maximum = Math.max(...chart.values.map((item) => item.value));
  const first = chart.values[0]?.label;
  const last = chart.values.at(-1)?.label;
  const direction = chart.values.at(-1).value >= chart.values[0].value ? 'rising' : 'falling';
  const accessibleLabel = `Bar chart of ${chart.label}, ${direction} from ${first} to ${last}`;

  return (
    <div className="answer-chart" role="img" aria-label={accessibleLabel}>
      <p className="answer-chart__title">{chart.label}</p>
      <div className="answer-chart__bars">
        {chart.values.map((item) => {
          const largest = item.value === maximum;
          const scale = maximum > 0 ? Math.max(0.025, item.value / maximum) : 0.025;
          return (
            <div className="answer-chart__item" key={item.label}>
              <span
                className={`answer-chart__bar${largest ? ' is-largest' : ''}`}
                style={{ '--bar-scale': scale }}
                title={`${item.label}: ${formatNumber(item.value)}`}
              />
              <span className="answer-chart__label">{item.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
