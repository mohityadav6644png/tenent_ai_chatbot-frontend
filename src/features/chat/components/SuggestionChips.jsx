import { Button } from '../../../shared/components/Button.jsx';

export function SuggestionChips({ suggestions, onSelect, disabled = false }) {
  if (!suggestions?.length) return null;

  return (
    <div className="suggestion-chips" aria-label="Suggested questions">
      {suggestions.map((suggestion) => (
        <Button
          className="suggestion-chip"
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
