import React from 'react';
import Svg, {Circle, Path, Polygon, Rect, Line, G} from 'react-native-svg';

export const CATEGORY_COLORS = {
  historia: '#607D8B',
  kuriosa: '#F57C00',
  kultur: '#8E24AA',
  arkitektur: '#1A73E8',
  personer: '#34A853',
};

const BODY_R = 12;
const SEP_R = 14.5;
const RING_R = 17;
const RING_COLORS = {
  nearby: '#E53935',
  bonus: '#F9A825',
  completed: '#43A047',
};

function HistoriaIcon() {
  return (
    <G>
      <Rect x="-4" y="-6.5" width="8" height="1.5" rx="0.4" fill="white"/>
      <Path d="M-4,-5 L4,-5 L1.5,-0.5 L-1.5,-0.5 Z" fill="white"/>
      <Path d="M-1.5,0.5 L1.5,0.5 L4,5 L-4,5 Z" fill="white"/>
      <Rect x="-4" y="5" width="8" height="1.5" rx="0.4" fill="white"/>
    </G>
  );
}

function KuriosaIcon() {
  return (
    <G>
      <Circle cx="-1" cy="-2" r="4" fill="none" stroke="white" strokeWidth="2"/>
      <Line x1="2" y1="1.5" x2="5.5" y2="5.5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </G>
  );
}

function KulturIcon() {
  return (
    <Polygon
      points="0,-6.5 1.5,-2 6.2,-2 2.5,0.6 3.8,5.2 0,2.6 -3.8,5.2 -2.5,0.6 -6.2,-2 -1.5,-2"
      fill="white"
    />
  );
}

function ArkitekturIcon() {
  return <Path d="M0,-6.5 L6.5,0 L5,0 L5,5.5 L-5,5.5 L-5,0 L-6.5,0 Z" fill="white"/>;
}

function PersonerIcon() {
  return (
    <G>
      <Circle cy="-3" r="2.8" fill="white"/>
      <Path d="M-5,5.5 C-5,0.5 -2.5,-0.5 0,-0.5 C2.5,-0.5 5,0.5 5,5.5 Z" fill="white"/>
    </G>
  );
}

function Checkmark() {
  return (
    <Path
      d="M-5,0 L-1.5,4 L5.5,-4"
      stroke="white"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function CategoryIcon({category}) {
  switch (category) {
    case 'historia':   return <HistoriaIcon/>;
    case 'kuriosa':    return <KuriosaIcon/>;
    case 'kultur':     return <KulturIcon/>;
    case 'arkitektur': return <ArkitekturIcon/>;
    case 'personer':   return <PersonerIcon/>;
    default:           return <Circle r="4" fill="white"/>;
  }
}

export default function MarkerPin({category, status = 'far'}) {
  const bodyColor = CATEGORY_COLORS[category] || '#607D8B';
  const hasRing = status !== 'far';
  const ringColor = RING_COLORS[status];
  const pad = 3;
  const outerR = hasRing ? RING_R : BODY_R;
  const size = (outerR + pad) * 2;
  const half = outerR + pad;

  return (
    <Svg width={size} height={size} viewBox={`${-half} ${-half} ${size} ${size}`}>
      {hasRing && <Circle r={RING_R} fill={ringColor}/>}
      {hasRing && <Circle r={SEP_R} fill="white"/>}
      <Circle
        r={BODY_R}
        fill={bodyColor}
        stroke={hasRing ? 'none' : 'white'}
        strokeWidth={2}
      />
      {status === 'completed' ? <Checkmark/> : <CategoryIcon category={category}/>}
    </Svg>
  );
}
