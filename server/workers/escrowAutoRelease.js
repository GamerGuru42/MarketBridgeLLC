const Escrow = require('../models/Escrow');

/**
 * Auto-release worker
 * Checks for escrows that have exceeded the auto-release date (14 days)
 * and releases funds to the dealer if no dispute is active.
 */

async function processAutoRelease() {
    console.log('Running escrow auto-release check...');
    try {
        const escrows = await Escrow.getEscrowsForAutoRelease();

        if (escrows.length === 0) {
            console.log('No escrows pending auto-release.');
            return;
        }

        console.log(`Found ${escrows.length} escrows for auto-release.`);

        for (const escrow of escrows) {
            try {
                console.log(`Processing auto-release for escrow ${escrow.id}...`);

                // Double check status just in case
                if (escrow.status !== 'held') {
                    console.log(`Skipping escrow ${escrow.id}: status is ${escrow.status}`);
                    continue;
                }

                // TODO: Initiate transfer to dealer via Flutterwave
                // const transferResult = await flutterwave.transferToDealer(escrow.dealerId, escrow.amount);

                // Update status to released
                await Escrow.updateEscrowStatus(escrow.id, 'released', {
                    releasedBy: 'system',
                    autoRelease: true,
                    note: 'Auto-released after 14 days without dispute'
                });

                console.log(`Successfully auto-released escrow ${escrow.id}`);
            } catch (err) {
                console.error(`Failed to auto-release escrow ${escrow.id}:`, err);
            }
        }
    } catch (error) {
        console.error('Error in auto-release worker:', error);
    }
}

function startAutoReleaseWorker(intervalMs = 60 * 60 * 1000) { // Default: 1 hour
    // Run immediately on startup
    processAutoRelease();

    // Schedule periodic run
    setInterval(processAutoRelease, intervalMs);
    console.log(`Escrow auto-release worker started with interval ${intervalMs}ms`);
}

module.exports = {
    startAutoReleaseWorker,
    processAutoRelease
};
