// Script to create Firebase Auth accounts for demo users
// Run this in the browser console or as a Node.js script

const demoUsers = [
  {
    email: 'skillup-admin@teacher.skillup',
    password: 'Skillup@123',
    displayName: 'SkillUp Admin',
    uid: 'qkHQ4gopbTgJdv9Pf0QSZkiGs222'
  },
  {
    email: 'teacher-jenny@teacher.skillup',
    password: 'Skillup@123',
    displayName: 'Jenny Teacher',
    uid: 'YCqXqLV1JacLMsmkgOoCrJQORtE2'
  },
  {
    email: 'student-alice@student.skillup',
    password: 'Skillup123',
    displayName: 'Alice Student',
    uid: 'student-alice-uid'
  },
  {
    email: 'student-bob@student.skillup',
    password: 'Skillup123',
    displayName: 'Bob Student',
    uid: 'student-bob-uid'
  }
];

console.log('Demo Users to create in Firebase Auth:');
demoUsers.forEach(user => {
  console.log(`- ${user.email} (${user.displayName})`);
});

console.log('\nTo create these accounts:');
console.log('1. Go to Firebase Console > Authentication > Users');
console.log('2. Click "Add User" for each account');
console.log('3. Use the email and password from the list above');
console.log('4. Or use the Firebase Admin SDK to create them programmatically');

// Alternative: Create accounts using Firebase Admin SDK (requires backend)
console.log('\nAlternative: Use Firebase Admin SDK in backend:');
console.log('npm install firebase-admin');
console.log('Then use admin.auth().createUser() to create accounts'); 