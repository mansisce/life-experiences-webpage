# Weekend Picks — Backend

Neo4j graph database + Express API powering the Weekend Picks recommendation engine.

## Graph Model

```
(School)-[:VALUES]->(Tag)<-[:HAS_TAG]-(Event)-[:BY]->(Provider)
                                           |
                                      (Event)-[:IN_AREA]->(Area)
                                      (Event)-[:FROM_SOURCE]->(Source)
(User)-[:LIKED | DISMISSED | REGISTERED]->(Event)
```

## Start Everything

```bash
cd backend
docker compose up -d
```

Then seed the database:
```bash
cd api
npm install
node seed.js
```

Then scrape real event URLs:
```bash
node scraper.js --headed
```

## Services

| Service | URL | Credentials |
|---------|-----|-------------|
| Neo4j Browser | http://localhost:7474 | neo4j / littlehuman123 |
| API | http://localhost:3001 | — |

## Useful Cypher Queries (paste in Neo4j Browser)

**See full event graph:**
```cypher
MATCH (e:Event)-[:HAS_TAG]->(t:Tag)<-[:VALUES]-(s:School)
RETURN e, t, s LIMIT 80
```

**Best events for CFL:**
```cypher
MATCH (s:School {key:'cfl'})-[:VALUES]->(t:Tag)<-[:HAS_TAG]-(e:Event)
WITH e, count(t) AS overlap, collect(t.name) AS tags
ORDER BY overlap DESC
RETURN e.name, overlap, tags LIMIT 10
```

**Events matching all 3 schools:**
```cypher
MATCH (e:Event)-[:HAS_TAG]->(t:Tag)<-[:VALUES]-(s:School)
WITH e, count(DISTINCT s) AS schoolCount, collect(DISTINCT s.name) AS schools
WHERE schoolCount = 3
RETURN e.name, schools ORDER BY e.free DESC
```

**Free events best matched to CFL + JK:**
```cypher
MATCH (e:Event {free: true})-[:HAS_TAG]->(t:Tag)<-[:VALUES]-(s:School)
WHERE s.key IN ['cfl', 'jk']
WITH e, count(t) AS score
ORDER BY score DESC
RETURN e.name, e.url, score LIMIT 8
```

**What the user has registered for:**
```cypher
MATCH (u:User {id:'default'})-[:REGISTERED]->(e:Event)
RETURN e.name, e.date, e.url
```

## API

```
GET  /events?age=5&liked=id1,id2&dismissed=id3&free=true
GET  /events/:id
GET  /events/:id/url          → resolves best deep link
POST /events/:id/like
POST /events/:id/dismiss
POST /events/:id/register     → returns { url } to open
GET  /schools
GET  /health
```

## Add Real Event URLs

Run the scraper after starting Docker:
```bash
node scraper.js --headed
```

Or set a specific event's URL manually in Neo4j Browser:
```cypher
MATCH (e:Event {id: 'nature-trail'})
SET e.scrapedUrl = 'https://urbanaut.app/spot/actual-event-slug'
```
