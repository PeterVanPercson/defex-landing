export type PartId = 'gantry' | 'carriage' | 'zaxis' | 'gripper' | 'connector' | 'socket' | 'tester';

export const PARTS: { id: PartId; name: string; line: string }[] = [
  { id: 'gantry', name: 'Gantry', line: 'The frame. Carries the robot over the part.' },
  { id: 'carriage', name: 'Carriage', line: 'Moves the tool left, right, in and out.' },
  { id: 'zaxis', name: 'Z axis', line: 'Lowers the connector and feels the push back.' },
  { id: 'gripper', name: 'Gripper', line: 'Holds the connector straight on the way down.' },
  { id: 'connector', name: 'Connector', line: 'The part. Six or eight contacts.' },
  { id: 'socket', name: 'Socket', line: 'Where it goes. Shift it and watch what happens.' },
  { id: 'tester', name: 'Tester', line: 'Checks the connection, then pulls on the lock.' },
];
