# Univa Raids

Co-op roguelike raid system for Univa universe.

## Concept

Players bring their heroes and fleets from the main Univa game into scheduled raid events. Linear progression through procedurally generated sectors with branching paths, combat encounters, and boss fights.

## Structure

- **Raids**: Scheduled events (e.g., weekends)
- **Sectors**: Linear progression with branching choices
- **Nodes**: Combat, Resource, Event, Shop, Rest, Boss
- **Parties**: 2-8 players cooperating
- **Rewards**: Feed back into main Univa game

## Tech Stack

- Node.js + TypeScript
- Hono (web framework)
- PostgreSQL (shared with main game)
- Redis (real-time state)
- Socket.io (real-time coordination)

## Development

```bash
npm install
npm run dev
```

Server runs on http://localhost:3001

## Related

- Main game: `univa-repo` (4X strategy)
- Design docs: `Documents/Book of John/01 Notes/univa/univa the rpg/`
