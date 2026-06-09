package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"go-server/internal/bot"
	"go-server/internal/db"
	"go-server/internal/handler"
	"go-server/internal/middleware"
	"go-server/internal/repository"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL не задан")
	}
	botToken := os.Getenv("TELEGRAM_BOT_TOKEN")
	if botToken == "" {
		log.Fatal("TELEGRAM_BOT_TOKEN не задан")
	}
	clinicSlug := os.Getenv("CLINIC_SLUG")
	if clinicSlug == "" {
		log.Fatal("CLINIC_SLUG не задан")
	}
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET не задан")
	}
	// Используются только для создания первого пользователя при первом запуске
	adminLogin := os.Getenv("ADMIN_LOGIN")
	adminPass := os.Getenv("ADMIN_PASSWORD")

	database, err := db.Connect(databaseURL)
	if err != nil {
		log.Fatalf("не удалось подключиться к БД: %v", err)
	}
	defer database.Close()
	log.Println("подключение к БД установлено")

	if err := db.RunMigrations(database); err != nil {
		log.Fatalf("ошибка миграций: %v", err)
	}

	uploadsDir := os.Getenv("UPLOADS_DIR")
	if uploadsDir == "" {
		uploadsDir = "./uploads"
	}
	if err := os.MkdirAll(uploadsDir, 0755); err != nil {
		log.Fatalf("не удалось создать папку uploads: %v", err)
	}

	// Репозитории
	animalRepo := repository.NewAnimalRepository(database)
	articleRepo := repository.NewArticleRepository(database)
	userRepo := repository.NewUserRepository(database)
	doctorRepo := repository.NewDoctorRepository(database)
	groomingRepo := repository.NewGroomingRepository(database)
	bookingRepo := repository.NewBookingRepository(database)
	questionRepo := repository.NewClientQuestionRepository(database)
	clinicInfoRepo := repository.NewClinicInfoRepository(database)
	telegramUserRepo := repository.NewTelegramUserRepository(database)

	// Создаём первого admin пользователя если таблица users пустая
	if adminLogin != "" && adminPass != "" {
		count, err := userRepo.Count()
		if err != nil {
			log.Fatalf("ошибка проверки пользователей: %v", err)
		}
		if count == 0 {
			hash, err := bcrypt.GenerateFromPassword([]byte(adminPass), bcrypt.DefaultCost)
			if err != nil {
				log.Fatalf("ошибка хеширования пароля: %v", err)
			}
			if _, err := userRepo.Create(1, adminLogin, string(hash), "admin"); err != nil {
				log.Fatalf("ошибка создания admin пользователя: %v", err)
			}
			log.Printf("создан первый пользователь: %s", adminLogin)
		}
	}

	// Хендлеры
	animalHandler := handler.NewAnimalHandler(animalRepo)
	articleHandler := handler.NewArticleHandler(articleRepo)
	adminHandler := handler.NewAdminHandler(animalRepo, articleRepo, userRepo, jwtSecret)
	doctorHandler := handler.NewDoctorHandler(doctorRepo, uploadsDir)
	groomingHandler := handler.NewGroomingHandler(groomingRepo)
	clinicInfoHandler := handler.NewClinicInfoHandler(clinicInfoRepo, uploadsDir)
	statsHandler := handler.NewStatsHandler(telegramUserRepo)

	clinicID, err := bookingRepo.GetClinicIDBySlug(clinicSlug)
	if err != nil {
		log.Fatalf("клиника %q не найдена: %v", clinicSlug, err)
	}

	publicURL := os.Getenv("PUBLIC_URL")
	if publicURL == "" {
		publicURL = "https://api.snzbeachvolleyball25.ru"
	}
	appURL := os.Getenv("APP_URL")
	if appURL == "" {
		appURL = "https://app.snzbeachvolleyball25.ru"
	}

	mobileAuthRepo := repository.NewMobileAuthRepository(database)

	tgBot, err := bot.New(botToken, clinicSlug, clinicID, publicURL, appURL, animalRepo, articleRepo, doctorRepo, bookingRepo, questionRepo, mobileAuthRepo, telegramUserRepo)
	if err != nil {
		log.Fatalf("ошибка инициализации бота: %v", err)
	}
	go tgBot.Start()

	mobileJWTSecret := handler.MobileJWTSecretFromEnv()
	if mobileJWTSecret == "" {
		log.Fatal("JWT_SECRET или JWT_MOBILE_SECRET не задан")
	}

	bookingHandler := handler.NewBookingHandler(bookingRepo, tgBot)
	questionHandler := handler.NewClientQuestionHandler(questionRepo, tgBot)
	mobileAuthHandler := handler.NewMobileAuthHandler(mobileAuthRepo, tgBot, clinicID, mobileJWTSecret)

	// ── Публичные роуты (Mini App, initData) ───────────────────────────────────
	miniApp := middleware.TelegramInitData(botToken, telegramUserRepo)
	http.HandleFunc("/api/clinics/{clinicSlug}/animals", miniApp(animalHandler.GetAnimals))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/articles/featured", miniApp(articleHandler.GetFeaturedArticles))
	http.HandleFunc("/api/clinics/{clinicSlug}/animals/{animalSlug}/articles", miniApp(articleHandler.GetArticles))
	http.HandleFunc("/api/clinics/{clinicSlug}/articles/{slug}", miniApp(articleHandler.GetArticle))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/doctors", miniApp(doctorHandler.GetPublicDoctors))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/schedule", miniApp(doctorHandler.GetPublicSchedule))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/grooming/breeds", miniApp(groomingHandler.GetPublicBreeds))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/grooming/schedule", miniApp(groomingHandler.GetPublicSchedule))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/clinic-info", miniApp(clinicInfoHandler.GetPublicClinicInfo))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/booking/service-types", miniApp(bookingHandler.GetPublicServiceTypes))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/booking/availability", miniApp(bookingHandler.GetPublicAvailability))
	http.HandleFunc("GET /api/clinics/{clinicSlug}/booking/requests", miniApp(bookingHandler.ListPublicRequests))
	http.HandleFunc("POST /api/clinics/{clinicSlug}/booking/requests", miniApp(bookingHandler.CreatePublicRequest))
	http.HandleFunc("PATCH /api/clinics/{clinicSlug}/booking/requests/{id}", miniApp(bookingHandler.CancelPublicRequest))
	http.HandleFunc("POST /api/clinics/{clinicSlug}/questions", miniApp(questionHandler.CreatePublicQuestion))

	// ── Mobile API (Capacitor, без initData) ───────────────────────────────────
	mobilePublic := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.IPRateLimit(120, time.Minute, h)
	}
	mobileAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.IPRateLimit(60, time.Minute, middleware.MobileAuth(mobileJWTSecret, h))
	}

	http.HandleFunc("POST /api/mobile/v1/auth/request", middleware.LoginRateLimit(10, 15*time.Minute, mobileAuthHandler.RequestCode))
	http.HandleFunc("POST /api/mobile/v1/auth/verify", middleware.LoginRateLimit(20, 15*time.Minute, mobileAuthHandler.VerifyCode))
	http.HandleFunc("POST /api/mobile/v1/auth/refresh", middleware.LoginRateLimit(30, 15*time.Minute, mobileAuthHandler.Refresh))

	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/clinic-info", mobilePublic(clinicInfoHandler.GetPublicClinicInfo))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/animals", mobilePublic(animalHandler.GetAnimals))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/articles/featured", mobilePublic(articleHandler.GetFeaturedArticles))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/animals/{animalSlug}/articles", mobilePublic(articleHandler.GetArticles))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/articles/{slug}", mobilePublic(articleHandler.GetArticle))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/doctors", mobilePublic(doctorHandler.GetPublicDoctors))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/schedule", mobilePublic(doctorHandler.GetPublicSchedule))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/grooming/breeds", mobilePublic(groomingHandler.GetPublicBreeds))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/grooming/schedule", mobilePublic(groomingHandler.GetPublicSchedule))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/booking/service-types", mobilePublic(bookingHandler.GetPublicServiceTypes))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/booking/availability", mobilePublic(bookingHandler.GetPublicAvailability))
	http.HandleFunc("GET /api/mobile/v1/clinics/{clinicSlug}/booking/requests", mobileAuth(bookingHandler.ListPublicRequests))
	http.HandleFunc("POST /api/mobile/v1/clinics/{clinicSlug}/booking/requests", mobileAuth(bookingHandler.CreatePublicRequest))
	http.HandleFunc("PATCH /api/mobile/v1/clinics/{clinicSlug}/booking/requests/{id}", mobileAuth(bookingHandler.CancelPublicRequest))

	// Статические файлы (фото врачей)
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir(uploadsDir))))

	// ── Авторизация ──────────────────────────────────────────────────────────
	http.HandleFunc("POST /api/admin/login", middleware.LoginRateLimit(10, 15*time.Minute, adminHandler.Login))
	http.HandleFunc("POST /api/admin/logout", adminHandler.Logout)
	http.HandleFunc("GET /api/admin/me", middleware.Auth(jwtSecret, adminHandler.Me))

	// ── Защищённые админ роуты ───────────────────────────────────────────────
	contentAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(jwtSecret, middleware.RequireRole(h, "admin", "editor"))
	}
	groomingAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(jwtSecret, middleware.RequireRole(h, "admin", "editor", "groomer"))
	}
	bookingAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(jwtSecret, middleware.RequireRole(h, "admin", "manager"))
	}
	scheduleReadAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(jwtSecret, middleware.RequireRole(h, "admin", "editor", "manager"))
	}
	adminAuth := func(h http.HandlerFunc) http.HandlerFunc {
		return middleware.Auth(jwtSecret, middleware.RequireRole(h, "admin"))
	}

	// Animals
	http.HandleFunc("GET /api/admin/animals", contentAuth(adminHandler.GetAdminAnimals))
	http.HandleFunc("POST /api/admin/animals", contentAuth(adminHandler.CreateAnimal))
	http.HandleFunc("PUT /api/admin/animals/{id}", contentAuth(adminHandler.UpdateAnimal))
	http.HandleFunc("DELETE /api/admin/animals/{id}", contentAuth(adminHandler.DeleteAnimal))

	// Stats (только admin)
	http.HandleFunc("GET /api/admin/stats/summary", adminAuth(statsHandler.GetSummary))
	http.HandleFunc("GET /api/admin/stats/users", adminAuth(statsHandler.ListUsers))

	// Users (только admin)
	http.HandleFunc("GET /api/admin/users", adminAuth(adminHandler.GetAdminUsers))
	http.HandleFunc("POST /api/admin/users", adminAuth(adminHandler.CreateAdminUser))
	http.HandleFunc("DELETE /api/admin/users/{id}", adminAuth(adminHandler.DeleteAdminUser))

	// Articles
	http.HandleFunc("GET /api/admin/articles", contentAuth(adminHandler.GetAdminArticles))
	http.HandleFunc("GET /api/admin/articles/{id}", contentAuth(adminHandler.GetAdminArticle))
	http.HandleFunc("POST /api/admin/articles", contentAuth(adminHandler.CreateArticle))
	http.HandleFunc("PUT /api/admin/articles/{id}", contentAuth(adminHandler.UpdateArticle))
	http.HandleFunc("PATCH /api/admin/articles/{id}/status", adminAuth(adminHandler.UpdateArticleStatus))
	http.HandleFunc("PATCH /api/admin/articles/{id}/featured", adminAuth(adminHandler.UpdateArticleFeatured))
	http.HandleFunc("DELETE /api/admin/articles/{id}", contentAuth(adminHandler.DeleteArticle))
	// Doctors
	http.HandleFunc("GET /api/admin/doctors", contentAuth(doctorHandler.GetDoctors))
	http.HandleFunc("GET /api/admin/doctors/{id}", contentAuth(doctorHandler.GetDoctor))
	http.HandleFunc("POST /api/admin/doctors", contentAuth(doctorHandler.CreateDoctor))
	http.HandleFunc("PUT /api/admin/doctors/{id}", contentAuth(doctorHandler.UpdateDoctor))
	http.HandleFunc("PATCH /api/admin/doctors/{id}/status", adminAuth(doctorHandler.UpdateDoctorStatus))
	http.HandleFunc("POST /api/admin/doctors/{id}/photo", contentAuth(doctorHandler.UploadDoctorPhoto))
	http.HandleFunc("DELETE /api/admin/doctors/{id}", contentAuth(doctorHandler.DeleteDoctor))

	// Schedule
	http.HandleFunc("GET /api/admin/doctors/{id}/schedule", contentAuth(doctorHandler.GetDoctorSchedule))
	http.HandleFunc("POST /api/admin/doctors/{id}/schedule", contentAuth(doctorHandler.AddScheduleSlot))
	http.HandleFunc("DELETE /api/admin/doctors/{id}/schedule/{slotId}", contentAuth(doctorHandler.DeleteScheduleSlot))

	// Schedule exceptions
	http.HandleFunc("GET /api/admin/doctors/{id}/schedule/exceptions", contentAuth(doctorHandler.GetExceptions))
	http.HandleFunc("PUT /api/admin/doctors/{id}/schedule/exceptions", contentAuth(doctorHandler.UpsertException))
	http.HandleFunc("DELETE /api/admin/doctors/{id}/schedule/exceptions/{exceptionId}", contentAuth(doctorHandler.DeleteException))

	http.HandleFunc("GET /api/admin/schedule", scheduleReadAuth(doctorHandler.GetAdminSchedule))

	// Settings
	http.HandleFunc("GET /api/admin/settings", scheduleReadAuth(doctorHandler.GetSettings))
	http.HandleFunc("PATCH /api/admin/settings", adminAuth(doctorHandler.UpdateSettings))

	// Clinic info
	http.HandleFunc("GET /api/admin/clinic-info", contentAuth(clinicInfoHandler.GetClinicInfo))
	http.HandleFunc("PUT /api/admin/clinic-info", contentAuth(clinicInfoHandler.UpdateClinicInfo))
	http.HandleFunc("POST /api/admin/clinic-info/logo", contentAuth(clinicInfoHandler.UploadLogo))
	http.HandleFunc("POST /api/admin/clinic-info/banner", contentAuth(clinicInfoHandler.UploadBanner))

	// Grooming breeds
	http.HandleFunc("GET /api/admin/grooming/breeds", groomingAuth(groomingHandler.GetBreeds))
	http.HandleFunc("PUT /api/admin/grooming/breed-groups", groomingAuth(groomingHandler.SaveBreedGroup))
	http.HandleFunc("DELETE /api/admin/grooming/breed-groups", groomingAuth(groomingHandler.DeleteBreedGroup))

	// Grooming weekly template
	http.HandleFunc("GET /api/admin/grooming/template", groomingAuth(groomingHandler.GetTemplate))
	http.HandleFunc("PUT /api/admin/grooming/template", groomingAuth(groomingHandler.UpsertTemplateSlot))
	http.HandleFunc("DELETE /api/admin/grooming/template/{dayOfWeek}", groomingAuth(groomingHandler.DeleteTemplateSlot))

	// Grooming appointments
	http.HandleFunc("GET /api/admin/grooming/appointments", groomingAuth(groomingHandler.GetAppointments))
	http.HandleFunc("POST /api/admin/grooming/appointments", groomingAuth(groomingHandler.CreateAppointment))
	http.HandleFunc("DELETE /api/admin/grooming/appointments/{id}", groomingAuth(groomingHandler.DeleteAppointment))

	// Booking (запись на приём) — B1: услуги
	http.HandleFunc("GET /api/admin/booking/service-types", bookingAuth(bookingHandler.GetServiceTypes))
	http.HandleFunc("POST /api/admin/booking/service-types", bookingAuth(bookingHandler.CreateServiceType))
	http.HandleFunc("PUT /api/admin/booking/service-types/{id}", bookingAuth(bookingHandler.UpdateServiceType))
	http.HandleFunc("DELETE /api/admin/booking/service-types/{id}", bookingAuth(bookingHandler.DeleteServiceType))

	http.HandleFunc("GET /api/admin/booking/settings", bookingAuth(bookingHandler.GetBookingSettings))
	http.HandleFunc("PATCH /api/admin/booking/settings", adminAuth(bookingHandler.UpdateBookingSettings))
	http.HandleFunc("POST /api/admin/booking/settings/link-chat", adminAuth(bookingHandler.LinkStaffChat))
	http.HandleFunc("GET /api/admin/booking/availability", bookingAuth(bookingHandler.GetAvailability))
	http.HandleFunc("GET /api/admin/booking/weekly-rules", bookingAuth(bookingHandler.GetWeeklyRules))
	http.HandleFunc("PUT /api/admin/booking/weekly-rules", bookingAuth(bookingHandler.UpsertWeeklyRule))
	http.HandleFunc("DELETE /api/admin/booking/weekly-rules", bookingAuth(bookingHandler.DeleteWeeklyRule))
	http.HandleFunc("GET /api/admin/booking/windows", bookingAuth(bookingHandler.GetWindows))
	http.HandleFunc("POST /api/admin/booking/windows", bookingAuth(bookingHandler.CreateWindow))
	http.HandleFunc("DELETE /api/admin/booking/windows/{id}", bookingAuth(bookingHandler.DeleteWindow))
	http.HandleFunc("PUT /api/admin/booking/day-overrides", bookingAuth(bookingHandler.UpsertDayOverride))
	http.HandleFunc("DELETE /api/admin/booking/day-overrides", bookingAuth(bookingHandler.DeleteDayOverride))
	http.HandleFunc("PUT /api/admin/booking/day-staff", bookingAuth(bookingHandler.UpsertDayStaff))

	http.HandleFunc("GET /api/admin/booking/requests", bookingAuth(bookingHandler.GetRequests))
	http.HandleFunc("POST /api/admin/booking/requests", bookingAuth(bookingHandler.CreateRequest))
	http.HandleFunc("PATCH /api/admin/booking/requests/{id}", bookingAuth(bookingHandler.UpdateRequest))

	log.Println("server started :8080")
	if err := http.ListenAndServe(":8080", middleware.CORS(http.DefaultServeMux)); err != nil {
		log.Fatal(err)
	}
}
