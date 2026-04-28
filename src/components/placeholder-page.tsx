type PlaceholderPageProps = { title: string };

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <div className="pageStack">
      <header className="topbar">
        <h1 className="pageTitle">{title}</h1>
      </header>
      <div className="content">
        <div className="card" style={{ maxWidth: 560 }}>
          <div className="cardBody muted">
            This section is in progress and will be available in an upcoming release.
          </div>
        </div>
      </div>
    </div>
  );
}
