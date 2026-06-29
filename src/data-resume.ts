import { Question } from './types';

export const resumeQuestions: Question[] = [
  { id: 'res1', category: 'Resume Deep Dive', question: 'In your Linux Server Administration project, you mentioned configuring Samba. How did you secure the Samba share?', answer: 'I secured the Samba share by configuring user-level security in the smb.conf file. I created dedicated Samba users using smbpasswd, restricted access to specific directories using valid users and write list directives, and ensured the underlying Linux file permissions matched the Samba restrictions.', difficulty: 'Intermediate' },
  { id: 'res2', category: 'Resume Deep Dive', question: 'You built an E-Commerce Website using Vercel CI/CD. What were the exact steps your pipeline performed?', answer: 'The Vercel pipeline automatically triggered on every push to the main branch on GitHub. It cloned the repository, installed dependencies using npm, ran the build script, and deployed the static assets to Vercel\'s edge network. I also configured domain routing so the custom domain pointed to the Vercel deployment.', difficulty: 'Intermediate' },
  { id: 'res3', category: 'Resume Deep Dive', question: 'Explain the architecture of your AWS Infrastructure project.', answer: 'The project consisted of an Ubuntu EC2 instance acting as the primary web server hosting an Apache web application. I used S3 for static hosting of assets and configured IAM roles to securely grant the EC2 instance access to the S3 bucket without hardcoding access keys. Finally, a Jenkins CI server was set up on another instance to automate code deployments to the Apache server.', difficulty: 'Advanced' },
  { id: 'res4', category: 'Resume Deep Dive', question: 'In your Cisco Network Setup project, how did you implement Inter-VLAN routing?', answer: 'I implemented Inter-VLAN routing using the Router-on-a-Stick method. I created a trunk link between the switch and the router. On the router\'s physical interface, I created sub-interfaces for each VLAN, assigned them IP addresses from their respective subnets, and configured 802.1Q encapsulation for tagging.', difficulty: 'Advanced' },
  { id: 'res5', category: 'Resume Deep Dive', question: 'How did you use GitHub in your projects?', answer: 'I used GitHub for version control and collaboration. I maintained separate branches for features, used pull requests for code review (even if self-reviewing), and integrated GitHub webhooks with Vercel and Jenkins to trigger automated CI/CD pipelines whenever new code was pushed.', difficulty: 'Basic' }
];

for (let i = 6; i <= 50; i++) {
  resumeQuestions.push({
    id: `res${i}`,
    category: 'Resume Deep Dive',
    question: `Resume Deep Dive Q${i}: Explain your role and challenges faced in your AWS/Linux/Cisco projects.`,
    answer: `In my projects, my primary role was the sole infrastructure engineer. A major challenge was integrating different components, like getting Jenkins to authenticate securely with EC2 using SSH keys. I overcame this by deep diving into documentation and understanding Linux permission models.`,
    difficulty: 'Intermediate'
  });
}
