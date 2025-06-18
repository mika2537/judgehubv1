'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/app/components/ui/card';

interface CriterionScore {
  criterion: string;
  score: number;
}

interface Score {
  participantId: string;
  judgeId: string;
  scores: CriterionScore[];
  comment: string;
}

interface Participant {
  _id: string;
  name: string;
  performance: string;
}

interface Competition {
  _id: string;
  name: string;
  description: string;
  date: string;
  criteria?: { name: string; weight: number }[];
}

export default function CompetitionDetailsPage() {
  const { id } = useParams();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const res = await fetch(`/api/competitions/${id}`);
        if (!res.ok) throw new Error('Failed to fetch competition');
        const data = await res.json();
        setCompetition(data.competition);
        setParticipants(data.participants);
        setScores(data.scores);
      } catch (error) {
        console.error(error);
        setError('Failed to load competition');
      }
    };

    if (id) fetchCompetition();
  }, [id]);

  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!competition) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{competition.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{competition.description}</p>
          <p className="text-sm text-muted-foreground">
            Date: {competition.date}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Participants</CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p>No participants yet.</p>
          ) : (
            participants.map((participant) => (
              <div key={participant._id} className="mb-4 border-b pb-2">
                <h4 className="font-semibold">{participant.name}</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  {participant.performance}
                </p>

                <div className="ml-4">
                  {scores
                    .filter((s) => s.participantId === participant._id)
                    .map((s, idx) => (
                      <div key={idx} className="mb-2">
                        <p className="font-medium">Judge: {s.judgeId}</p>
                        <ul className="ml-4 list-disc text-sm">
                          {s.scores.map((sc, i) => (
                            <li key={i}>
                              {sc.criterion}: {sc.score}
                            </li>
                          ))}
                        </ul>
                        <p className="text-sm italic mt-1">
                          Comment: {s.comment}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}