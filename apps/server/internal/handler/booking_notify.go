package handler

import "go-server/internal/repository"

// BookingNotifier — уведомления о заявках (бот Telegram)
type BookingNotifier interface {
	NotifyBookingRequestCreated(clinicID int, req repository.BookingRequest)
	NotifyBookingRequestUpdated(clinicID int, req repository.BookingRequest, prevStatus string)
}
