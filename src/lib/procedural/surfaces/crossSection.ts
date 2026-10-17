import * as THREE from 'three';

export type CrossSectionProfile = 'ellipse' | 'roundedRectangle';

export interface CrossSection {
  center: THREE.Vector3;
  depth: number;
  orientation?: THREE.Quaternion;
  profile: CrossSectionProfile;
  segments: number;
  width: number;
}

export function createCrossSectionRing(section: CrossSection): THREE.Vector3[] {
  const count = Math.max(8, section.segments);
  const halfWidth = section.width / 2;
  const halfDepth = section.depth / 2;

  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    let pt: THREE.Vector3;
    if (section.profile === 'roundedRectangle') {
      pt = new THREE.Vector3(
        Math.sign(cos) * halfWidth * Math.pow(Math.abs(cos), 0.55),
        0,
        Math.sign(sin) * halfDepth * Math.pow(Math.abs(sin), 0.55),
      );
    } else {
      pt = new THREE.Vector3(
        cos * halfWidth,
        0,
        sin * halfDepth,
      );
    }

    if (section.orientation) {
      pt.applyQuaternion(section.orientation);
    }

    return pt.add(section.center);
  });
}
