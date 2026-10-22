import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = { title: string; focus?: string; reason: string };
type SuggestionsResponse = { suggestions: WorkoutSuggestion[] };
const initialUserEmail = 'mona@example.com';

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<SuggestionsResponse>(`/api/workouts/suggestions/${encodeURIComponent(initialUserEmail)}`)
      .then(({ suggestions: result }) => {
        if (!cancelled) setSuggestions(result);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => { cancelled = true; };
  }, []);

  let content;
  if (hasError) {
    content = <p role="alert">Unable to load workout suggestions.</p>;
  } else if (suggestions === null) {
    content = <p role="status">Loading workout suggestions...</p>;
  } else if (suggestions.length === 0) {
    content = <p>No workout suggestions available.</p>;
  } else {
    content = <ul>{suggestions.map((suggestion, index) => (
      <li key={`${suggestion.title}-${index}`}>
        <strong>{suggestion.title}</strong>
        {suggestion.focus && <span> ({suggestion.focus})</span>}
        <p>{suggestion.reason}</p>
      </li>
    ))}</ul>;
  }

  return <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns.">{content}</CapabilityCard>;
}
