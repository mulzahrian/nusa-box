import { useEffect, useState } from 'react';
import { useUIStore } from '../store/uiStore';
import './CutsceneSystem.css';

export default function CutsceneSystem({ data, onComplete }) {
  const cutscene = useUIStore((state) => state.cutsceneData) ?? data;
  const visible = useUIStore((state) => state.showCutscene) || Boolean(data);
  const setCutsceneData = useUIStore((state) => state.setCutsceneData);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [letterCount, setLetterCount] = useState(0);

  useEffect(() => {
    setSceneIndex(0);
    setLetterCount(0);
  }, [cutscene]);

  const currentScene = cutscene?.scenes?.[sceneIndex];

  useEffect(() => {
    if (!currentScene?.text || !visible) {
      return undefined;
    }
    setLetterCount(0);
    const timer = window.setInterval(() => {
      setLetterCount((value) => Math.min(value + 1, currentScene.text.length));
    }, 22);
    return () => window.clearInterval(timer);
  }, [currentScene, visible]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === 'Space') {
        event.preventDefault();
        handleAdvance();
      }
    };
    if (visible) {
      window.addEventListener('keydown', onKeyDown);
    }
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (!visible || !currentScene) {
    return null;
  }

  const fullTextVisible = letterCount >= currentScene.text.length;
  const displayedText = currentScene.text.slice(0, letterCount);

  const close = () => {
    if (!data) {
      setCutsceneData(null);
    }
    onComplete?.();
  };

  const goToScene = (nextIndex) => {
    if (nextIndex >= cutscene.scenes.length) {
      close();
      return;
    }
    setSceneIndex(nextIndex);
  };

  const handleAdvance = () => {
    if (!fullTextVisible) {
      setLetterCount(currentScene.text.length);
      return;
    }
    if (currentScene.choices?.length) {
      return;
    }
    goToScene(sceneIndex + 1);
  };

  return (
    <div className="cutscene-system" onClick={handleAdvance} role="presentation">
      <div
        className="cutscene-system__bg"
        style={currentScene.background ? { backgroundImage: `linear-gradient(180deg, rgba(10,18,34,.3), rgba(5,8,18,.88)), url(${currentScene.background})` } : undefined}
      />
      <div className="cutscene-system__stage">
        <div className={`cutscene-system__character ${currentScene.position ?? 'left'}`}>
          {currentScene.characterImage ? <img alt={currentScene.character} src={currentScene.characterImage} /> : <div>{currentScene.character}</div>}
        </div>
        <div className="cutscene-system__dialogue" onClick={(event) => event.stopPropagation()} role="presentation">
          <h2>{currentScene.character}</h2>
          <p>{displayedText}</p>
          {fullTextVisible && currentScene.choices?.length ? (
            <div className="cutscene-system__choices">
              {currentScene.choices.map((choice) => (
                <button key={choice.label} onClick={() => goToScene(choice.nextSceneIndex ?? sceneIndex + 1)}>
                  {choice.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="cutscene-system__hint">Click or press Space to continue.</div>
          )}
        </div>
      </div>
    </div>
  );
}
