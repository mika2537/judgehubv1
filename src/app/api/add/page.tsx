'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AddEventPage() {
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [eventType, setEventType] = useState('');
  const [status, setStatus] = useState('');
  const [sportType, setSportType] = useState('');
  const [teams, setTeams] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [recentComments, setRecentComments] = useState(0);
  const [coverImage, setCoverImage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !startTime || !eventType || !status) {
      setError('All required fields must be filled out.');
      return;
    }

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          startTime,
          endTime,
          eventType,
          status,
          sportType,
          teams,
          totalVotes,
          recentComments,
          coverImage,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add event');
      }

      router.push('/home');
    } catch (error) {
      setError('Error saving event: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Add New Event</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rest of your form JSX remains the same */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium">Event Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 p-2 w-full border rounded"
            required
          />
        </div>

        {/* Include all your other form fields here */}

        {error && <p className="text-red-500">{error}</p>}

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Event
        </button>
      </form>
    </div>
  );
}