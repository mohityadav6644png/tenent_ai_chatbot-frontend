import { Button } from '../../../shared/components/Button.jsx';

export function FollowUpChips({ suggestions, onSelect, disabled = false }) {
  if (!suggestions?.length) return null;

  return (
    <div className="follow-up-chips" aria-label="Suggested follow-up questions">
      {suggestions.map((suggestion) => (
        <Button
          className="follow-up-chip"
          disabled={disabled}
          key={suggestion}
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </Button>
      ))}
    </div>
  );
}
