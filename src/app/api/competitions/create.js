import clientPromise from '../../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const { name, description, criteria } = req.body;
    
    const competition = {
      name,
      description,
      criteria,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('competitions').insertOne(competition);
    
    res.status(201).json({ 
      success: true, 
      competitionId: result.insertedId 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating competition', error });
  }
}