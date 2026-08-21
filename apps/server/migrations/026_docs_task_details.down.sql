DELETE FROM docs_tasks
WHERE title IN (
    'C1 smoke Mini App — запись',
    'ADM-02 — заявка из админки',
    'Mobile sprint 5 — запись в APK',
    'Пересобрать APK на api.bospur.ru',
    'BotFather Mini App URL и VK callback',
    'iOS: Xcode, pod install, симулятор',
    'M3 — публикация в RuStore',
    'PRD-05 — концепция баннера на главной',
    'Фаза 6 — аналитика',
    'Фаза 7 — SaaS, онбординг и биллинг',
    'Фаза 8 — ЛК и карточка клиента',
    'Фаза 9 — анализы и медданные',
    'Портал: markdown-редактор в браузере',
    'INF-06 — мониторинг VPS в admin',
    'INF-07 — свой мини-Sentry',
    'Пройти пилот: бот, мини-приложение, админка',
    'Прочитать «Продажи» и памятку записи',
    'Собрать список из 20 клиник',
    'Выучить скрипт демо на 25 минут',
    'Выучить ответы на возражения',
    'Прочитать «Спроси маму» (The Mom Test)',
    'Прочитать «Продажи по методу SPIN»',
    'Прочитать «Продавая невидимое»',
    'Согласовать формулу пилота с собственником'
);

DELETE FROM docs_visitors v
WHERE lower(v.display_name) = 'youvet'
  AND NOT EXISTS (SELECT 1 FROM docs_tasks t WHERE t.visitor_id = v.id)
  AND NOT EXISTS (SELECT 1 FROM docs_comments c WHERE c.visitor_id = v.id);

ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_description_len;
ALTER TABLE docs_tasks DROP CONSTRAINT IF EXISTS docs_tasks_tags_allowed;
ALTER TABLE docs_tasks DROP COLUMN IF EXISTS tags;
ALTER TABLE docs_tasks DROP COLUMN IF EXISTS description;
