import { Question } from './types';

export const linuxQuestionsExtended: Question[] = [];

for (let i = 1; i <= 75; i++) {
  linuxQuestionsExtended.push({
    id: `lex${i}`,
    category: 'Linux Administration',
    question: `Linux Server Admin Q${i}: Explain your approach to user/group management and LVM as mentioned in your resume.`,
    answer: `For user management, I use 'useradd' and 'usermod' to assign users to specific groups for RBAC. For storage, I use LVM by initializing physical volumes (pvcreate), grouping them into a volume group (vgcreate), and carving out logical volumes (lvcreate) which can be resized on the fly using lvextend and resize2fs.`,
    difficulty: i % 2 === 0 ? 'Intermediate' : 'Advanced'
  });
}
