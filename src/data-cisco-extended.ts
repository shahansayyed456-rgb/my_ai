import { Question } from './types';

export const ciscoQuestionsExtended: Question[] = [];

for (let i = 1; i <= 75; i++) {
  ciscoQuestionsExtended.push({
    id: `cisex${i}`,
    category: 'Cisco Networking',
    question: `Cisco Networking Q${i}: In your Cisco Network Setup project, how did you handle subnetting and DHCP?`,
    answer: `I calculated subnets to optimize IP address allocation based on the number of required hosts per department. Then, I configured the Cisco router as a DHCP server, defining DHCP pools, excluding static IPs (like the router interface itself and servers), and setting the default router and DNS server for the clients.`,
    difficulty: i % 2 === 0 ? 'Intermediate' : 'Advanced'
  });
}
