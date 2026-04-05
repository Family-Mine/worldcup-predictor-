import { render, screen } from '@testing-library/react'
import { TeamFlag } from '../TeamFlag'

describe('TeamFlag', () => {
  it('renders an img with the team name as alt text', () => {
    render(<TeamFlag countryCode="co" name="Colombia" size="md" />)
    expect(screen.getByRole('img', { name: 'Colombia' })).toBeInTheDocument()
  })

  it('applies correct container size for sm', () => {
    const { container } = render(<TeamFlag countryCode="co" name="Colombia" size="sm" />)
    expect(container.firstChild).toHaveClass('w-6')
  })

  it('applies correct container size for xl', () => {
    const { container } = render(<TeamFlag countryCode="co" name="Colombia" size="xl" />)
    expect(container.firstChild).toHaveClass('w-24')
  })
})
