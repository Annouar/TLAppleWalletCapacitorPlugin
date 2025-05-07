enum PaymentPassProvisioningError: Error {
    case bridgeNotAvailable
    case requestConfigurationFailed
    case viewControllerCreationFailed
    case mainViewControllerNotFound
    case passLibraryUnavailable
    case deviceNotSupported
    case invalidCardData
    case invalidPaymentNetwork(String)
    case systemLevelError(Error)
    
    var localizedDescription: String {
        switch self {
        case .bridgeNotAvailable:
            return "Le pont Capacitor n'est pas disponible"
        case .requestConfigurationFailed:
            return "Échec de création de la configuration de la requête"
        case .viewControllerCreationFailed:
            return "Échec de création du contrôleur Apple Pay"
        case .mainViewControllerNotFound:
            return "Contrôleur de vue principal non trouvé"
        case .passLibraryUnavailable:
            return "Apple Wallet n'est pas disponible sur cet appareil"
        case .deviceNotSupported:
            return "Cet appareil ne prend pas en charge l'ajout de cartes de paiement"
        case .invalidCardData:
            return "Les données de carte fournies sont invalides"
        case .invalidPaymentNetwork(let network):
            return "Réseau de paiement non pris en charge: \(network)"
        case .systemLevelError(let error):
            return "Erreur système: \(error.localizedDescription)"
        }
    }
}