export type PartId = 'arm' | 'gripper' | 'connector' | 'socket' | 'tester';

export const PARTS: { id: PartId; name: string; line: string }[] = [
  { id: 'arm', name: 'Arm', line: 'Six joints. Brings the connector down and feels the push back.' },
  { id: 'gripper', name: 'Gripper', line: 'Holds the connector straight on the way down.' },
  { id: 'connector', name: 'Connector', line: 'The part. Six or eight contacts.' },
  { id: 'socket', name: 'Socket', line: 'Where it goes. Shift it and watch what happens.' },
  { id: 'tester', name: 'Tester', line: 'Checks each contact after the arm tests the latch.' },
];
