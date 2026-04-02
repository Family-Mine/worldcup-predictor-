// src/types/__tests__/database.test.ts
import type { Team, Match, Prediction, TeamStats, NewsItem, Subscription, UserPick } from '../database'

describe('Database types', () => {
  it('Team has required fields', () => {
    const team: Team = {
      id: 'uuid',
      name: 'Colombia',
      country_code: 'CO',
      group_letter: 'A',
      fifa_ranking: 9,
      flag_url: 'https://example.com/co.svg',
      confederation: 'CONMEBOL',
      coach: 'Néstor Lorenzo',
      current_form: 'WWDLW',
    }
    expect(team.country_code).toBe('CO')
  })

  it('Match has home and away team ids', () => {
    const match: Match = {
      id: 'uuid',
      home_team_id: 'uuid1',
      away_team_id: 'uuid2',
      group_letter: 'A',
      scheduled_at: '2026-06-11T15:00:00Z',
      venue: 'MetLife Stadium',
      status: 'scheduled',
      home_score: null,
      away_score: null,
      stage: 'group',
    }
    expect(match.status).toBe('scheduled')
  })
})
