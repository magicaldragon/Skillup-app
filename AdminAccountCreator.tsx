import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { auth, db } from './services/firebase';

const AdminAccountCreator = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createAdminAccount = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const adminData = {
        email: 'admin@admin.skillup',
        password: 'Skillup@123',
        name: 'SkillUp Admin',
        englishName: 'Admin',
        role: 'admin',
        username: 'admin',
        status: 'active',
      };

      console.log('Creating admin account...');

      // Step 1: Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );

      console.log('Firebase Auth user created:', userCredential.user.uid);

      // Step 2: Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        firebaseUid: userCredential.user.uid,
        email: adminData.email,
        name: adminData.name,
        englishName: adminData.englishName,
        username: adminData.username,
        role: adminData.role,
        status: adminData.status,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log('Firestore user document created');

      setSuccess(`✅ Admin account created successfully!
      
📋 Login Credentials:
   Email: ${adminData.email}
   Password: ${adminData.password}
   Role: ${adminData.role}

🎉 You can now login with these credentials!`);
    } catch (error: unknown) {
      console.error('Error creating admin account:', error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'auth/email-already-in-use') {
          setError('⚠️ Admin account already exists! You can use the existing account.');
        } else {
          setError(`❌ Error creating admin account: ${errorMessage}`);
        }
      } else {
        setError(`❌ Error creating admin account: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h2 style={{ color: '#2c5aa0', marginBottom: '20px' }}>🛠️ Admin Account Creator</h2>

      <div
        style={{
          backgroundColor: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h3>Create New Admin Account</h3>
        <p>This will create a new admin account with the following details:</p>
        <ul>
          <li>
            <strong>Email:</strong> admin@admin.skillup
          </li>
          <li>
            <strong>Password:</strong> Skillup@123
          </li>
          <li>
            <strong>Role:</strong> admin
          </li>
          <li>
            <strong>Name:</strong> SkillUp Admin
          </li>
        </ul>
      </div>

      <button
        type="button"
        onClick={createAdminAccount}
        disabled={loading}
        style={{
          backgroundColor: loading ? '#6c757d' : '#28a745',
          color: 'white',
          border: 'none',
          padding: '12px 24px',
          borderRadius: '6px',
          fontSize: '16px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px',
        }}
      >
        {loading ? 'Creating...' : 'Create Admin Account'}
      </button>

      {success && (
        <div
          style={{
            backgroundColor: '#d4edda',
            border: '1px solid #c3e6cb',
            color: '#155724',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
            whiteSpace: 'pre-line',
          }}
        >
          {success}
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            color: '#721c24',
            padding: '15px',
            borderRadius: '6px',
            marginBottom: '20px',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          backgroundColor: '#e7f3ff',
          padding: '15px',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      >
        <h4>ℹ️ How to use:</h4>
        <ol>
          <li>Click "Create Admin Account" button</li>
          <li>Wait for the success message</li>
          <li>Use the provided credentials to login</li>
          <li>The account will have full admin privileges</li>
        </ol>
      </div>
    </div>
  );
};

export default AdminAccountCreator;
