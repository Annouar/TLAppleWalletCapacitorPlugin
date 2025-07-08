# Correction des Race Conditions - TLAppleWallet Plugin

## Problème identifié

Le plugin rencontrait des problèmes de race condition lors de l'ajout de cartes à Apple Wallet, caractérisés par :
- Succès aléatoire (parfois plus de 20 tentatives nécessaires)
- Fonctionnement systématique après mise en arrière-plan puis retour à l'app
- Échecs fréquents lors d'un usage normal

## Causes identifiées

1. **Race condition dans le flow asynchrone** : Le code ne gérait pas correctement la synchronisation entre les différents appels asynchrones
2. **Problème de thread principal** : Les opérations bloquaient potentiellement le main thread
3. **Gestion d'état incohérente** : Pas de vérification d'état avant d'exécuter les callbacks
4. **Absence de timeout et cleanup** : Pas de mécanisme de récupération en cas d'échec

## Solutions implémentées

### 1. Gestion d'état robuste (Swift)

```swift
// Ajout de variables d'état
private var isProvisioningInProgress = false
private let provisioningTimeout: TimeInterval = 30.0
private var provisioningTimer: Timer?
private var currentViewController: PKAddPaymentPassViewController?

// Méthodes de gestion d'état
private func cleanupProvisioning() {
    isProvisioningInProgress = false
    startAddPaymentPassCallbackId = nil
    completeAddPaymentPassCallbackId = nil
    provisioningHandler = nil
    currentViewController = nil
    
    provisioningTimer?.invalidate()
    provisioningTimer = nil
}

private func startProvisioningTimeout() {
    provisioningTimer?.invalidate()
    provisioningTimer = Timer.scheduledTimer(withTimeInterval: provisioningTimeout, repeats: false) { [weak self] _ in
        DispatchQueue.main.async {
            self?.handleProvisioningTimeout()
        }
    }
}
```

### 2. Validation d'état dans les callbacks

```swift
public func addPaymentPassViewController(_ controller: PKAddPaymentPassViewController,
                                         generateRequestWithCertificateChain certificates: [Data],
                                         nonce: Data,
                                         nonceSignature: Data,
                                         completionHandler handler: @escaping (PKAddPaymentPassRequest) -> Void) {
    
    // Validation de l'état du controller
    guard controller.presentingViewController != nil,
          !controller.isBeingDismissed else {
        print("[DEBUG] Controller is not properly presented or being dismissed")
        return
    }
    
    // Validation de l'état du provisioning
    guard let startAddPaymentPassCallbackId,
          let call = self.bridge?.savedCall(withID: startAddPaymentPassCallbackId),
          isProvisioningInProgress
    else { 
        print("[DEBUG] Invalid state for provisioning")
        return 
    }
    
    // ... reste du code
}
```

### 3. Délais et stabilisation du runloop

```swift
@objc
func completeAddPaymentPass(call: CAPPluginCall) throws {
    // ... validation des données ...
    
    // Ajout d'un délai pour assurer la stabilité de l'UI
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
        // Force le runloop à traiter les mises à jour UI en attente
        RunLoop.main.run(until: Date(timeIntervalSinceNow: 0.01))
        
        // Puis exécute le provisioning handler
        self?.provisioningHandler?(requestPayPass)
    }
}
```

### 4. Gestion des erreurs améliorée

```swift
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
```

## Utilisation côté JavaScript

### Flow recommandé avec délais

```javascript
const createVirtualCard = async (pass, criticalToken) => {
    try {
        console.log('[DEBUG] Starting card creation flow');
        
        // Étape 1: Démarrer le processus Apple Wallet
        const startResponse = await TLAppleWallet.startAddPaymentPass(cardData);
        
        // Étape 2: Délai pour stabiliser l'UI
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Étape 3: Appel serveur
        const serverResponse = await postApplePay({
            cardData: {
                nonce: startResponse.nonce,
                nonceSignature: startResponse.nonceSignature,
                publicCertificateChain: startResponse.certificates,
            },
            passId: pass.passId,
        }, criticalToken);
        
        // Étape 4: Délai avant finalisation
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Étape 5: Finaliser
        await TLAppleWallet.completeAddPaymentPass(serverResponse);
        
        return { success: true };
        
    } catch (error) {
        console.error('[DEBUG] Flow failed:', error);
        throw error;
    }
};
```

### Alternative avec simulation d'arrière-plan

```javascript
const createVirtualCardWithBackgroundSimulation = async (pass, criticalToken) => {
    try {
        const startResponse = await TLAppleWallet.startAddPaymentPass(cardData);
        
        // Simuler la transition arrière-plan/avant-plan pour stabiliser le flow
        if (window.Capacitor?.isNativePlatform()) {
            console.log('[DEBUG] Simulating background/foreground transition');
            document.dispatchEvent(new Event('pause'));
            await new Promise(resolve => setTimeout(resolve, 50));
            document.dispatchEvent(new Event('resume'));
        }
        
        const serverResponse = await postApplePay(/* ... */);
        await TLAppleWallet.completeAddPaymentPass(serverResponse);
        
        return { success: true };
        
    } catch (error) {
        console.error('[DEBUG] Flow failed:', error);
        throw error;
    }
};
```

## Bonnes pratiques

1. **Toujours ajouter des délais** entre les étapes du flow
2. **Utiliser la simulation d'arrière-plan** si les problèmes persistent
3. **Implémenter une gestion d'erreur robuste** avec retry logic
4. **Ajouter des logs de debug** pour identifier les points de défaillance
5. **Vérifier l'état du provisioning** avant chaque appel

## Tests recommandés

1. Testez le flow normal avec les délais ajoutés
2. Testez avec la simulation d'arrière-plan
3. Testez avec des appels rapides successifs
4. Testez avec des timeouts réseau
5. Testez sur différents appareils iOS

## Monitoring

Ajoutez ces logs pour surveiller le comportement :

```javascript
console.log('[DEBUG] startAddPaymentPass completed in ${Date.now() - startTime}ms');
console.log('[DEBUG] postApplePay completed in ${Date.now() - serverTime}ms');
console.log('[DEBUG] Flow completed successfully');
```

Ces corrections devraient résoudre les problèmes de race condition et améliorer significativement la fiabilité du plugin. 