import { NextResponse } from 'next/server';

import { signCaptchaAnswer } from '@/lib/auth/session';

function createAnswer() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function createSvg(answer: string) {
  const chars = answer
    .split('')
    .map((char, index) => {
      const x = 22 + index * 24;
      const y = 38 + (index % 2 === 0 ? -3 : 4);
      const rotate = index % 2 === 0 ? -8 : 7;

      return `<text x="${x}" y="${y}" transform="rotate(${rotate} ${x} ${y})">${char}</text>`;
    })
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="56" viewBox="0 0 160 56" role="img" aria-label="Captcha code">
    <rect width="160" height="56" rx="12" fill="#020617"/>
    <path d="M8 18 C38 2, 68 48, 102 18 S132 12, 152 34" fill="none" stroke="#38bdf8" stroke-width="2" opacity=".55"/>
    <path d="M8 40 C42 26, 82 54, 152 16" fill="none" stroke="#f8fafc" stroke-width="1.5" opacity=".25"/>
    <g fill="#e0f2fe" font-family="monospace" font-size="28" font-weight="700" letter-spacing="4">${chars}</g>
    <g stroke="#64748b" stroke-width="1" opacity=".35">
      <line x1="18" y1="9" x2="147" y2="48"/>
      <line x1="6" y1="32" x2="154" y2="22"/>
    </g>
  </svg>`;
}

export async function GET() {
  const answer = createAnswer();

  return NextResponse.json({
    token: await signCaptchaAnswer(answer),
    image: `data:image/svg+xml;base64,${Buffer.from(createSvg(answer)).toString(
      'base64'
    )}`,
  });
}
