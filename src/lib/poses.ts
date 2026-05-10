import { Object3D } from 'three';
import { Pose, PoseCategory } from './types';

export const POSES: Pose[] = [
  {
    id: 'standing-default',
    name: 'Standing Natural',
    category: 'standing',
    tags: ['natural', 'standing'],
    rotations: [
      { boneName: 'upper_arm_L', rotation: [0, 0, 15] },
      { boneName: 'upper_arm_R', rotation: [0, 0, -15] },
      { boneName: 'lower_arm_L', rotation: [0, 10, 0] },
      { boneName: 'lower_arm_R', rotation: [0, -10, 0] },
      { boneName: 'thigh_L', rotation: [0, 0, 2] },
      { boneName: 'thigh_R', rotation: [0, 0, -2] },
      { boneName: 'neck', rotation: [5, 0, 0] },
    ],
  },
  {
    id: 't-pose',
    name: 'T-Pose',
    category: 'custom',
    tags: ['t-pose', 'default'],
    rotations: [
      { boneName: 'upper_arm_L', rotation: [0, 0, 90] },
      { boneName: 'upper_arm_R', rotation: [0, 0, -90] },
      { boneName: 'lower_arm_L', rotation: [0, 0, 0] },
      { boneName: 'lower_arm_R', rotation: [0, 0, 0] },
    ],
  },
];

export function getAllPoses(): Pose[] {
  return POSES;
}

export function getPosesByCategory(category: PoseCategory | 'all'): Pose[] {
  if (category === 'all') return POSES;
  return POSES.filter(p => p.category === category);
}

export function getPose(id: string): Pose | undefined {
  return POSES.find(p => p.id === id) || POSES[0];
}

export function applyPose(model: Object3D, pose: Pose) {
  if (!pose || !pose.rotations) return;

  pose.rotations.forEach(({ boneName, rotation }) => {
    const bone = model.getObjectByName(boneName);
    if (bone) {
      bone.rotation.set(
        (rotation[0] * Math.PI) / 180,
        (rotation[1] * Math.PI) / 180,
        (rotation[2] * Math.PI) / 180
      );
    }
  });
}
