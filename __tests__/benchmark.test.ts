/**
 * @jest-environment jsdom
 */
import { jest } from '@jest/globals';
import L from 'leaflet';

describe('Icon performance', () => {
  const iterations = 10000;

  test('benchmark icon creation vs reuse', () => {
    const startCreation = performance.now();
    for (let i = 0; i < iterations; i++) {
      L.divIcon({
        className: 'custom-chabeel-icon',
        html: `<div class="relative flex items-end justify-center group w-[60px] h-[60px]">
          <span class="material-symbols-outlined text-error text-[60px] leading-none drop-shadow-md group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1; display: block;">location_on</span>
        </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 60],
        popupAnchor: [0, -55]
      });
    }
    const endCreation = performance.now();
    const creationTime = endCreation - startCreation;

    const reusedIcon = L.divIcon({
      className: 'custom-chabeel-icon',
      html: `<div class="relative flex items-end justify-center group w-[60px] h-[60px]">
        <span class="material-symbols-outlined text-error text-[60px] leading-none drop-shadow-md group-hover:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1; display: block;">location_on</span>
      </div>`,
      iconSize: [60, 60],
      iconAnchor: [30, 60],
      popupAnchor: [0, -55]
    });

    const startReuse = performance.now();
    for (let i = 0; i < iterations; i++) {
      const icon = reusedIcon;
    }
    const endReuse = performance.now();
    const reuseTime = endReuse - startReuse;

    console.log(`Creation of ${iterations} icons took: ${creationTime.toFixed(4)}ms`);
    console.log(`Reusing icon ${iterations} times took: ${reuseTime.toFixed(4)}ms`);

    expect(reuseTime).toBeLessThan(creationTime);
  });
});
