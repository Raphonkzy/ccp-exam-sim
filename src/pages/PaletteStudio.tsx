import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PALETTES, getPalette, type Palette } from '../lib/palettes'
import { useApp } from '../context/AppContext'

export default function PaletteStudio() {
  const { data, setSettings } = useApp()
  const activePaletteId = data.settings.palette ?? 'oxford-navy'
  const activePalette = getPalette(activePaletteId)

  const [filter, setFilter] = useState<'all' | 'light' | 'dark'>('all')
  const [selectedDemoOption, setSelectedDemoOption] = useState<'A' | 'B' | 'C' | 'D'>('B')
  const [demoAnswerSubmitted, setDemoAnswerSubmitted] = useState(false)
  const [justApplied, setJustApplied] = useState<string | null>(null)

  const filteredPalettes = PALETTES.filter((p) => {
    if (filter === 'light') return !p.isDark
    if (filter === 'dark') return p.isDark
    return true
  })

  const lightCount = PALETTES.filter((p) => !p.isDark).length
  const darkCount = PALETTES.filter((p) => p.isDark).length

  const handleSelectPalette = (palette: Palette) => {
    setSettings({ palette: palette.id })
    setJustApplied(palette.name)
    setTimeout(() => {
      setJustApplied(null)
    }, 2800)
  }

  return (
    <div className="grid gap-8 max-w-6xl mx-auto pb-12">
      {/* Page Header */}
      <div className="fade-up flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-mono font-semibold text-[var(--color-forest-ink)] mb-2">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)] animate-pulse" />
            12 Handcrafted Editorial Schemes
          </div>
          <h1 className="h1 text-[var(--color-forest-ink)]">Color Palette Studio</h1>
          <p className="text-sm text-[var(--color-forest-ink)]/75 mt-1 max-w-2xl">
            Choose from 12 distinct color palettes designed for long study sessions, high contrast, and editorial elegance. Palettes apply instantly across all pages and persist automatically.
          </p>
        </div>

        {/* Current Active Indicator & Reset */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="card !p-3 flex items-center gap-3 bg-[var(--surface)] border-[var(--border)] shadow-xs">
            <div className="flex -space-x-1">
              <span
                className="h-5 w-5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: activePalette.swatches.bg }}
                title="Background"
              />
              <span
                className="h-5 w-5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: activePalette.swatches.surface }}
                title="Surface"
              />
              <span
                className="h-5 w-5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: activePalette.swatches.accent }}
                title="Accent"
              />
              <span
                className="h-5 w-5 rounded-full border border-black/15 shadow-2xs"
                style={{ backgroundColor: activePalette.swatches.text }}
                title="Text"
              />
            </div>
            <div className="text-xs">
              <div className="font-bold text-[var(--color-forest-ink)] leading-tight">{activePalette.name}</div>
              <div className="text-[11px] text-[var(--color-forest-ink)]/60 font-mono">Current Theme</div>
            </div>
          </div>

          {activePaletteId !== 'oxford-navy' && (
            <button
              type="button"
              onClick={() => handleSelectPalette(PALETTES[0])}
              className="btn btn-outline text-xs !py-2 !px-3 font-semibold"
              title="Reset to default Oxford Navy & Gilded Amber"
            >
              Reset Default
            </button>
          )}
        </div>
      </div>

      {/* Applied Toast Alert */}
      {justApplied && (
        <div
          role="status"
          aria-live="polite"
          className="fade-up rounded-lg border border-[var(--border-strong)] bg-[var(--surface-highlight)] px-4 py-2.5 text-xs font-semibold text-[var(--color-forest-ink)] flex items-center justify-between shadow-sm"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Applied <strong>{justApplied}</strong> across all exam and practice interfaces.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase opacity-75">Saved to browser</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Palette theme filters">
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'all'}
            onClick={() => setFilter('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] shadow-2xs'
                : 'text-[var(--color-forest-ink)]/70 hover:bg-[var(--surface-2)]'
            }`}
          >
            All Themes ({PALETTES.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'light'}
            onClick={() => setFilter('light')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'light'
                ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] shadow-2xs'
                : 'text-[var(--color-forest-ink)]/70 hover:bg-[var(--surface-2)]'
            }`}
          >
            <span>Light & Warm</span>
            <span className="text-[10px] font-mono px-1 rounded-full bg-black/10 dark:bg-white/15">
              {lightCount}
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filter === 'dark'}
            onClick={() => setFilter('dark')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === 'dark'
                ? 'bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] shadow-2xs'
                : 'text-[var(--color-forest-ink)]/70 hover:bg-[var(--surface-2)]'
            }`}
          >
            <span>Dark & Console</span>
            <span className="text-[10px] font-mono px-1 rounded-full bg-black/10 dark:bg-white/15">
              {darkCount}
            </span>
          </button>
        </div>

        <div className="hidden sm:block text-xs font-mono text-[var(--color-forest-ink)]/60">
          Click any card to apply
        </div>
      </div>

      {/* 12 Palettes Grid */}
      <section aria-label="Available Color Palettes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPalettes.map((p) => {
          const isActive = p.id === activePaletteId
          return (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectPalette(p)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectPalette(p)
                }
              }}
              className={`group card card-hover cursor-pointer flex flex-col justify-between transition-all duration-200 text-left relative ${
                isActive
                  ? 'ring-2 ring-[var(--color-forest-ink)] border-[var(--color-forest-ink)] shadow-md !bg-[var(--surface)]'
                  : 'hover:border-[var(--color-forest-ink)]/80'
              }`}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-2.5 right-4 rounded-full bg-[var(--color-forest-ink)] text-[var(--color-cream-paper)] px-2.5 py-0.5 text-[10px] font-bold font-mono tracking-wider uppercase shadow-xs flex items-center gap-1 z-10">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </div>
              )}

              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h2 className="text-base font-bold font-display text-[var(--color-forest-ink)] group-hover:text-[var(--primary)] transition-colors">
                      {p.name}
                    </h2>
                    <span className="inline-block mt-0.5 text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--color-forest-ink)]/80 border border-[var(--border)]">
                      {p.tag}
                    </span>
                  </div>

                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full border border-[var(--border)] font-mono text-[var(--color-forest-ink)]/70"
                    title={p.isDark ? 'Dark Mode' : 'Light Mode'}
                  >
                    {p.isDark ? 'Dark' : 'Light'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--color-forest-ink)]/75 line-clamp-2 mb-4 leading-relaxed">
                  {p.description}
                </p>

                {/* Swatches Visual Bar */}
                <div className="mb-4">
                  <div className="text-[11px] font-mono font-semibold uppercase text-[var(--color-forest-ink)]/60 mb-1.5">
                    Palette Swatches
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-full rounded-md border border-black/15 shadow-2xs"
                        style={{ backgroundColor: p.swatches.bg }}
                      />
                      <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Bg</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-full rounded-md border border-black/15 shadow-2xs"
                        style={{ backgroundColor: p.swatches.surface }}
                      />
                      <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Card</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-full rounded-md border border-black/15 shadow-2xs"
                        style={{ backgroundColor: p.swatches.accent }}
                      />
                      <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Accent</span>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="h-8 w-full rounded-md border border-black/15 shadow-2xs"
                        style={{ backgroundColor: p.swatches.text }}
                      />
                      <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Ink</span>
                    </div>
                  </div>
                </div>

                {/* Live Miniature Mockup Card */}
                <div
                  className="rounded-lg border p-2.5 transition-transform group-hover:scale-[1.01]"
                  style={{
                    backgroundColor: p.swatches.bg,
                    borderColor: p.vars['--border'] ?? '#ccc',
                    color: p.swatches.text,
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                      style={{
                        backgroundColor: p.swatches.accent,
                        color: p.vars['--color-forest-ink'] ?? p.swatches.text,
                      }}
                    >
                      CLF-C02
                    </span>
                    <span
                      className="text-[9px] font-mono opacity-65"
                      style={{ color: p.swatches.text }}
                    >
                      Q 1 of 65
                    </span>
                  </div>

                  <div
                    className="rounded border p-1.5 mb-1.5 text-[10px] font-medium leading-tight line-clamp-1"
                    style={{
                      backgroundColor: p.swatches.surface,
                      borderColor: p.vars['--border'] ?? '#ccc',
                      color: p.swatches.text,
                    }}
                  >
                    Which AWS service provides serverless compute?
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div
                      className="flex-1 rounded px-2 py-0.5 text-[9px] font-semibold text-center border truncate"
                      style={{
                        backgroundColor: p.swatches.accent,
                        borderColor: p.vars['--primary'] ?? p.swatches.text,
                        color: p.vars['--color-forest-ink'] ?? p.swatches.text,
                      }}
                    >
                      B. AWS Lambda
                    </div>
                    <div
                      className="rounded px-2 py-0.5 text-[9px] font-bold text-center border"
                      style={{
                        backgroundColor: p.vars['--primary'] ?? p.swatches.text,
                        borderColor: p.vars['--primary'] ?? p.swatches.text,
                        color: p.swatches.surface,
                      }}
                    >
                      Submit
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--color-forest-ink)]/65">
                  {p.isDark ? 'Dark theme' : 'Light theme'}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleSelectPalette(p)
                  }}
                  className={`btn btn-sm !text-xs !py-1 !px-3 font-semibold ${
                    isActive ? 'btn-primary' : 'btn-outline'
                  }`}
                >
                  {isActive ? 'Active' : 'Apply Theme'}
                </button>
              </div>
            </div>
          )
        })}
      </section>

      {/* Live Interactive Component Sandbox */}
      <section
        aria-labelledby="sandbox-heading"
        className="card !p-6 sm:!p-8 border-2 border-[var(--border-strong)] bg-[var(--surface)] transition-shadow mt-4"
        style={{
          boxShadow: '0 4px 18px -4px var(--glow)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
              Live Interactive Playground
            </div>
            <h2 id="sandbox-heading" className="h2 text-[var(--color-forest-ink)]">
              Interactive Component Preview in &quot;{activePalette.name}&quot;
            </h2>
            <p className="text-xs text-[var(--color-forest-ink)]/75 mt-0.5">
              Interact with buttons, options, and chips below to see how this theme renders real CCP exam components.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--color-forest-ink)]">
              Theme: {activePalette.tag}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Question Preview Area (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="chip chip-primary !text-[11px]">Domain 3: Technology</span>
                <span className="text-xs font-mono text-[var(--color-forest-ink)]/70">Question 42 of 65</span>
              </div>

              <h3 className="text-base font-bold text-[var(--color-forest-ink)] mb-4 leading-snug">
                An enterprise workload requires serverless compute that executes code in response to events without provisioning or managing EC2 instances. Which AWS service meets this requirement?
              </h3>

              {/* Options */}
              <div className="space-y-2.5" role="radiogroup" aria-label="Demo answer options">
                {[
                  { id: 'A', text: 'Amazon EC2 (Elastic Compute Cloud)' },
                  { id: 'B', text: 'AWS Lambda (Serverless event-driven compute)' },
                  { id: 'C', text: 'Amazon Lightsail' },
                  { id: 'D', text: 'AWS Elastic Beanstalk' },
                ].map((opt) => {
                  const isSelected = selectedDemoOption === opt.id
                  const isCorrect = demoAnswerSubmitted && opt.id === 'B'
                  const isWrong = demoAnswerSubmitted && isSelected && opt.id !== 'B'

                  let extraClass = ''
                  if (isCorrect) extraClass = 'is-correct'
                  else if (isWrong) extraClass = 'is-wrong'

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() => setSelectedDemoOption(opt.id as 'A' | 'B' | 'C' | 'D')}
                      className={`option ${extraClass}`}
                    >
                      <span className="letter">{opt.id}</span>
                      <span className="flex-1 text-sm">{opt.text}</span>
                      {isSelected && !demoAnswerSubmitted && (
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]">
                          Selected
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Answer submission button & feedback */}
              <div className="mt-5 pt-4 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDemoAnswerSubmitted((v) => !v)}
                    className="btn btn-primary !text-xs !py-1.5 !px-4"
                  >
                    {demoAnswerSubmitted ? 'Reset Question' : 'Check Answer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDemoOption('B')
                      setDemoAnswerSubmitted(false)
                    }}
                    className="btn btn-outline !text-xs !py-1.5 !px-3"
                  >
                    Clear Selection
                  </button>
                </div>

                <div className="text-xs font-mono text-[var(--color-forest-ink)]/70">
                  Try selecting different options
                </div>
              </div>

              {/* Explanation Box */}
              {demoAnswerSubmitted && (
                <div className="fade-up mt-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-highlight)]/40 p-3.5 text-xs text-[var(--color-forest-ink)] leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-[var(--color-forest-ink)]">
                    <span className="chip chip-good !py-0.5 !px-2 !text-[10px]">CORRECT</span>
                    AWS Lambda runs code without provisioning servers.
                  </div>
                  <p className="opacity-85">
                    AWS Lambda is AWS&apos;s flagship serverless computing service that automatically scales from a few requests per day to thousands per second.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Style Elements & Buttons Preview (1 col) */}
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                  Action Buttons
                </h4>
                <div className="flex flex-col gap-2">
                  <button type="button" className="btn btn-primary w-full text-xs">
                    Primary CTA (.btn-primary)
                  </button>
                  <button type="button" className="btn btn-accent w-full text-xs">
                    Highlighter Accent (.btn-accent)
                  </button>
                  <button type="button" className="btn btn-outline w-full text-xs">
                    Outline Button (.btn-outline)
                  </button>
                  <button type="button" className="btn btn-ghost w-full text-xs">
                    Ghost Secondary (.btn-ghost)
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                  Status & Feedback Chips
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  <span className="chip chip-good">Passing 820</span>
                  <span className="chip chip-warn">Flagged for Review</span>
                  <span className="chip chip-bad">Incorrect (1)</span>
                  <span className="chip">Domain Weight 34%</span>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)]">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                  Typography Sample
                </h4>
                <div className="space-y-1.5 text-xs text-[var(--color-forest-ink)]">
                  <p className="font-display font-bold text-sm">Bricolage Grotesque Display</p>
                  <p className="leading-snug">
                    Inter body text with <mark className="highlight">highlighted emphasis</mark> on key AWS architectural concepts.
                  </p>
                  <code className="inline-block font-mono text-[11px] bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                    arn:aws:iam::123456789012:role/admin
                  </code>
                </div>
              </div>
            </div>

            {/* Quick Navigation Footer */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
              <div className="text-xs font-bold text-[var(--color-forest-ink)] mb-1">
                Ready to study in this theme?
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Link to="/practice" className="btn btn-primary !text-xs !py-1 !px-3 font-semibold no-underline">
                  Start Practice
                </Link>
                <Link to="/exam" className="btn btn-outline !text-xs !py-1 !px-3 font-semibold no-underline">
                  Exam Sim
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
