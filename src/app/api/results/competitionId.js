import clientPromise from '../../../../../lib/mongodb';

export default async function handler(req, res) {
  const { competitionId } = req.query;

  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all participants
    const participants = await db.collection('participants')
      .find({ competitionId })
      .toArray();
    
    // Get all scores
    const scores = await db.collection('scores')
      .find({ competitionId })
      .toArray();
    
    // Calculate totals
    const results = participants.map(participant => {
      const participantScores = scores.filter(s => s.participantId === participant._id.toString());
      const total = participantScores.reduce((sum, score) => {
        return sum + Object.values(score.scores).reduce((s, v) => s + v, 0);
      }, 0);
      
      return {
        participantId: participant._id,
        name: participant.name,
        totalScore: total,
        averageScore: participantScores.length > 0 ? total / participantScores.length : 0,
        judgeCount: participantScores.length
      };
    });
    
    // Sort by highest score
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    res.status(200).json({ success: true, results });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results', error });
  }
}