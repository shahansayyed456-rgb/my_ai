import { Question } from './types';

export const awsQuestionsExtended: Question[] = [];

for (let i = 1; i <= 75; i++) {
  awsQuestionsExtended.push({
    id: `awsex${i}`,
    category: 'AWS Cloud',
    question: `AWS Cloud Q${i}: Based on your AWS Infrastructure project, how do you secure an EC2 instance hosting an Apache server?`,
    answer: `I secure the EC2 instance by configuring Security Groups to only allow inbound HTTP/HTTPS (ports 80/443) from the internet and SSH (port 22) only from my specific IP address. I also assign an IAM role to the instance for AWS service access (like S3) instead of storing access keys on the server.`,
    difficulty: i % 2 === 0 ? 'Intermediate' : 'Advanced'
  });
}
