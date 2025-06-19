import { useState } from 'react';
import data from '../public/avg_price_data.json';

export default function Home() {
  const [category, setCategory] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [processor, setProcessor] = useState('');
  const [memory, setMemory] = useState('');
  const [hdd, setHdd] = useState('');
  const [grade, setGrade] = useState('');
  const [result, setResult] = useState(null);

  const ramAdjustments = { '4GB': -2, '8GB': 0, '16GB': 7, '32GB': 17, '64GB': 37 };
  const hddAdjustments = { '128GB': 3, '256GB': 0, '512GB': 15, '1TB': 25, '2TB': 50 };

  const categories = [...new Set(data.map(row => row['Category Clean']))];
  const makes = [...new Set(data.map(row => row['Make Clean'] === 'PANASONIC CORPORATION' ? 'PANASONIC' : row['Make Clean']))];
  const models = [...new Set(data.filter(row => row['Make Clean'] === make || (make === 'PANASONIC' && row['Make Clean'] === 'PANASONIC CORPORATION')).map(row => row['Model']))];
  const processors = [...new Set(data.filter(row => row['Model'] === model && (row['Make Clean'] === make || (make === 'PANASONIC' && row['Make Clean'] === 'PANASONIC CORPORATION'))).map(row => row['Processor Clean']).filter(p => p && p !== 'Other'))];
  const memoryOptions = ['4GB', '8GB', '16GB', '32GB', '64GB'];
  const hddOptions = ['128GB', '256GB', '512GB', '1TB', '2TB'];
  const gradeOptions = ['A', 'B', 'C', 'F'];

  const is8thGenOrHigher = (proc) => {
    const p = proc.toUpperCase();
    return p.includes('8') || p.includes('9') || p.includes('10') || p.includes('11') || p.includes('12') || p.includes('13');
  };

  const isI7 = (proc) => proc.toUpperCase().includes('I7');

  const handleSubmit = () => {
    const isF = grade === 'F';
    const is8thGen = is8thGenOrHigher(processor);

    if (isF) {
      setResult(is8thGen ? '$40.00' : '$15.00');
      return;
    }

    const baseline = data.find(row =>
      (row['Make Clean'] === make || (make === 'PANASONIC' && row['Make Clean'] === 'PANASONIC CORPORATION')) &&
      row['Model'] === model &&
      row['Processor Clean'].includes('i5') &&
      row['Memory Clean'] === '8GB' &&
      row['Grade'] === 'B'
    );

    if (!baseline) {
      setResult('No baseline data found');
      return;
    }

    let asp = baseline['Sales Price'];
    asp += ramAdjustments[memory] || 0;
    asp += hddAdjustments[hdd] || 0;

    if (grade === 'A') asp *= 1.15;
    if (grade === 'C') asp *= 0.85;
    if (isI7(processor)) asp += 25;

    setResult(`$${asp.toFixed(2)}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '2rem', color: '#23714D', textAlign: 'center' }}>Mender ASP Estimator</h1>

      <div><label>1. What type of device are you pricing?</label><br />
        <select value={category} onChange={e => setCategory(e.target.value)}>
          <option value="">Select device type...</option>
          {categories.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div><label>2. What is the manufacturer?</label><br />
        <select value={make} onChange={e => setMake(e.target.value)}>
          <option value="">Select brand...</option>
          {makes.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div><label>3. What is the model number?</label><br />
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option value="">Select model...</option>
          {models.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>

      <div><label>4. What processor does it have?</label><br />
        <select value={processor} onChange={e => setProcessor(e.target.value)}>
          <option value="">Select processor...</option>
          {processors.map(p => <option key={p}>{p}</option>)}
        </select>
      </div>

      <div><label>5. How much RAM?</label><br />
        <select value={memory} onChange={e => setMemory(e.target.value)}>
          <option value="">Select RAM...</option>
          {memoryOptions.map(mem => <option key={mem}>{mem}</option>)}
        </select>
      </div>

      <div><label>6. What is the hard drive size?</label><br />
        <select value={hdd} onChange={e => setHdd(e.target.value)}>
          <option value="">Select drive size...</option>
          {hddOptions.map(h => <option key={h}>{h}</option>)}
        </select>
      </div>

      <div><label>7. What is the condition?</label><br />
        <select value={grade} onChange={e => setGrade(e.target.value)}>
          <option value="">Select condition...</option>
          {gradeOptions.map(g => <option key={g}>{g}</option>)}
        </select>
      </div>

      <button style={{ marginTop: '1rem', backgroundColor: '#23714D', color: 'white', padding: '0.5rem 1rem' }} onClick={handleSubmit}>Get ASP</button>
      {result && <div style={{ marginTop: '1rem', fontWeight: 'bold', fontSize: '1.2rem' }}>{result}</div>}
    </div>
  );
}
