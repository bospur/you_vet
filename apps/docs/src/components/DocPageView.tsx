import { Link, useParams } from 'react-router-dom'
import { getDocPage } from '../pages'
import { CommentsPanel } from './CommentsPanel'
import { MarkdownView } from './MarkdownView'
import { NotFound } from './NotFound'

export function DocPageView() {
  const { slug = '' } = useParams()
  const page = getDocPage(slug)

  if (!page) return <NotFound />

  return (
    <article className="doc-page">
      <div className="doc-back">
        <Link to="/">← Все документы</Link>
      </div>
      <header className="doc-header">
        <h1>{page.title}</h1>
        {page.subtitle ? <p className="doc-subtitle">{page.subtitle}</p> : null}
        <p className="doc-lead">{page.description}</p>
      </header>
      <MarkdownView markdown={page.markdown} />
      <CommentsPanel pageSlug={page.slug} />
    </article>
  )
}
