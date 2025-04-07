import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { competitionId, name } = req.body;
    
    const participant = {
      competitionId,
      name,
      createdAt: new Date()
    };
    
    const result = await db.collection('participants').insertOne(participant);
    
    res.status(201).json({ 
      success: true, 
      participantId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding participant', error });
  }
}