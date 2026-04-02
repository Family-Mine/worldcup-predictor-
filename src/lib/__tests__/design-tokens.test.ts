describe('Tailwind config', () => {
  it('exports FIFA gold and green colors', async () => {
    const config = await import('../../../tailwind.config')
    const colors = config.default.theme?.extend?.colors as Record<string, string>
    expect(colors['fifa-gold']).toBe('#D4AF37')
    expect(colors['fifa-green']).toBe('#006847')
  })
})
