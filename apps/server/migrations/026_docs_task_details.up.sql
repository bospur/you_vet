ALTER TABLE docs_tasks
    ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_description_len;
ALTER TABLE docs_tasks
    ADD CONSTRAINT docs_tasks_description_len
    CHECK (char_length(description) <= 4000);

ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_tags_allowed;
ALTER TABLE docs_tasks
    ADD CONSTRAINT docs_tasks_tags_allowed
    CHECK (tags <@ ARRAY['management', 'development', 'customer']::text[]);

INSERT INTO docs_visitors (display_name)
SELECT 'YouVet'
WHERE NOT EXISTS (
    SELECT 1 FROM docs_visitors WHERE lower(display_name) = 'youvet'
);

INSERT INTO docs_tasks (title, status, priority, position, visitor_id, description, tags)
SELECT s.title, 'todo', s.priority, s.pos, v.id, s.description, s.tags
FROM docs_visitors v
CROSS JOIN (
    VALUES
        (
            'C1 smoke Mini App — запись',
            'high',
            0,
            'Пройти на https://app.bospur.ru: услуга → день → слот → заявка → «Мои заявки» → отмена. Зафиксировать баги. Закрывает BOOK-05.',
            ARRAY['development', 'customer']::text[]
        ),
        (
            'ADM-02 — заявка из админки',
            'normal',
            1,
            'Сейчас заявку можно создать только через API. Нужна форма в admin (роль manager/admin), адаптив < sm.',
            ARRAY['development', 'customer']::text[]
        ),
        (
            'Mobile sprint 5 — запись в APK',
            'high',
            2,
            'Booking flow в приложении «Ветпрактика»: услуги, слоты, заявка, мои записи. Общий backend с Mini App (M2b).',
            ARRAY['development']::text[]
        ),
        (
            'Пересобрать APK на api.bospur.ru',
            'high',
            3,
            'VITE_API_URL=https://api.bospur.ru → npm run build в apps/mobile → npx cap sync android. Иначе WebView бьёт в старый хост.',
            ARRAY['development']::text[]
        ),
        (
            'BotFather Mini App URL и VK callback',
            'high',
            4,
            'Mini App: https://app.bospur.ru. VK: https://app.bospur.ru/vk-callback.html. После смены домена со старого snzbeachvolleyball25.ru.',
            ARRAY['development']::text[]
        ),
        (
            'iOS: Xcode, pod install, симулятор',
            'low',
            5,
            'Папка ios/ уже в репо, @capacitor/ios@7. Ждёт Xcode на машине разработчика. Стор не заявлен.',
            ARRAY['development']::text[]
        ),
        (
            'M3 — публикация в RuStore',
            'normal',
            6,
            'Keystore, AAB, модерация, карточка «Ветпрактика». Не обещать клиентам «на следующей неделе».',
            ARRAY['development', 'management']::text[]
        ),
        (
            'PRD-05 — концепция баннера на главной',
            'low',
            7,
            'Только текст / текст+картинка / превью → info-страница. Не блокирует фазу 5.',
            ARRAY['development', 'customer']::text[]
        ),
        (
            'Фаза 6 — аналитика',
            'low',
            8,
            'События клиентов и дашборд в admin. M0 subset уже есть: telegram_users + вкладка «Обзор».',
            ARRAY['development']::text[]
        ),
        (
            'Фаза 7 — SaaS, онбординг и биллинг',
            'low',
            9,
            'Сейчас один VPS = одна клиника. Нужны онбординг новой клиники, тарифы, super-admin панель.',
            ARRAY['development', 'management']::text[]
        ),
        (
            'Фаза 8 — ЛК и карточка клиента',
            'low',
            10,
            'PRD-09: штрихкод (бот → Mini App → mobile), история визитов, профиль животного, кабинет врача. Нужна схема БД клиники.',
            ARRAY['development', 'customer']::text[]
        ),
        (
            'Фаза 9 — анализы и медданные',
            'low',
            11,
            'Интеграция с анализаторами, результаты с нормами, уведомление о готовности через бот. Не обещать в пилоте.',
            ARRAY['development']::text[]
        ),
        (
            'Портал: markdown-редактор в браузере',
            'low',
            12,
            'Фаза 10: править документы docs.bospur.ru без деплоя из IDE. Сейчас контент едет через CI.',
            ARRAY['development']::text[]
        ),
        (
            'INF-06 — мониторинг VPS в admin',
            'low',
            13,
            'Статус API/диска/контейнера для superadmin. Идея в deployment.md, не запланировано в спринт.',
            ARRAY['development']::text[]
        ),
        (
            'INF-07 — свой мини-Sentry',
            'low',
            14,
            'Fingerprint ошибок booking / auth / upload. Упрощённый error tracking без внешнего SaaS.',
            ARRAY['development']::text[]
        ),
        (
            'Пройти пилот: бот, мини-приложение, админка',
            'high',
            15,
            'Самому: @VPract_bot → https://app.bospur.ru (запись и «мои заявки») → https://admin.bospur.ru. Логин выдаст команда. Без этого демо клиенту не проводить.',
            ARRAY['management']::text[]
        ),
        (
            'Прочитать «Продажи» и памятку записи',
            'high',
            16,
            'Портал: /sales и /booking-for-clinic. Памятку можно переслать директору после демо. Не обещать RuStore, 1С и запись внутри APK.',
            ARRAY['management']::text[]
        ),
        (
            'Собрать список из 20 клиник',
            'high',
            17,
            'Не «все в городе», а те, где можно выйти на директора: знакомые, рекомендации пилота, чаты, выставки. Имя, Telegram/телефон, чем известна клиника.',
            ARRAY['management']::text[]
        ),
        (
            'Выучить скрипт демо на 25 минут',
            'normal',
            18,
            'Телефон (Telegram) + ноутбук (админка), не слайды. 0–3 боль, 3–8 контент, 8–15 запись, 15–20 подтверждение заявки, 23–25 что не входит. См. /sales.',
            ARRAY['management']::text[]
        ),
        (
            'Выучить ответы на возражения',
            'normal',
            19,
            'WhatsApp, «клиенты не умеют в ботов», «сделаем сами», 1С/МИС, цена, App Store. Таблица в /sales. Цену не называть без собственника.',
            ARRAY['management']::text[]
        ),
        (
            'Прочитать «Спроси маму» (The Mom Test)',
            'normal',
            20,
            'Роб Фитцпатрик. Первый контакт с директором: спрашивать про запись и звонки, не слышать вежливое «интересная идея». Краткий разбор: First Round Review.',
            ARRAY['management']::text[]
        ),
        (
            'Прочитать «Продажи по методу SPIN»',
            'normal',
            21,
            'Нил Рекхэм. Разговор: ситуация клиники → проблема (очередь, неявки) → последствия → решение (запись в Telegram).',
            ARRAY['management']::text[]
        ),
        (
            'Прочитать «Продавая невидимое»',
            'low',
            22,
            'Гарри Беквит. Мы продаём сервис, не коробку. Доверие важнее списка фич.',
            ARRAY['management']::text[]
        ),
        (
            'Согласовать формулу пилота с собственником',
            'high',
            23,
            'Срок, что входит, кто настраивает услуги, как говорить о цене. Пока цифры нет в /sales — не называть с потолка. Затем: успех пилота за 2–4 недели (услуги, чат врачей, хотя бы одна заявка).',
            ARRAY['management', 'customer']::text[]
        )
) AS s(title, priority, pos, description, tags)
WHERE lower(v.display_name) = 'youvet'
  AND NOT EXISTS (SELECT 1 FROM docs_tasks t WHERE t.title = s.title);
