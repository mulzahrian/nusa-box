const easterEggConfig = [
  {
    id: 'sumatra-ufo',
    name: 'Midnight UFO',
    type: 'ufo',
    modelPath: '/model/easterEggs/ufo.glb',
    color: '#9bf6ff',
    areaKey: 'mountain',
    condition: { startHour: 1, endHour: 2 },
    behavior: { pattern: 'circle', radius: 14, speed: 0.3, height: 10 },
  },
  {
    id: 'sumatra-ghost',
    name: 'Forest Ghost',
    type: 'ghost',
    modelPath: '/model/easterEggs/ghost.glb',
    color: '#dbe4ff',
    areaKey: 'forest',
    condition: { phases: ['malam', 'tengahMalam'] },
    behavior: { pattern: 'hover', radius: 8, speed: 0.85, height: 3.2 },
  },
];

export default easterEggConfig;
