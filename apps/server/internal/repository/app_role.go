package repository

const (
	AppRoleClient   = "client"
	AppRoleDoctor   = "doctor"
	AppRoleGroomer  = "groomer"
	AppRoleChiefVet = "chief_vet"
)

func NormalizeAppRole(role string) string {
	switch role {
	case AppRoleDoctor, AppRoleGroomer, AppRoleChiefVet:
		return role
	default:
		return AppRoleClient
	}
}

func IsValidAppRole(role string) bool {
	switch role {
	case AppRoleClient, AppRoleDoctor, AppRoleGroomer, AppRoleChiefVet:
		return true
	default:
		return false
	}
}

func IsStaffAppRole(role string) bool {
	return role == AppRoleDoctor || role == AppRoleGroomer || role == AppRoleChiefVet
}

func IsMedicalStaff(role string) bool {
	return role == AppRoleDoctor || role == AppRoleChiefVet
}

func IsGroomingStaff(role string) bool {
	return role == AppRoleGroomer || role == AppRoleChiefVet
}
