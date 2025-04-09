require('dotenv').config();
const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('../models/User');

// Test email and password
const testEmail = 'admin@help.no';
const testPassword = 'Passord123';

async function debugAuth() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected successfully');

    // Find the user
    const user = await User.findOne({ email: testEmail });
    
    if (!user) {
      console.log(`User with email ${testEmail} not found in database.`);
      process.exit(0);
    }
    
    console.log('User found:');
    console.log(`- Name: ${user.name}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Role: ${user.role}`);
    console.log(`- Password hash length: ${user.password.length}`);
    
    // Test password verification
    try {
      console.log('\nTesting password verification:');
      const isValid = await argon2.verify(user.password, testPassword);
      console.log(`Password verification result: ${isValid ? 'SUCCESS' : 'FAILED'}`);
      
      // If verification failed, create a new hash and compare
      if (!isValid) {
        console.log('\nGenerating a new hash for comparison:');
        const newHash = await argon2.hash(testPassword);
        console.log(`New hash length: ${newHash.length}`);
        console.log(`Original hash: ${user.password.substring(0, 30)}...`);
        console.log(`New hash:      ${newHash.substring(0, 30)}...`);
        
        // Try to manually create a user with the same password and verify
        console.log('\nTesting with a new temporary user:');
        const tempUser = new User({
          name: 'Temp User',
          email: 'temp@example.com',
          password: await argon2.hash(testPassword),
          role: 'user'
        });
        
        const tempVerify = await argon2.verify(tempUser.password, testPassword);
        console.log(`Temporary user password verification: ${tempVerify ? 'SUCCESS' : 'FAILED'}`);
      }
    } catch (verifyError) {
      console.error('Error during password verification:', verifyError);
    }
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the debug function
debugAuth().catch(err => {
  console.error('Failed to run debug:', err);
  process.exit(1);
});
