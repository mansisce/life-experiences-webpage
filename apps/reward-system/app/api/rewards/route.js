import { v4 as uuidv4 } from 'uuid';

// Placeholder in-memory storage for MVP
let rewards = [];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  let filtered = rewards;

  if (category) {
    filtered = filtered.filter((r) => r.category === category);
  }

  return Response.json({ rewards: filtered, total: filtered.length });
}

export async function POST(req) {
  const body = await req.json();

  const reward = {
    id: uuidv4(),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  rewards.push(reward);

  return Response.json(reward, { status: 201 });
}
