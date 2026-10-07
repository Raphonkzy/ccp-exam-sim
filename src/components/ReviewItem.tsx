import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useT } from '../i18n'
import { QuestionCard } from './QuestionCard'
import { ReviewPanel } from './ReviewPanel'
import type { Question } from '../types/question'

interface Props {
  question: Question
  selected: string[]
  index?: number
  total?: number
  defaultOpen?: boolean
  extra?: string
  showLabel?: string
  hideLabel?: string
}

/** A collapsible question + full review, used by results, mistakes and browse. */
export function ReviewItem({ question, selected, index, total, defaultOpen = false, extra, showLabel, hideLabel }: Props) {
  const { t } = useT()
  const { data } = useApp()
  const [open, setOpen] = useState(defaultOpen)
  const bookmarked = data.bookmarks.includes(question.id)
  return (
    <div className="review-item w-full">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm !rounded-full text-xs font-semibold" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? (hideLabel ?? t('results.hideReview')) : (showLabel ?? t('results.showReview'))}
        </button>
        {extra && <span className="chip !text-[11px]">{extra}</span>}
        {bookmarked && (
          <span className="chip chip-primary !text-[11px] inline-flex items-center gap-1" aria-label={t('review.bookmarked')}>
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
            </svg>
            <span>{t('review.bookmarked')}</span>
          </span>
        )}
      </div>
      {open ? (
        <>
          <QuestionCard question={question} selected={selected} reveal index={index} total={total} keyboard={false} />
          <ReviewPanel question={question} selected={selected} />
        </>
      ) : (
        <PreviewLine question={question} />
      )}
    </div>
  )
}

function PreviewLine({ question }: { question: Question }) {
  return <p className="muted line-clamp-2 text-sm">{question.question}</p>
}
