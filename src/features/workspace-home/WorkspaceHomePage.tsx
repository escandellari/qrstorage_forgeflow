export function WorkspaceHomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '640px',
          backgroundColor: '#ffffff',
          border: '1px solid #e9e2ff',
          borderRadius: '24px',
          padding: '32px 24px',
          boxShadow: '0 20px 45px rgba(108, 74, 182, 0.12)',
        }}
      >
        <p
          style={{
            margin: '0 0 12px',
            fontSize: '0.875rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#6a4bb6',
          }}
        >
          App shell
        </p>
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
          qrstorage_forgeflow
        </h1>
        <p style={{ margin: '0 0 12px', fontSize: '1.125rem', lineHeight: 1.6 }}>
          Track storage boxes without opening every lid.
        </p>
        <p style={{ margin: '0 0 32px', fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
          Start with a shared workspace, label every box, and keep the next scan, search,
          and update flow ready for later slices.
        </p>
        <a
          href="#"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '48px',
            padding: '0 20px',
            borderRadius: '999px',
            backgroundColor: '#6a4bb6',
            color: '#ffffff',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          Sign in
        </a>
      </section>
    </main>
  );
}
