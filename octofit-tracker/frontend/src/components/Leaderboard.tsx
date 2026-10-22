import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getJson<LeaderboardResponse>('/api/leaderboard')
      .then(({ leaderboard: result }) => {
        if (!cancelled) setLeaderboard(result);
      })
      .catch(() => {
        if (!cancelled) setHasError(true);
      });

    return () => { cancelled = true; };
  }, []);

  let content;
  if (hasError) {
    content = <p role="alert">Unable to load leaderboard.</p>;
  } else if (leaderboard === null) {
    content = <p role="status">Loading leaderboard...</p>;
  } else if (leaderboard.length === 0) {
    content = <p>No leaderboard entries yet.</p>;
  } else {
    content = <table className="table">
      <thead><tr><th scope="col">Rank</th><th scope="col">Team</th><th scope="col">Points</th></tr></thead>
      <tbody>{leaderboard.map((entry) => (
        <tr key={`${entry.rank}-${entry.teamName}`}>
          <td>{entry.rank}</td><td>{entry.teamName}</td><td>{entry.totalPoints}</td>
        </tr>
      ))}</tbody>
    </table>;
  }

  return <CapabilityCard title="Leaderboard" description="Compare team point totals.">{content}</CapabilityCard>;
}
