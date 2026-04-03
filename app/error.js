'use client'

export default function Error({
  error,
  reset,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#e74c3c', marginBottom: '20px' }}>
        Something went wrong!
      </h1>
      <p style={{ color: '#666', marginBottom: '20px', textAlign: 'center' }}>
        An error occurred while loading the application.
      </p>
      <button
        onClick={() => reset()}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498db',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Try again
      </button>
      <details style={{ marginTop: '20px', color: '#666' }}>
        <summary style={{ cursor: 'pointer' }}>Error details</summary>
        <pre style={{
          backgroundColor: '#f8f8f8',
          padding: '10px',
          borderRadius: '5px',
          marginTop: '10px',
          fontSize: '12px',
          overflow: 'auto',
          maxWidth: '600px'
        }}>
          {error?.message || 'Unknown error'}
        </pre>
      </details>
    </div>
  )
}