import { useEffect, useState } from 'react';

const randomPosition = () => ({ left: `${12 + Math.random() * 72}%`, top: `${18 + Math.random() * 58}%` });

export default function ExampleMiniGame({ onComplete, onCancel, targetHits = 5, timeLimit = 10 }) {
  const [state, setState] = useState('start');
  const [hits, setHits] = useState(0);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [target, setTarget] = useState(randomPosition());

  useEffect(() => {
    if (state !== 'playing') {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          setState('lose');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state]);

  useEffect(() => {
    if (hits >= targetHits) {
      setState('win');
    }
  }, [hits, targetHits]);

  const start = () => {
    setHits(0);
    setTimeLeft(timeLimit);
    setTarget(randomPosition());
    setState('playing');
  };

  return (
    <div style={{ width: 'min(92vw, 720px)', padding: '1.5rem', border: '4px solid #f8f5e8', background: '#10172f', color: '#f8f5e8' }}>
      <h2>Example Mini Game</h2>
      <p>Click the moving target. This file is a template for adding more mini-games.</p>
      {state === 'start' && <button onClick={start}>Start</button>}
      {state === 'playing' && (
        <div style={{ position: 'relative', height: '340px', marginTop: '1rem', border: '3px solid #2ec4b6' }}>
          <p style={{ margin: '0.6rem' }}>Hits: {hits}/{targetHits} • Time: {timeLeft}s</p>
          <button
            onClick={() => {
              setHits((value) => value + 1);
              setTarget(randomPosition());
            }}
            style={{ position: 'absolute', left: target.left, top: target.top, width: '58px', height: '58px', borderRadius: '50%' }}
          >
            Hit
          </button>
        </div>
      )}
      {state === 'win' && (
        <div>
          <p>You win. Hook your own rewards or story progression through the callback.</p>
          <button onClick={() => onComplete?.(true, { hits, timeLeft })}>Claim Reward</button>
        </div>
      )}
      {state === 'lose' && (
        <div>
          <p>Time is up.</p>
          <button onClick={start}>Retry</button>
        </div>
      )}
      <button className="secondary" style={{ marginTop: '1rem' }} onClick={onCancel}>
        Exit
      </button>
    </div>
  );
}
