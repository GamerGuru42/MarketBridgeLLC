const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/firebase');

// Users collection reference
const usersCollection = db.collection('users');

// Helper to create user document
const createUser = async (userData) => {
    const userRef = usersCollection.doc();
    const user = {
        id: userRef.id,
        email: userData.email,
        password: await bcrypt.hash(userData.password, 10),
        displayName: userData.displayName,
        role: userData.role || 'customer',
        location: userData.location || '',
        photoURL: userData.photoURL || '',
        isVerified: false,
        storeType: userData.storeType || null,
        businessName: userData.businessName || null,
        flutterwaveId: userData.flutterwaveId || null,
        verificationDocuments: userData.verificationDocuments || [],
        googleId: userData.googleId || null,
        wishlist: userData.wishlist || [],
        createdAt: new Date().toISOString()
    };

    await userRef.set(user);
    return user;
};

// Helper to find user by email
const findUserByEmail = async (email) => {
    const snapshot = await usersCollection.where('email', '==', email).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data();
};

// Helper to find user by ID
const findUserById = async (userId) => {
    const doc = await usersCollection.doc(userId).get();
    if (!doc.exists) return null;
    return doc.data();
};

// Helper to compare password
const comparePassword = async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
};

// Helper to generate JWT
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'secret', {
        expiresIn: '30d'
    });
};

module.exports = {
    usersCollection,
    createUser,
    findUserByEmail,
    findUserById,
    comparePassword,
    generateToken
};
