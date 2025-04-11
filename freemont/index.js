/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {onRequest} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

exports.setAdminClaim = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify the request is a POST
    if (req.method !== 'POST') {
      throw new Error('Only POST requests are accepted');
    }

    // Verify authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    // Get the ID token
    const idToken = req.headers.authorization.split('Bearer ')[1];
    
    // Verify the token and get the user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Check if the requester is already an admin
    const requestingUser = await admin.auth().getUser(decodedToken.uid);
    const isRequestingUserAdmin = requestingUser.customClaims?.admin === true;

    if (!isRequestingUserAdmin) {
      throw new Error('Only admins can modify admin status');
    }

    // Get the target user ID and desired admin status from the request body
    const { targetUserId, isAdmin } = req.body;
    if (!targetUserId) {
      throw new Error('No target user ID provided');
    }

    // Set the custom claim
    await admin.auth().setCustomUserClaims(targetUserId, { admin: isAdmin });

    // Update the user document in Firestore
    await admin.firestore().collection('users').doc(targetUserId).update({
      isAdmin: isAdmin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid
    });

    res.json({ 
      success: true, 
      message: `Successfully ${isAdmin ? 'granted' : 'revoked'} admin status` 
    });
  } catch (error) {
    console.error('Error setting admin claim:', error);
    res.status(403).json({ 
      success: false, 
      error: error.message 
    });
  }
});
