import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = { _id?: string; name: string; mascot?: string; members: string[] };
type TeamsResponse = { teams: Team[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<TeamsResponse>('/api/teams')
      .then(({ teams: result }) => {
        if (!cancelled) setTeams(result);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => { cancelled = true; };
  }, []);

  let content;
  if (hasError) {
    content = <p role="alert">Unable to load teams.</p>;
  } else if (teams === null) {
    content = <p role="status">Loading teams...</p>;
  } else if (teams.length === 0) {
    content = <p>No teams yet.</p>;
  } else {
    content = <ul>{teams.map((team, index) => (
      <li key={team._id ?? `${team.name}-${index}`}>
        {team.name}{team.mascot ? ` (${team.mascot})` : ''}
        {team.members.length > 0 && <span>: {team.members.join(', ')}</span>}
      </li>
    ))}</ul>;
  }

  return <CapabilityCard title="Teams" description="Manage teams and members.">{content}</CapabilityCard>;
}
