import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function POST(req) {
  try {
    const { tasks, rewards } = await req.json();

    if (!tasks.length || !rewards.length) {
      return Response.json({
        assignments: [],
        message: 'No tasks or rewards to categorize',
      });
    }

    const prompt = `Given these tasks:
${JSON.stringify(tasks, null, 2)}

And these available rewards:
${JSON.stringify(rewards, null, 2)}

For each task, assign the most appropriate reward based on:
1. Task difficulty/complexity (inferred from description)
2. Task duration (endDate - startDate in days)
3. Milestone status (milestones get higher-value rewards)
4. Category alignment
5. Reward points matching task importance

Return ONLY a valid JSON array with no other text:
[{ "taskId": "uuid", "rewardId": "uuid", "reason": "explanation" }]

If a task has no matching reward, skip it.
Return only the JSON array, no markdown formatting or explanation.`;

    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0].text;

    // Try to parse the response
    let assignments = [];
    try {
      assignments = JSON.parse(content);
    } catch (e) {
      // If parsing fails, try to extract JSON from the content
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        assignments = JSON.parse(jsonMatch[0]);
      }
    }

    return Response.json({
      assignments,
      processingTime: `${message.usage.output_tokens} tokens`,
    });
  } catch (error) {
    console.error('Categorization error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
