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
            This area is scaffolded for the roadmap. Wire it to Prisma and APIs next.
          </div>
        </div>
      </div>
    </div>
  );
}
