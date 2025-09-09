// DebugAPIPanel.tsx - Debug panel to test API connectivity and configuration
import React, { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface APITestResult {
  endpoint: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

const DebugAPIPanel: React.FC = () => {
  const [testResults, setTestResults] = useState<APITestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: APITestResult) => {
    setTestResults(prev => [...prev, result]);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const testAPIEndpoint = async (endpoint: string, description: string) => {
    const token = localStorage.getItem('skillup_token');
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    
    addResult({
      endpoint: description,
      status: 'pending',
      message: `Testing ${fullUrl}...`
    });

    try {
      const response = await fetch(fullUrl, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (response.ok) {
        const data = await response.json();
        addResult({
          endpoint: description,
          status: 'success',
          message: `✅ Success (${response.status})`,
          details: { 
            status: response.status, 
            data: Array.isArray(data) ? `Array with ${data.length} items` : typeof data 
          }
        });
      } else {
        const errorText = await response.text();
        addResult({
          endpoint: description,
          status: 'error',
          message: `❌ Error ${response.status}: ${response.statusText}`,
          details: { status: response.status, error: errorText }
        });
      }
    } catch (error) {
      addResult({
        endpoint: description,
        status: 'error',
        message: `❌ Network Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        details: { error: error instanceof Error ? error.stack : 'Unknown error' }
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();

    // Test basic endpoints
    await testAPIEndpoint('/health', 'Health Check');
    await testAPIEndpoint('/users?status=potential,contacted', 'Potential Students');
    await testAPIEndpoint('/users?status=studying', 'Waiting Students');
    await testAPIEndpoint('/users', 'All Users');
    await testAPIEndpoint('/classes', 'Classes');
    await testAPIEndpoint('/levels', 'Levels');

    setIsRunning(false);
  };

  return (
    <div style={{ 
      padding: '20px', 
      border: '2px solid #059669', 
      borderRadius: '8px', 
      margin: '20px', 
      backgroundColor: '#f8f9fa' 
    }}>
      <h3 style={{ color: '#059669', marginBottom: '15px' }}>🔧 API Debug Panel</h3>
      
      {/* Configuration Info */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: '15px', 
        borderRadius: '6px', 
        marginBottom: '15px',
        border: '1px solid #e9ecef'
      }}>
        <h4>Configuration</h4>
        <p><strong>API Base URL:</strong> <code>{API_BASE_URL}</code></p>
        <p><strong>Environment:</strong> <code>{import.meta.env.MODE}</code></p>
        <p><strong>Has Token:</strong> {localStorage.getItem('skillup_token') ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Token Preview:</strong> {localStorage.getItem('skillup_token')?.substring(0, 20) + '...' || 'None'}</p>
      </div>

      {/* Test Controls */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#059669',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1,
            marginRight: '10px'
          }}
        >
          {isRunning ? '🔄 Testing...' : '🚀 Run API Tests'}
        </button>
        
        <button 
          onClick={clearResults}
          disabled={isRunning}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            opacity: isRunning ? 0.6 : 1
          }}
        >
          🗑️ Clear Results
        </button>
      </div>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '15px', 
          borderRadius: '6px',
          border: '1px solid #e9ecef',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <h4>Test Results</h4>
          {testResults.map((result, index) => (
            <div 
              key={index} 
              style={{ 
                padding: '8px 12px', 
                margin: '5px 0',
                borderRadius: '4px',
                backgroundColor: result.status === 'success' ? '#d4edda' : 
                                 result.status === 'error' ? '#f8d7da' : '#fff3cd',
                border: `1px solid ${result.status === 'success' ? '#c3e6cb' : 
                                     result.status === 'error' ? '#f5c6cb' : '#ffeaa7'}`
              }}
            >
              <strong>{result.endpoint}:</strong> {result.message}
              {result.details && (
                <details style={{ marginTop: '5px', fontSize: '0.9em' }}>
                  <summary style={{ cursor: 'pointer' }}>Details</summary>
                  <pre style={{ 
                    marginTop: '5px', 
                    padding: '5px', 
                    backgroundColor: '#f8f9fa',
                    overflow: 'auto',
                    fontSize: '0.8em'
                  }}>
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DebugAPIPanel;