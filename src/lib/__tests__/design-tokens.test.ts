describe('Tailwind config', () => {
  it('exports all FIFA and surface colors', async () => {
    const config = await import('../../../tailwind.config')
    const colors = config.default.theme?.extend?.colors as Record<string, string>
    expect(colors['fifa-gold']).toBe('#D4AF37')
    expect(colors['fifa-green']).toBe('#006847')
    expect(colors['surface']).toBe('#0F1117')
    expect(colors['surface-card']).toBe('#1A1D27')
    expect(colors['surface-border']).toBe('#2A2D3A')
  })
})
