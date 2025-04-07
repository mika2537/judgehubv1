import clientPromise from '../../../lib/mongodb';
import { getIO } from '../../../lib/socket';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { competitionId, participantId, judgeId, scores } = req.body;
    
    const scoreDoc = {
      competitionId,
      participantId,
      judgeId,
      scores,
      submittedAt: new Date()
    };
    
    await db.collection('scores').insertOne(scoreDoc);
    
    // Emit real-time update
    const io = getIO();
    io.to(competitionId).emit('scoreUpdate', { competitionId });
    
    res.status(201).json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting score', error });
  }
}pages/api/results/[competitionId].js