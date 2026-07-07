/**
 * Audio System - BGM, SFX, ambience
 */

class AudioSystem {
  constructor() {
    this._ctx = null;
    this._bgm = null;
    this._bgmGain = null;
    this._sfxGain = null;
    this._muted = false;
    this._musicVolume = 0.5;
    this._sfxVolume = 0.7;
    this._currentTrack = null;
  }
  
  get ctx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._bgmGain = this._ctx.createGain();
      this._bgmGain.connect(this._ctx.destination);
      this._bgmGain.gain.value = this._musicVolume;
      this._sfxGain = this._ctx.createGain();
      this._sfxGain.connect(this._ctx.destination);
      this._sfxGain.gain.value = this._sfxVolume;
    }
    return this._ctx;
  }
  
  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }
  
  setMusicVolume(v) {
    this._musicVolume = v;
    if (this._bgmGain) this._bgmGain.gain.value = v;
  }
  
  setSfxVolume(v) {
    this._sfxVolume = v;
    if (this._sfxGain) this._sfxGain.gain.value = v;
  }
  
  setMuted(muted) {
    this._muted = muted;
    if (this._bgmGain) this._bgmGain.gain.value = muted ? 0 : this._musicVolume;
    if (this._sfxGain) this._sfxGain.gain.value = muted ? 0 : this._sfxVolume;
  }
  
  async playBGM(url) {
    if (this._currentTrack === url && this._bgm) return;
    this.stopBGM();
    
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(buf);
      
      this._bgm = this.ctx.createBufferSource();
      this._bgm.buffer = audioBuffer;
      this._bgm.loop = true;
      this._bgm.connect(this._bgmGain);
      this._bgm.start(0);
      this._currentTrack = url;
    } catch (e) {
      console.warn('Audio: Failed to load BGM', url, e);
    }
  }
  
  stopBGM() {
    if (this._bgm) {
      try { this._bgm.stop(); } catch (e) { /* ignore */ }
      this._bgm.disconnect();
      this._bgm = null;
    }
    this._currentTrack = null;
  }
  
  async playSFX(url) {
    try {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(buf);
      const src = this.ctx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(this._sfxGain);
      src.start(0);
    } catch (e) {
      console.warn('Audio: Failed to play SFX', url, e);
    }
  }
}

const audio = new AudioSystem();
export default audio;
