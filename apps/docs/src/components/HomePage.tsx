import { Link } from 'react-router-dom'
import { docPages, type DocPageConfig } from '../pages'

function badgeClass(tone: NonNullable<DocPageConfig['badge']>['tone']) {
  return `badge badge-${tone}`
}

function DocCard({ page }: { page: DocPageConfig }) {
  return (
    <Link className="card" to={`/${page.slug}`}>
      <div className="card-icon">{page.icon}</div>
      <div className="card-body">
        <div className="card-title">
          {page.title}
          {page.badge ? (
            <span className={badgeClass(page.badge.tone)}>{page.badge.label}</span>
          ) : null}
        </div>
        <div className="card-desc">{page.description}</div>
      </div>
      <div className="card-arrow">›</div>
    </Link>
  )
}

export function HomePage() {
  const team = docPages.filter((p) => p.section === 'team')
  const clinic = docPages.filter((p) => p.section === 'clinic')

  return (
    <div className="home">
      <div className="section-title">Инструменты</div>
      <div className="cards">
        <Link className="card" to="/board">
          <div className="card-icon">📌</div>
          <div className="card-body">
            <div className="card-title">
              Задачи <span className="badge badge-orange">Канбан</span>
            </div>
            <div className="card-desc">К выполнению · в работе · готова — общая доска команды</div>
          </div>
          <div className="card-arrow">›</div>
        </Link>
      </div>

      <div className="section-title">Для команды</div>
      <div className="cards">
        {team.map((page) => (
          <DocCard key={page.slug} page={page} />
        ))}
      </div>

      <div className="section-title">Для клиники</div>
      <div className="cards">
        {clinic.map((page) => (
          <DocCard key={page.slug} page={page} />
        ))}
      </div>

      <div className="footer">
        <a href="https://github.com/bospur/you_vet">github.com/bospur/you_vet</a>
        {' · '}
        docs.bospur.ru
      </div>
    </div>
  )
}
