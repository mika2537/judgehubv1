import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import io from 'socket.io-client';

let socket;

export default function JudgeScoringPage() {
  const router = useRouter();
  const { judgeId } = router.query;
  const [competition, setCompetition] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, reset } = useForm();
  
  useEffect(() => {
    if (!judgeId) return;
    
    // Fetch competition data
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/judge/${judgeId}`);
        const data = await res.json();
        
        if (data.success) {
          setCompetition(data.competition);
          setParticipants(data.participants);
        } else {
          setError(data.message || 'Error loading competition');
        }
      } catch (err) {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up socket connection
    socketInitializer();
    
    return () => {
      if (socket) socket.disconnect();
    };
  }, [judgeId]);
  
  const socketInitializer = async () => {
    await fetch('/api/socket');
    socket = io();
    
    socket.on('connect', () => {
      console.log('Connected to socket server');
    });
  };
  
  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/scores/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionId: competition._id,
          judgeId,
          participantId: data.participantId,
          scores: {
            criteria1: parseInt(data.criteria1),
            criteria2: parseInt(data.criteria2),
            criteria3: parseInt(data.criteria3),
            criteria4: parseInt(data.criteria4),
            criteria5: parseInt(data.criteria5),
          }
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('Score submitted successfully!');
        reset();
      } else {
        alert('Error submitting score');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to submit score');
    }
  };
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!competition) return <div>Competition not found</div>;
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{competition.name}</h1>
      <p className="mb-6">{competition.description}</p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Participant</span>
          </label>
          <select 
            {...register('participantId', { required: true })}
            className="select select-bordered w-full"
          >
            <option value="">Select a participant</option>
            {participants.map(p => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
        </div>
        
        {competition.criteria.map((criterion, index) => (
          <div key={index} className="form-control">
            <label className="label">
              <span className="label-text">{criterion.name} (1-5)</span>
            </label>
            <input
              type="number"
              min="1"
              max="5"
              {...register(`criteria${index + 1}`, { required: true })}
              className="input input-bordered w-full"
            />
          </div>
        ))}
        
        <button type="submit" className="btn btn-primary">
          Submit Score
        </button>
      </form>
    </div>
  );
}