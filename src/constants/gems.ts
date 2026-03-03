export interface GemConfig {
  name: string;
  gradient: string;
  shadow: string;
  highlight: string;
  glow: string;
}

export const GEM_CONFIG: GemConfig[] = [
  {
    name: '루비',
    gradient: 'linear-gradient(135deg, #FF5252 0%, #FF1744 50%, #D50000 100%)',
    shadow: '#8B0000',
    highlight: 'rgba(255,150,150,0.9)',
    glow: 'rgba(255,23,68,0.6)',
  },
  {
    name: '사파이어',
    gradient: 'linear-gradient(135deg, #82B1FF 0%, #2979FF 50%, #2962FF 100%)',
    shadow: '#1a3a8a',
    highlight: 'rgba(180,210,255,0.9)',
    glow: 'rgba(41,121,255,0.6)',
  },
  {
    name: '에메랄드',
    gradient: 'linear-gradient(135deg, #B9F6CA 0%, #00E676 50%, #00C853 100%)',
    shadow: '#005a2b',
    highlight: 'rgba(200,255,220,0.9)',
    glow: 'rgba(0,230,118,0.6)',
  },
  {
    name: '토파즈',
    gradient: 'linear-gradient(135deg, #FFE57F 0%, #FFC400 50%, #FFAB00 100%)',
    shadow: '#8a6200',
    highlight: 'rgba(255,240,160,0.9)',
    glow: 'rgba(255,196,0,0.6)',
  },
  {
    name: '자수정',
    gradient: 'linear-gradient(135deg, #EA80FC 0%, #D500F9 50%, #AA00FF 100%)',
    shadow: '#5a0080',
    highlight: 'rgba(240,160,255,0.9)',
    glow: 'rgba(213,0,249,0.6)',
  },
  {
    name: '다이아몬드',
    gradient: 'linear-gradient(135deg, #84FFFF 0%, #00E5FF 50%, #00B8D4 100%)',
    shadow: '#006080',
    highlight: 'rgba(180,255,255,0.9)',
    glow: 'rgba(0,229,255,0.6)',
  },
  {
    name: '앰버',
    gradient: 'linear-gradient(135deg, #FFCC80 0%, #FF6F00 50%, #E65100 100%)',
    shadow: '#7a2900',
    highlight: 'rgba(255,210,150,0.9)',
    glow: 'rgba(255,111,0,0.6)',
  },
];
