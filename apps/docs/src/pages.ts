import architectureMd from '@docs-md/general/architecture.md?raw'
import roadmapMd from '@docs-md/mobile/roadmap.md?raw'
import rustoreMd from '@docs-md/mobile/rustore-guide.md?raw'
import mobileMd from '@docs-md/mobile/overview.md?raw'
import phase5Md from '@docs-md/phases/phase-5-appointments.md?raw'
import bookingClinicMd from '@docs-md/portal/booking-for-clinic.md?raw'

export type DocSection = 'team' | 'clinic'

export type DocPageConfig = {
  slug: string
  title: string
  description: string
  section: DocSection
  badge?: { label: string; tone: 'green' | 'orange' | 'blue' | 'pink' }
  icon: string
  markdown: string
  subtitle?: string
}

export const docPages: DocPageConfig[] = [
  {
    slug: 'project-for-devs',
    title: 'Project Overview',
    description: 'Стек, архитектура, API, миграции, CI/CD, локальная разработка',
    section: 'team',
    badge: { label: 'Dev', tone: 'green' },
    icon: '⚙️',
    markdown: architectureMd,
    subtitle: 'Обзор для разработчиков',
  },
  {
    slug: 'roadmap',
    title: 'Roadmap',
    description: 'Что сделано, что в работе, что планируется — по фазам',
    section: 'team',
    badge: { label: 'В работе', tone: 'orange' },
    icon: '🗺️',
    markdown: roadmapMd,
  },
  {
    slug: 'rustore-app',
    title: 'Ветпрактика → RuStore',
    description: 'Публикация в RuStore: ссылки, чеклист, сборка, первый релиз',
    section: 'team',
    badge: { label: 'Mobile', tone: 'blue' },
    icon: '📱',
    markdown: rustoreMd,
  },
  {
    slug: 'mobile',
    title: 'Mobile — тех. обзор',
    description: 'Capacitor, API M0, auth, архитектура, roadmap разработки',
    section: 'team',
    icon: '⚙️',
    markdown: mobileMd,
  },
  {
    slug: 'booking-for-clinic',
    title: 'Запись на приём — что решили',
    description: 'Mini App, время на УЗИ, лимиты, отмена — памятка для директора',
    section: 'clinic',
    badge: { label: 'Для вас', tone: 'green' },
    icon: '📋',
    markdown: bookingClinicMd,
  },
  {
    slug: 'phase-5-appointments',
    title: 'Фаза 5 — технический план',
    description: 'C1, time_slots, лимиты · для разработки',
    section: 'clinic',
    icon: '📅',
    markdown: phase5Md,
  },
]

export function getDocPage(slug: string): DocPageConfig | undefined {
  return docPages.find((p) => p.slug === slug)
}
