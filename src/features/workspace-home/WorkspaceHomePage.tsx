type WorkspaceHomePageProps = {
  workspaceName: string;
};

export function WorkspaceHomePage({ workspaceName }: WorkspaceHomePageProps) {
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
          Workspace ready
        </p>
        <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 8vw, 3.5rem)' }}>
          You are inside {workspaceName}
        </h1>
        <p style={{ margin: '0 0 12px', fontSize: '1.125rem', lineHeight: 1.6 }}>
          Your shared workspace is ready for boxes and members.
        </p>
        <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: '#4f4565' }}>
          Later slices will add inventory, labels, search, and member management here.
        </p>
      </section>
    </main>
  );
}
