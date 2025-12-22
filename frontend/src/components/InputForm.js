import React, { useState, useEffect } from 'react';

export default function InputForm({ features = [], onSubmit, disabled, initialValues = {} }) {
  const buildInitial = () => {
    const init = {};
    for (const f of features) init[f] = '';
    // overlay provided initialValues
    for (const k of Object.keys(initialValues || {})) {
      if (k in init) init[k] = initialValues[k];
    }
    return init;
  };

  const [values, setValues] = useState(buildInitial());

  useEffect(() => {
    setValues(buildInitial());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [features.join('|'), JSON.stringify(initialValues || {})]);

  const handleChange = (k, v) => setValues((s) => ({ ...s, [k]: v }));

  const submit = (e) => {
    e.preventDefault();
    // convert numeric-looking values to numbers where possible
    const payload = {};
    for (const k of Object.keys(values)) {
      const raw = values[k];
      if (raw === '' || raw == null) payload[k] = 0;
      else if (!Number.isNaN(Number(raw))) payload[k] = Number(raw);
      else payload[k] = raw;
    }
    onSubmit && onSubmit(payload);
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
        {features.map((f) => (
          <label key={f} style={{ display: 'block', fontSize: 12, color: '#9aa6b2' }}>
            <div style={{ marginBottom: 6 }}>{f}</div>
            <input
              disabled={disabled}
              value={values[f]}
              onChange={(e) => handleChange(f, e.target.value)}
              placeholder="0"
              style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: '#e6eef3' }}
            />
          </label>
        ))}
      </div>
      <div>
        <button disabled={disabled} type="submit" style={{ padding: '8px 12px', borderRadius: 8, cursor: 'pointer' }}>
          Predict
        </button>
      </div>
    </form>
  );
}
