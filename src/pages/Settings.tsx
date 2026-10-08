import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { PALETTES, getPalette, type Palette } from '../lib/palettes'

type SettingsTab = 'palette' | 'progress' | 'danger'

export default function Settings() {
  const { user } = useAuth()
  const { data, resetData, setSettings } = useApp()
  const [activeTab, setActiveTab] = useState<SettingsTab>('palette')
  const [themeFilter, setThemeFilter] = useState<'all' | 'light' | 'dark'>('all')
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const [justApplied, setJustApplied] = useState<string | null>(null)

  // Interactive sandbox state
  const [selectedDemoOption, setSelectedDemoOption] = useState<'A' | 'B' | 'C' | 'D'>('B')
  const [demoAnswerSubmitted, setDemoAnswerSubmitted] = useState(false)

  const activePaletteId = data.settings.palette ?? 'oxford-navy'
  const activePalette = getPalette(activePaletteId)

  const filteredPalettes = PALETTES.filter((p) => {
    if (themeFilter === 'light') return !p.isDark
    if (themeFilter === 'dark') return p.isDark
    return true
  })

  const lightCount = PALETTES.filter((p) => !p.isDark).length
  const darkCount = PALETTES.filter((p) => p.isDark).length

  const handleSelectPalette = (p: Palette) => {
    setSettings({ palette: p.id })
    setJustApplied(p.name)
    setTimeout(() => {
      setJustApplied(null)
    }, 2800)
  }

  return (
    <div className="grid gap-8 max-w-5xl mx-auto pb-14">
      {/* Page Header */}
      <div className="fade-up flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-mono font-semibold text-[var(--color-forest-ink)] mb-2 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
            Study Preferences
          </div>
          <h1 className="h1 text-[var(--color-forest-ink)]">Settings &amp; Appearance</h1>
          <p className="text-sm text-[var(--color-forest-ink)]/75 mt-1 max-w-2xl">
            Customize color palettes with synchronized box glows, review your study records, and manage account data.
          </p>
        </div>

        {/* Current Active Theme Summary */}
        <div className="card !p-3 flex items-center gap-3 bg-[var(--surface)] border-[var(--border)] shadow-xs shrink-0">
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
              title="Ink"
            />
          </div>
          <div className="text-xs">
            <div className="font-bold text-[var(--color-forest-ink)] leading-tight">{activePalette.name}</div>
            <div className="text-[11px] text-[var(--color-forest-ink)]/65 font-mono">
              {activePalette.tag} · {activePalette.isDark ? 'Dark mode' : 'Light mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="border-b border-[var(--border)] flex items-center justify-between gap-4">
        <nav className="flex items-center gap-2" aria-label="Settings categories">
          <button
            type="button"
            onClick={() => setActiveTab('palette')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === 'palette'
                ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                : 'border-transparent text-[var(--color-forest-ink)]/60 hover:text-[var(--color-forest-ink)]'
            }`}
          >
            <span>Color Themes</span>
            <span className="rounded-full bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.2 text-[10px] font-mono">
              12
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('progress')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === 'progress'
                ? 'border-[var(--color-forest-ink)] text-[var(--color-forest-ink)]'
                : 'border-transparent text-[var(--color-forest-ink)]/60 hover:text-[var(--color-forest-ink)]'
            }`}
          >
            <span>Study Progress</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              activeTab === 'danger'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-[var(--color-forest-ink)]/60 hover:text-rose-600'
            }`}
          >
            <span>Danger Zone</span>
          </button>
        </nav>
      </div>

      {/* Applied Toast */}
      {justApplied && (
        <div
          role="status"
          aria-live="polite"
          className="fade-up rounded-lg border border-[var(--border-strong)] bg-[var(--surface-highlight)] px-4 py-2.5 text-xs font-semibold text-[var(--color-forest-ink)] flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>
              Applied <strong>{justApplied}</strong>. Palette and matching box glows are updated and saved.
            </span>
          </div>
          <span className="font-mono text-[10px] uppercase opacity-75">Saved to browser</span>
        </div>
      )}

      {/* TAB 1: Color Themes */}
      {activeTab === 'palette' && (
        <div className="space-y-8 fade-up">
          {/* Subheader & Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-[var(--color-forest-ink)]">
                Choose Color Palette Template
              </h2>
              <p className="text-xs text-[var(--color-forest-ink)]/70 mt-0.5">
                Every template synchronizes background, surface cards, text contrast, and box glows.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1 rounded-lg bg-[var(--surface-2)] p-1 border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setThemeFilter('all')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    themeFilter === 'all'
                      ? 'bg-[var(--surface)] text-[var(--color-forest-ink)] shadow-2xs font-bold'
                      : 'text-[var(--color-forest-ink)]/70 hover:text-[var(--color-forest-ink)]'
                  }`}
                >
                  All ({PALETTES.length})
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('light')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    themeFilter === 'light'
                      ? 'bg-[var(--surface)] text-[var(--color-forest-ink)] shadow-2xs font-bold'
                      : 'text-[var(--color-forest-ink)]/70 hover:text-[var(--color-forest-ink)]'
                  }`}
                >
                  Light ({lightCount})
                </button>
                <button
                  type="button"
                  onClick={() => setThemeFilter('dark')}
                  className={`rounded px-2.5 py-1 text-xs font-semibold transition-all ${
                    themeFilter === 'dark'
                      ? 'bg-[var(--surface)] text-[var(--color-forest-ink)] shadow-2xs font-bold'
                      : 'text-[var(--color-forest-ink)]/70 hover:text-[var(--color-forest-ink)]'
                  }`}
                >
                  Dark ({darkCount})
                </button>
              </div>

              {activePaletteId !== 'oxford-navy' && (
                <button
                  type="button"
                  onClick={() => handleSelectPalette(PALETTES[0])}
                  className="btn btn-sm btn-outline text-xs !py-1 !px-2.5 font-semibold"
                  title="Reset to default Oxford Navy & Gilded Amber"
                >
                  Reset Default
                </button>
              )}
            </div>
          </div>

          {/* 12 Palettes Grid */}
          <section aria-label="Available Color Palettes" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
                  className={`group card cursor-pointer flex flex-col justify-between transition-all duration-200 text-left relative ${
                    isActive
                      ? 'ring-2 ring-[var(--color-forest-ink)] border-[var(--color-forest-ink)] shadow-md !bg-[var(--surface)]'
                      : 'hover:border-[var(--color-forest-ink)]/80 hover:shadow-sm'
                  }`}
                  style={{
                    boxShadow: isActive ? `0 8px 24px -4px ${p.vars['--glow']}` : undefined,
                  }}
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
                        <h3 className="text-base font-bold font-display text-[var(--color-forest-ink)] group-hover:text-[var(--primary)] transition-colors">
                          {p.name}
                        </h3>
                        <span className="inline-block mt-0.5 text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--surface-2)] text-[var(--color-forest-ink)]/80 border border-[var(--border)]">
                          {p.tag}
                        </span>
                      </div>

                      <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full border border-[var(--border)] font-mono text-[var(--color-forest-ink)]/70">
                        {p.isDark ? 'Dark' : 'Light'}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-[var(--color-forest-ink)]/75 line-clamp-2 mb-3.5 leading-relaxed">
                      {p.description}
                    </p>

                    {/* Swatches Visual Bar */}
                    <div className="mb-3.5">
                      <div className="text-[11px] font-mono font-semibold uppercase text-[var(--color-forest-ink)]/60 mb-1.5">
                        Palette Swatches
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-full rounded-md border border-black/15 shadow-2xs"
                            style={{ backgroundColor: p.swatches.bg }}
                          />
                          <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Bg</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-full rounded-md border border-black/15 shadow-2xs"
                            style={{ backgroundColor: p.swatches.surface }}
                          />
                          <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Card</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-full rounded-md border border-black/15 shadow-2xs"
                            style={{ backgroundColor: p.swatches.accent }}
                          />
                          <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Accent</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <div
                            className="h-7 w-full rounded-md border border-black/15 shadow-2xs"
                            style={{ backgroundColor: p.swatches.text }}
                          />
                          <span className="text-[10px] font-mono text-[var(--color-forest-ink)]/65">Ink</span>
                        </div>
                      </div>
                    </div>

                    {/* Miniature Mockup Card */}
                    <div
                      className="rounded-lg border p-2.5 transition-transform group-hover:scale-[1.01]"
                      style={{
                        backgroundColor: p.swatches.bg,
                        borderColor: p.vars['--border'] ?? '#ccc',
                        color: p.swatches.text,
                        boxShadow: `0 2px 6px -1px ${p.vars['--glow']}`,
                      }}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded"
                          style={{
                            backgroundColor: p.swatches.accent,
                            color: p.vars['--accent-text'] ?? p.swatches.text,
                          }}
                        >
                          CLF-C02
                        </span>
                        <span className="text-[9px] font-mono opacity-65" style={{ color: p.swatches.text }}>
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
                            borderColor: p.vars['--border-strong'] ?? p.swatches.text,
                            color: p.vars['--accent-text'] ?? p.swatches.text,
                          }}
                        >
                          B. AWS Lambda
                        </div>
                        <div
                          className="rounded px-2 py-0.5 text-[9px] font-bold text-center border"
                          style={{
                            backgroundColor: p.vars['--primary'] ?? p.swatches.text,
                            borderColor: p.vars['--primary'] ?? p.swatches.text,
                            color: p.vars['--accent-text'] ?? p.swatches.surface,
                          }}
                        >
                          Submit
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Button */}
                  <div className="mt-3.5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--color-forest-ink)]/65">
                      {p.isDark ? 'Dark glow' : 'Warm glow'}
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

          {/* Live Interactive Playground */}
          <section
            aria-labelledby="sandbox-heading"
            className="card !p-6 sm:!p-8 border-2 border-[var(--border-strong)] bg-[var(--surface)] transition-shadow"
            style={{
              boxShadow: '0 4px 18px -4px var(--glow)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border)] pb-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  Live Component Sandbox
                </div>
                <h3 id="sandbox-heading" className="h2 text-[var(--color-forest-ink)]">
                  Interactive Preview in &quot;{activePalette.name}&quot;
                </h3>
                <p className="text-xs text-[var(--color-forest-ink)]/75 mt-0.5">
                  Test options, buttons, and matching box glows in your active palette.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[var(--color-forest-ink)]">
                  {activePalette.tag}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Question Preview Area (2 cols) */}
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-xs">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="chip chip-primary !text-[11px]">Domain 3: Technology</span>
                    <span className="text-xs font-mono text-[var(--color-forest-ink)]/70">Question 42 of 65</span>
                  </div>

                  <div className="text-base font-bold text-[var(--color-forest-ink)] mb-4 leading-snug">
                    An enterprise workload requires serverless compute that executes code in response to events without provisioning or managing EC2 instances. Which AWS service meets this requirement?
                  </div>

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

                  {/* Submit actions */}
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
                      Click options to preview selection style
                    </div>
                  </div>

                  {/* Feedback Box */}
                  {demoAnswerSubmitted && (
                    <div className="fade-up mt-4 rounded-lg border border-[var(--border-strong)] bg-[var(--surface-highlight)]/40 p-3.5 text-xs text-[var(--color-forest-ink)] leading-relaxed">
                      <div className="font-bold flex items-center gap-1.5 mb-1 text-[var(--color-forest-ink)]">
                        <span className="chip chip-good !py-0.5 !px-2 !text-[10px]">CORRECT</span>
                        AWS Lambda runs code without provisioning servers.
                      </div>
                      <p className="opacity-85">
                        AWS Lambda executes code in response to events and automatically manages the underlying compute resources.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons & Chips Preview (1 col) */}
              <div className="space-y-4">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
                  <div>
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                      Button Styles
                    </div>
                    <div className="flex flex-col gap-2">
                      <button type="button" className="btn btn-primary w-full text-xs">
                        Primary Button (.btn-primary)
                      </button>
                      <button type="button" className="btn btn-accent w-full text-xs">
                        Accent Highlighter (.btn-accent)
                      </button>
                      <button type="button" className="btn btn-outline w-full text-xs">
                        Outline Button (.btn-outline)
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                      Status &amp; Chips
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="chip chip-good">Passing 820</span>
                      <span className="chip chip-warn">Flagged</span>
                      <span className="chip chip-bad">Incorrect</span>
                      <span className="chip">Domain 34%</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[var(--border)]">
                    <div className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--color-forest-ink)]/70 mb-2">
                      Typography &amp; Glow
                    </div>
                    <div className="space-y-1.5 text-xs text-[var(--color-forest-ink)]">
                      <div className="tagline-badge">AWS CLF-C02 STUDY DESK</div>
                      <p className="leading-snug">
                        Emphasis mark: <mark className="highlight">serverless execution</mark>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                  <div className="text-xs font-bold text-[var(--color-forest-ink)] mb-1">
                    Ready to practice in this theme?
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
      )}

      {/* TAB 2: Study Progress */}
      {activeTab === 'progress' && (
        <div className="space-y-6 fade-up">
          <section className="card grid gap-4" aria-labelledby="progress-h">
            <h2 id="progress-h" className="h2 text-[var(--color-forest-ink)]">Your Progress Statistics</h2>
            <p className="text-xs text-[var(--color-forest-ink)]/70">
              Overview of all recorded practice and exam activity stored on this browser or user account.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.sessions.length}</div>
                <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Exam Attempts</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.bookmarks.length}</div>
                <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Bookmarks</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{Object.keys(data.answers).length}</div>
                <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Answered</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-4 text-center">
                <div className="text-2xl font-bold font-mono text-[var(--color-forest-ink)]">{data.confusing.length}</div>
                <div className="text-[11px] font-medium text-[var(--color-forest-ink)]/70 uppercase tracking-wider mt-0.5">Flagged</div>
              </div>
            </div>
          </section>

          <div className="card flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-[var(--color-forest-ink)]">Review Mistakes &amp; History</div>
              <div className="text-xs text-[var(--color-forest-ink)]/65">Jump directly to your full mistake bank or attempt history logs.</div>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/history" className="btn btn-outline text-xs !py-1.5 !px-3 font-semibold no-underline">
                History
              </Link>
              <Link to="/mistakes" className="btn btn-primary text-xs !py-1.5 !px-3 font-semibold no-underline">
                Mistake Bank
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Danger Zone */}
      {activeTab === 'danger' && (
        <div className="space-y-6 fade-up">
          <section className="card grid gap-4 border border-rose-300/80 bg-rose-50/20 dark:bg-rose-950/15" aria-labelledby="danger-h">
            <div>
              <h2 id="danger-h" className="h2 text-rose-700 dark:text-rose-400">Danger Zone</h2>
              <p className="text-xs text-[var(--color-forest-ink)]/75 mt-1 leading-relaxed">
                This action cannot be undone. All your exam attempts, bookmarks, answers, and flagged questions will be permanently erased.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-rose-200/80 dark:border-rose-900/60 bg-[var(--surface)] px-4 py-3.5">
              <div>
                <div className="text-sm font-semibold text-[var(--color-forest-ink)]">Reset all progress data</div>
                <div className="text-xs text-[var(--color-forest-ink)]/60">Start fresh from zero</div>
              </div>
              <button
                type="button"
                className="btn btn-danger !rounded-[6px] text-xs font-semibold shrink-0"
                onClick={() => setConfirmReset(true)}
              >
                Reset Progress
              </button>
            </div>

            {resetDone && (
              <p className="chip chip-warn !w-fit">Progress has been completely reset.</p>
            )}
          </section>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset all progress?"
        danger
        confirmLabel="Reset Progress"
        onCancel={() => setConfirmReset(false)}
        onConfirm={async () => {
          setConfirmReset(false)
          await resetData()
          setResetDone(true)
        }}
      >
        {user
          ? 'This will permanently delete all your exam attempts, bookmarks, answers, and flagged questions. This cannot be undone.'
          : 'This will clear all your locally stored progress, including practice answers, bookmarks, and exam history. This cannot be undone.'}
      </ConfirmDialog>
    </div>
  )
}
