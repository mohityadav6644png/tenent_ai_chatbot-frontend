import { HealthCard } from './HealthCard.jsx';

export function HealthGrid({ components, isLoading }) {
  return (
    <ul className="platform-health-grid" aria-live="polite">
      {isLoading
        ? Array.from({ length: 4 }, (_, index) => (
          <li className="platform-health-skeleton" key={index} aria-hidden="true" />
        ))
        : components.map((component) => (
          <HealthCard component={component} key={component.key} />
        ))}
    </ul>
  );
}
