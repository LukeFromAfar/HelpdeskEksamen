require('dotenv').config();
const mongoose = require('mongoose');
const argon2 = require('argon2');
const User = require('../models/User');

async function fixPasswords() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);
    
    let successCount = 0;
    let failCount = 0;

    // Process each user
    for (const user of users) {
      try {
        // Test verification with default password
        const testPassword = 'Passord123';
        const isValid = await argon2.verify(user.password, testPassword);
        
        // If verification fails, reset the password
        if (!isValid) {
          console.log(`Updating password for user: ${user.email}`);
          // Hash the password directly without using the pre-save hook
          const hashedPassword = await argon2.hash(testPassword);
          
          // Update the user's password directly in database
          await User.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
          );
          
          // Verify the password was updated correctly
          const updatedUser = await User.findById(user._id);
          const verifyUpdate = await argon2.verify(updatedUser.password, testPassword);
          
          if (verifyUpdate) {
            console.log(`✅ Password updated successfully for ${user.email}`);
            successCount++;
          } else {
            console.log(`❌ Password update verification failed for ${user.email}`);
            failCount++;
          }
        } else {
          console.log(`✅ Password already valid for ${user.email}`);
          successCount++;
        }
      } catch (userError) {
        console.error(`Error processing user ${user.email}:`, userError);
        failCount++;
      }
    }
    
    console.log('\nPassword fix summary:');
    console.log(`- Total users: ${users.length}`);
    console.log(`- Successful: ${successCount}`);
    console.log(`- Failed: ${failCount}`);

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
    
  } catch (error) {
    console.error('Error fixing passwords:', error);
    try {
      await mongoose.disconnect();
    } catch (err) {}
    process.exit(1);
  }
}

// Run the fix function
fixPasswords().catch(err => {
  console.error('Failed to fix passwords:', err);
  process.exit(1);
});
