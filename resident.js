import {hamster} from './art.js?v=be6f9a6a74417ecf';
// Character seam: new approved designs replace this renderer; behavior IDs and furniture stay stable.
export function resident(action='idle'){
 if(action==='ghost')return '<svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M27 49Q15 24 35 24l11 10q16-7 28 0l10-10q21 0 9 26q17 27 1 59l-15-10-13 10-14-10-13 10q-22-20-12-60Z" fill="#FFF7E6" stroke="#B8B2AD" stroke-width="3"/><path d="M42 62h1m32 0h1m-22 15q6 6 12 0" stroke="#8E7B79" stroke-width="4" stroke-linecap="round"/><ellipse cx="34" cy="76" rx="7" ry="4" fill="#EEC6BF"/><ellipse cx="87" cy="76" rx="7" ry="4" fill="#EEC6BF"/></svg>';
 const svg=hamster(action==='sulk'?'hesitate':action==='sleep'||action==='rest'?'rest':action==='tea'?'carry':'normal');
 const prop=action==='read'?'<path class="resident-book" d="M28 84Q43 74 60 83Q77 74 92 84v21Q76 96 60 105Q43 96 28 105Z" fill="#ABBFAB" stroke="#536856" stroke-width="2"/><path d="M60 83v22m-23-16 15-2m16 0 14 2" fill="none" stroke="#F9F0D5" stroke-width="2"/>':action==='tea'?'<ellipse cx="60" cy="88" rx="14" ry="7" fill="#EBCB86" stroke="#82613F"/><path d="M55 82q-7-8 0-14" stroke="#FFF4DF" stroke-width="3" fill="none"/>':action==='sleep'?'<text class="resident-zzz" x="85" y="32" fill="#927783" font-size="16">z</text>':'';
 return svg.replace('<svg ',`<svg class="resident resident-${action}" `).replace('</svg>',prop+'</svg>');
}
