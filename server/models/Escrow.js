const { db } = require('../config/firebase');

// Escrow collection reference
const escrowsCollection = db.collection('escrows');

// Create escrow record
async function createEscrow(escrowData) {
    const {
        orderId,
        paymentReference,
        transactionId,
        amount,
        customerId,
        dealerId,
        paymentMethod,
        metadata = {}
    } = escrowData;

    const escrow = {
        orderId,
        paymentReference,
        transactionId,
        amount,
        customerId,
        dealerId,

        // Escrow status
        status: 'held', // held, released, refunded, disputed

        // Payment details
        paymentMethod,
        paidAt: new Date().toISOString(),

        // Lifecycle dates
        releasedAt: null,
        refundedAt: null,
        disputedAt: null,

        // Auto-release after 14 days
        autoReleaseDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),

        // Dispute info
        disputeReason: null,
        disputeStatus: null, // null, pending, resolved, escalated

        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    const docRef = await escrowsCollection.add(escrow);
    return { id: docRef.id, ...escrow };
}

// Get escrow by ID
async function getEscrowById(escrowId) {
    const doc = await escrowsCollection.doc(escrowId).get();

    if (!doc.exists) {
        return null;
    }

    return { id: doc.id, ...doc.data() };
}

// Get escrow by order ID
async function getEscrowByOrderId(orderId) {
    const snapshot = await escrowsCollection
        .where('orderId', '==', orderId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
}

// Update escrow status
async function updateEscrowStatus(escrowId, status, additionalData = {}) {
    const updateData = {
        status,
        updatedAt: new Date().toISOString(),
        ...additionalData
    };

    // Add timestamp based on status
    if (status === 'released') {
        updateData.releasedAt = new Date().toISOString();
    } else if (status === 'refunded') {
        updateData.refundedAt = new Date().toISOString();
    } else if (status === 'disputed') {
        updateData.disputedAt = new Date().toISOString();
    }

    await escrowsCollection.doc(escrowId).update(updateData);

    return getEscrowById(escrowId);
}

// Get escrows ready for auto-release
async function getEscrowsForAutoRelease() {
    const now = new Date().toISOString();

    const snapshot = await escrowsCollection
        .where('status', '==', 'held')
        .where('autoReleaseDate', '<=', now)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get all escrows for a customer
async function getCustomerEscrows(customerId) {
    const snapshot = await escrowsCollection
        .where('customerId', '==', customerId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Get all escrows for a dealer
async function getDealerEscrows(dealerId) {
    const snapshot = await escrowsCollection
        .where('dealerId', '==', dealerId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Update dispute information
async function updateDisputeInfo(escrowId, disputeData) {
    const updateData = {
        disputeReason: disputeData.reason,
        disputeStatus: 'pending',
        disputedAt: new Date().toISOString(),
        status: 'disputed',
        updatedAt: new Date().toISOString(),
    };

    await escrowsCollection.doc(escrowId).update(updateData);
    return getEscrowById(escrowId);
}

module.exports = {
    createEscrow,
    getEscrowById,
    getEscrowByOrderId,
    updateEscrowStatus,
    getEscrowsForAutoRelease,
    getCustomerEscrows,
    getDealerEscrows,
    updateDisputeInfo,
};
