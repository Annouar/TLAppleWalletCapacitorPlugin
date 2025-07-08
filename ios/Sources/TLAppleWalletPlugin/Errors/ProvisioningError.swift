import Foundation

enum ProvisioningError: LocalizedError {
	case general
	case alreadyInProgress
	case notInProgress
	case timeout
	
	var errorDescription: String? {
		switch self {
		case .general:
			return "AN ERROR OCCURED IN startProvisioning METHOD !"
		case .alreadyInProgress:
			return "Provisioning is already in progress"
		case .notInProgress:
			return "No provisioning in progress"
		case .timeout:
			return "Provisioning timeout"
		}
	}
}