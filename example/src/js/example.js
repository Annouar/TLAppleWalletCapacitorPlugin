import { TLAppleWallet } from 'tl-apple-wallet-capacitor-plugin';

// Example usage with proper async flow management
window.testEcho = () => {
    const inputValue = document.getElementById("echoInput").value;
    TLAppleWallet.echo({ value: inputValue })
}

// Example of proper card creation flow with race condition prevention
window.createVirtualCard = async (pass, criticalToken) => {
    try {
        console.log('[DEBUG] Starting card creation flow');
        
        // Step 1: Start Apple Wallet provisioning
        const cardData = {
            cardholderName: pass.cardholderName,
            localizedDescription: pass.description,
            paymentNetwork: pass.paymentNetwork,
            primaryAccountSuffix: pass.primaryAccountSuffix
        };
        
        console.log('[DEBUG] Calling startAddPaymentPass');
        const startTime = Date.now();
        const startResponse = await TLAppleWallet.startAddPaymentPass(cardData);
        console.log(`[DEBUG] startAddPaymentPass completed in ${Date.now() - startTime}ms`);
        
        // Step 2: Add a small delay to ensure UI is stable
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 3: Make server call with received data
        console.log('[DEBUG] Calling postApplePay');
        const serverTime = Date.now();
        const serverResponse = await postApplePay({
            cardData: {
                nonce: startResponse.nonce,
                nonceSignature: startResponse.nonceSignature,
                publicCertificateChain: startResponse.certificates,
            },
            passId: pass.passId,
        }, criticalToken);
        console.log(`[DEBUG] postApplePay completed in ${Date.now() - serverTime}ms`);
        
        // Step 4: Add another delay before finalization
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Step 5: Complete the provisioning
        console.log('[DEBUG] Calling completeAddPaymentPass');
        await TLAppleWallet.completeAddPaymentPass(serverResponse);
        console.log('[DEBUG] Flow completed successfully');
        
        return { success: true };
        
    } catch (error) {
        console.error('[DEBUG] Flow failed:', error);
        throw error;
    }
};

// Mock server call function
async function postApplePay(cardData, criticalToken) {
    // Simulate server call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
        encryptedPassData: "mock_encrypted_data",
        ephemeralPublicKey: "mock_ephemeral_key", 
        activationData: "mock_activation_data"
    };
}

// Alternative implementation with background simulation
window.createVirtualCardWithBackgroundSimulation = async (pass, criticalToken) => {
    try {
        console.log('[DEBUG] Starting card creation flow with background simulation');
        
        const startResponse = await TLAppleWallet.startAddPaymentPass({
            cardholderName: pass.cardholderName,
            localizedDescription: pass.description,
            paymentNetwork: pass.paymentNetwork,
            primaryAccountSuffix: pass.primaryAccountSuffix
        });
        
        // Simulate background/foreground transition to stabilize the flow
        if (window.Capacitor?.isNativePlatform()) {
            console.log('[DEBUG] Simulating background/foreground transition');
            document.dispatchEvent(new Event('pause'));
            await new Promise(resolve => setTimeout(resolve, 50));
            document.dispatchEvent(new Event('resume'));
        }
        
        const serverResponse = await postApplePay({
            cardData: {
                nonce: startResponse.nonce,
                nonceSignature: startResponse.nonceSignature,
                publicCertificateChain: startResponse.certificates,
            },
            passId: pass.passId,
        }, criticalToken);
        
        await TLAppleWallet.completeAddPaymentPass(serverResponse);
        
        return { success: true };
        
    } catch (error) {
        console.error('[DEBUG] Flow failed:', error);
        throw error;
    }
};
