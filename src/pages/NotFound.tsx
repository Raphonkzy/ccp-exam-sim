import { Link } from 'react-router-dom'
import { useT } from '../i18n'

export default function NotFound() {
  const { t } = useT()
  return (
    <div className="grid gap-6 py-24 text-center">
      <div className="fade-up">
        <p className="text-7xl font-extrabold tracking-tight" style={{ color: 'var(--color-brand-500)' }}>404</p>
        <h1 className="h1 mt-4">{t('errors.notFound')}</h1>
        <p className="muted mt-2">{t('errors.notFoundBody')}</p>
        <Link to="/" className="btn btn-primary mt-6 no-underline">{t('errors.goHome')}</Link>
      </div>
    </div>
  )
}
