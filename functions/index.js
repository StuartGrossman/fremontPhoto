const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.setAdminClaim = functions.https.onRequest(async (req, res) => {
  console.log('Starting setAdminClaim function');
  
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
    console.log('Request received:', req.body);
    
    // Verify the request is a POST
    if (req.method !== 'POST') {
      throw new Error('Only POST requests are accepted');
    }

    // Verify authorization header
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    // Get the ID token and request body
    const idToken = req.headers.authorization.split('Bearer ')[1];
    const { targetUserId, isAdmin } = req.body;
    
    if (!targetUserId) {
      throw new Error('No target user ID provided');
    }
    
    // Verify the token and get the user
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const requestingUser = await admin.auth().getUser(decodedToken.uid);

    console.log('Requesting user:', {
      uid: requestingUser.uid,
      email: requestingUser.email,
      claims: requestingUser.customClaims
    });

    // Get all users from Firestore to verify admin status
    const usersSnapshot = await admin.firestore().collection('users').get();
    const hasAdmins = usersSnapshot.docs.some(doc => doc.data().isAdmin === true);
    const isFirstUser = usersSnapshot.size === 0;

    console.log('Admin check:', {
      hasAdmins,
      isFirstUser,
      totalUsers: usersSnapshot.size
    });

    // Special case: If this is the first user and they're trying to make themselves admin, allow it
    if (isFirstUser && requestingUser.uid === targetUserId && isAdmin) {
      console.log('Allowing first user to become admin');
    } else {
      // Otherwise, check if the requesting user is an admin
      const isRequestingUserAdmin = requestingUser.customClaims?.admin === true;
      if (!isRequestingUserAdmin) {
        throw new Error('Only admins can modify admin status');
      }
    }

    // Set the custom claim
    await admin.auth().setCustomUserClaims(targetUserId, { admin: isAdmin });

    // Create or update the user document in Firestore
    const userRef = admin.firestore().collection('users').doc(targetUserId);
    await userRef.set({
      isAdmin: isAdmin,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: decodedToken.uid,
      email: (await admin.auth().getUser(targetUserId)).email
    }, { merge: true });

    console.log('Operation completed successfully');

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

exports.listUsers = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Verify the request is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // Get all users
    const listUsersResult = await admin.auth().listUsers();
    const users = listUsersResult.users.map(user => ({
      id: user.uid,
      email: user.email,
      displayName: user.displayName,
      emailVerified: user.emailVerified,
      disabled: user.disabled,
      createdAt: user.metadata.creationTime,
      lastSignIn: user.metadata.lastSignInTime,
      isAdmin: user.customClaims?.admin || false
    }));

    res.status(200).json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({ error: error.message });
  }
}); 