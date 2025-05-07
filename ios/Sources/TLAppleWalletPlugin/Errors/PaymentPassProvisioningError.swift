enum PaymentPassProvisioningError: LocalizedError {
    case bridgeNotAvailable
    case requestConfigurationFailed
    case viewControllerCreationFailed
    case mainViewControllerNotFound
    case passLibraryUnavailable
    case deviceNotSupported
    case invalidCardData
    case invalidPaymentNetwork(String)
    case systemLevelError(Error)
    
    var errorDescription: String? {
        switch self {
        case .bridgeNotAvailable:
            return "Capacitor bridge is not available"
        case .requestConfigurationFailed:
            return "Failed to create request configuration"
        case .viewControllerCreationFailed:
            return "Failed to create Apple Pay controller"
        case .mainViewControllerNotFound:
            return "Main view controller not found"
        case .passLibraryUnavailable:
            return "Apple Wallet is not available on this device"
        case .deviceNotSupported:
            return "This device does not support adding payment cards"
        case .invalidCardData:
            return "The provided card data is invalid"
        case .invalidPaymentNetwork(let network):
            return "Unsupported payment network: \(network)"
        case .systemLevelError(let error):
            return "System error: \(error.localizedDescription)"
        }
    }
    
    var errorCode: String {
        switch self {
        case .passLibraryUnavailable: return "PASS_LIBRARY_UNAVAILABLE"
        case .deviceNotSupported: return "DEVICE_NOT_SUPPORTED"
        case .bridgeNotAvailable: return "BRIDGE_NOT_AVAILABLE"
        case .invalidCardData: return "INVALID_CARD_DATA"
        case .invalidPaymentNetwork: return "INVALID_PAYMENT_NETWORK"
        case .requestConfigurationFailed: return "REQUEST_CONFIGURATION_FAILED"
        case .viewControllerCreationFailed: return "VIEW_CONTROLLER_CREATION_FAILED"
        case .mainViewControllerNotFound: return "MAIN_VIEW_CONTROLLER_NOT_FOUND"
        case .systemLevelError: return "SYSTEM_ERROR"
        }
    }
}