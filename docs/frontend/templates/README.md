# Frontend architecture templates

Копируй файлы из этой папки при создании нового модуля.  
Стандарт: `FRONTEND_ARCHITECTURE_GUIDE.md` в корне репозитория.

**Порядок:**
1. `bookingSource.template.ts` → `data/source/bookingSource.ts`
2. `dto.template.ts` → `data/repositories/booking/dto.ts`
3. `BookingRepository.template.ts` → `data/repositories/booking/BookingRepository.ts`
4. `queryKeys.template.ts` → `data/repositories/booking/queryKeys.ts`
5. Hooks → `data/repositories/booking/hooks/`
6. Feature → `modules/booking/feature/BookingServicesPanel/`
7. Screen → `screens/BookingScreen/`

Переименуй `booking` / `Booking` / `ServiceType` под свой домен.
