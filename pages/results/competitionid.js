import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import io from 'socket.io-client';

let socket;

export default function ResultsPage() {
  const router = useRouter();
  const { competitionId } = router.query;
  const [results, setResults] = useState([]);
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!competitionId) return;
    
    const fetchResults = async () => {
      try {
        const res = await fetch(`/api/results/${competitionId}`);
        const data = await res.json();
        
        if (data.success) {
          setResults(data.results);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
      }
    };
    
    const fetchCompetition = async () => {
      try {
        const res = await fetch(`/api/competitions/${competitionId}`);
        const data = await res.json();
        
        if (data.success) {
          setCompetition(data.competition);
        }
      } catch (error) {
        console.error('Error fetching competition:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchResults();
    fetchCompetition();
    
    // Set up socket connection for real-time updates
    socketInitializer();
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, [competitionId]);
  
  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
      socket.emit('joinCompetition', competitionId);
    });
    
    socket.on('scoreUpdate', () => {
      console.log('Received score update');
      fetchResults();
    });
  };
  
  if (loading) return <div>Loading...</div>;
  if (!competition) return <div>Competition not found</div>;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">{competition.name} Results</h1>
      <p className="mb-6 text-gray-600">{competition.description}</p>
      
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Participant</th>
              <th>Total Score</th>
              <th>Average Score</th>
              <th>Judges</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={result.participantId}>
                <td>{index + 1}</td>
                <td>{result.name}</td>
                <td>{result.totalScore.toFixed(2)}</td>
                <td>{result.averageScore.toFixed(2)}</td>
                <td>{result.judgeCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}