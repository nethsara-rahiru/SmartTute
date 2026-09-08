import { HelpCircle, CheckCircle2, Target } from 'lucide-react';

export function QuickStats({ stats = {} }) {
  const questionsAnswered = stats.questionsAnswered || 0;
  const correctAnswers = stats.correctAnswers || 0;

  // Safe division calculation
  const accuracy = questionsAnswered > 0
    ? Math.round((correctAnswers / questionsAnswered) * 100)
    : 0;

  const statItems = [
    {
      id: 'answered',
      label: 'Questions Answered',
      value: questionsAnswered,
      icon: HelpCircle,
      color: 'var(--color-deep-blue)',
      bgColor: 'rgba(56, 189, 248, 0.12)'
    },
    {
      id: 'correct',
      label: 'Correct Answers',
      value: correctAnswers,
      icon: CheckCircle2,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.12)'
    },
    {
      id: 'accuracy',
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'var(--color-deep-pink)',
      bgColor: 'rgba(236, 72, 153, 0.12)'
    }
  ];

  return (
    <div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
        Quick Statistics
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1.25rem'
        }}
      >
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.25rem'
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.bgColor,
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Icon size={24} />
              </div>

              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.2rem' }}>
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
