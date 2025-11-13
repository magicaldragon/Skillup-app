// createAdminUser.cjs - Create admin user in Firebase Auth
const { execSync } = require("node:child_process");

console.log("👤 Creating Admin User in Firebase Auth...");
console.log("📋 Project: skillup-3beaf");
console.log("📧 Email: admin@admin.skillup");

console.log("\n📋 Instructions:");
console.log("=====================");
console.log("1. Go to Firebase Console: https://console.firebase.google.com/project/skillup-3beaf");
console.log("2. Navigate to Authentication > Users");
console.log('3. Click "Add User"');
console.log("4. Enter:");
console.log("   - Email: admin@admin.skillup");
console.log("   - Password: (choose a secure password)");
console.log('5. Click "Add user"');
console.log("\n💡 Alternative: Use Firebase CLI");
console.log(
  "   firebase auth:create-user --email admin@admin.skillup --password <password> --project skillup-3beaf",
);

console.log("\n🔍 After creating the user, verify:");
console.log("1. User appears in Authentication > Users");
console.log("2. User has email: admin@admin.skillup");
console.log('3. User status is "Enabled"');

console.log("\n🧪 Test the login flow:");
console.log("1. Open your frontend application");
console.log("2. Try to login with admin@admin.skillup and the password you set");
console.log("3. Check the browser console for any errors");
console.log("4. Verify the user is created in Firestore with role: admin");

console.log("\n📝 Note: The system will automatically:");
console.log('- Extract the role "admin" from the email domain');
console.log("- Create the user in Firestore if they don't exist");
console.log("- Assign the correct permissions based on the role");
