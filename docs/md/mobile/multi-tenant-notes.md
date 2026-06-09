# Mobile: одна клиника сейчас, multi-tenant позже

> Решение 2026-06-09: **1 клиника на сборку**, но архитектура не блокирует продажи SaaS.

## Текущая модель (v1)

```
Сборка APK «Ветпрактика»
  appId:  ru.snzbeachvolleyball25.vetpraktika
  slug:   default  (VITE_CLINIC_SLUG в .env при build)
  API:    GET /api/mobile/v1/clinics/default/...
```

Как сейчас Mini App и admin: один VPS = одна клиника в runtime, но **схема БД** уже с `clinic_id`.

## Что закладываем уже в v1 (дешёво)

| Слой | Сейчас | Зачем на будущее |
|---|---|---|
| API paths | `/clinics/{slug}/...` | Новая клиника = другой slug, те же handlers |
| Env `VITE_CLINIC_SLUG` | baked at build | CI matrix: N сборок под N клиник |
| JWT mobile | `sub` = user, optional `clinic_id` claim | Один пользователь — несколько клиник (далёкое будущее) |
| `packages/types` | общие DTO | White-label UI без дублирования типов |
| Контент | из API по slug | Название, лого, цвета — не хардкод в app |

**Не делаем в v1:** экран выбора клиники, динамический slug после установки, один APK на всех клиентов SaaS.

## Два сценария масштабирования (позже)

### A. White-label: отдельное приложение на клинику ✅ проще

```
Клиника A → appId ru.clinica-a.app, slug clinica-a, свой RuStore листинг
Клиника B → appId ru.clinica-b.app, slug clinica-b
```

- Плюсы: свой бренд в сторе, простая модель для заказчика.
- Минусы: N модераций, N keystore (или один upload key — политика на ваш выбор).

CI:

```yaml
# псевдо: matrix build
strategy:
  matrix:
    clinic: [{ slug: default, appId: ru.snzbeachvolleyball25.vetpraktika, name: Ветпрактика }]
```

### B. Одно приложение «YouVet» с выбором клиники

```
Один appId com.youvet.client
После установки → список клиник или код приглашения
```

- Плюсы: одна модерация, один листинг.
- Минусы: сложнее UX, брендинг клиники слабее, нужен каталог клиник в API.

**Рекомендация для YouVet SaaS:** начать с **сценария A** (как сейчас), сценарий B — только если заказчиков много и все согласны на общий бренд.

## Backend: что понадобится для multi-tenant mobile

Уже есть:

- `clinics` table + slug
- Изоляция по `clinic_id` в admin

Добавить при росте:

| Компонент | Когда |
|---|---|
| `GET /api/mobile/v1/clinics` (список) | Сценарий B |
| Привязка `mobile_users` к `clinic_id` | Несколько клиник на одного пользователя |
| Разные `JWT` issuer per tenant | Опционально, высокий уровень изоляции |

## Infra

| Сейчас | Multi-tenant |
|---|---|
| 1 VPS, 1 `CLINIC_SLUG` | N VPS или 1 VPS + N slug (уже возможно в БД) |
| 1 бот | Бот на клинику или multi-tenant bot (отдельная тема) |

## Связь с appId

**1 клиника на сборку** не мешает SaaS: вы продаёте не «один APK на всех», а **сборку под заказчика** с его slug и appId. Документация для онбординга новой клиники (будущее): чеклист env + appId + RuStore аккаунт (свой или ваш как издатель).

См. [app-id-and-stores.md](./app-id-and-stores.md).
