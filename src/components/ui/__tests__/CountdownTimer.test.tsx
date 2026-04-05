import { render, screen } from '@testing-library/react'
import { CountdownTimer } from '../CountdownTimer'

describe('CountdownTimer', () => {
  it('renders all four time unit labels', () => {
    render(
      <CountdownTimer
        targetDate="2099-06-11T15:00:00Z"
        labels={{ days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }}
      />
    )
    expect(screen.getByText('Days')).toBeInTheDocument()
    expect(screen.getByText('Hours')).toBeInTheDocument()
    expect(screen.getByText('Minutes')).toBeInTheDocument()
    expect(screen.getByText('Seconds')).toBeInTheDocument()
  })

  it('renders zero values when target date is in the past', () => {
    render(
      <CountdownTimer
        targetDate="2000-01-01T00:00:00Z"
        labels={{ days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' }}
      />
    )
    // All values should be 00
    const zeros = screen.getAllByText('00')
    expect(zeros.length).toBe(4)
  })
})
