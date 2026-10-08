import React from 'react';

export function StepList({ steps = [] }) {
  if (!steps || steps.length === 0) {
    return <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Tidak ada data langkah.</div>;
  }

  return (
    <div className="step-list">
      {steps.map((st, idx) => (
        <div key={idx} className="step-card">
          <div className="step-header">
            <span className="step-title">
              {idx + 1}. {st.title || st.step}
            </span>
            {st.ms !== undefined && (
              <span className="step-time mono">{st.ms} ms</span>
            )}
          </div>
          {st.values && Object.keys(st.values).length > 0 && (
            <div className="step-details">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                {JSON.stringify(st.values, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
