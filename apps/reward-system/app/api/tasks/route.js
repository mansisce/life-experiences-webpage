import { v4 as uuidv4 } from 'uuid';

// Placeholder in-memory storage for MVP
let tasks = [];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  let filtered = tasks;

  if (status) {
    filtered = filtered.filter((t) => t.status === status);
  }
  if (category) {
    filtered = filtered.filter((t) => t.category === category);
  }

  return Response.json({ tasks: filtered, total: filtered.length });
}

export async function POST(req) {
  const body = await req.json();

  const task = {
    id: uuidv4(),
    ...body,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tasks.push(task);

  return Response.json(task, { status: 201 });
}
