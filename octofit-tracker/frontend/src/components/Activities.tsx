import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Activity = { _id?: string; type: string; minutes: number; points: number };
type ActivitiesResponse = { activities: Activity[] };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<ActivitiesResponse>('/api/activities')
      .then(({ activities: result }) => {
        if (!cancelled) setActivities(result);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => { cancelled = true; };
  }, []);

  let content;
  if (hasError) {
    content = <p role="alert">Unable to load activities.</p>;
  } else if (activities === null) {
    content = <p role="status">Loading activities...</p>;
  } else if (activities.length === 0) {
    content = <p>No activities yet.</p>;
  } else {
    content = <ul>{activities.map((activity) => (
      <li key={activity._id ?? `${activity.type}-${activity.minutes}-${activity.points}`}>
        {activity.type}: {activity.minutes} minutes, {activity.points} points
      </li>
    ))}</ul>;
  }

  return <CapabilityCard title="Activities" description="Track student activity minutes and points.">{content}</CapabilityCard>;
}
