// app/api/events/route.ts
import { Db, MongoClient } from 'mongodb';
import { Event } from '@/app/types/index';

async function connectToDatabaseLocal(): Promise<{ db: Db; client: MongoClient }> {
  if (!process.env.MONGODB_URI) {
    throw new Error('Environment variable MONGODB_URI is not defined');
  }
  if (!process.env.MONGODB_DB) {
    throw new Error('Environment variable MONGODB_DB is not defined');
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB);
  return { db, client };
}

export async function POST(req: Request) {
  try {
    // Validate request body
    const requestBody = await req.json();
    if (!requestBody || typeof requestBody !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { title, startTime, endTime, eventType, status } = requestBody;
    if (!title || !startTime || !eventType || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { db } = await connectToDatabaseLocal();
    const eventsCollection = db.collection<Event>('events');

    const newEvent: Event = {
      title,
      startTime,
      endTime: endTime || startTime, // Default to startTime if endTime not provided
      eventType,
      status,
      sportType: requestBody.sportType,
      teams: requestBody.teams,
      totalVotes: requestBody.totalVotes || 0,
      recentComments: requestBody.recentComments || 0,
      coverImage: requestBody.coverImage,
    };

    const result = await eventsCollection.insertOne(newEvent);

    return new Response(JSON.stringify({ 
      message: 'Event added successfully',
      id: result.insertedId 
    }), { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error adding event:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to add event'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}