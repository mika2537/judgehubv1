import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Adjust path to your NextAuth config

const uri = process.env.MONGODB_URI || '';
const client = new MongoClient(uri);

export async function GET() {
  try {
    await client.connect();
    const db = client.db('judgehub');
    const competitions = await db.collection('competitions').find().toArray();
    return NextResponse.json(competitions, { status: 200 });
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ error: 'Failed to fetch competitions' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function POST(request: Request) {
  try {
    const competition = await request.json();
    await client.connect();
    const db = client.db('judgehub');
    const result = await db.collection('competitions').insertOne(competition);
    return NextResponse.json({ insertedId: result.insertedId.toString() }, { status: 201 });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json({ error: 'Failed to create competition' }, { status: 500 });
  } finally {
    await client.close();
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid or missing competition ID' }, { status: 400 });
    }

    await client.connect();
    const db = client.db('judgehub');
    const result = await db.collection('competitions').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Competition deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting competition:', error);
    return NextResponse.json({ error: 'Failed to delete competition' }, { status: 500 });
  } finally {
    await client.close();
  }
}