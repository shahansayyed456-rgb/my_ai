import { Question } from './types';

export const devopsQuestionsExtended: Question[] = [];

for (let i = 1; i <= 75; i++) {
  devopsQuestionsExtended.push({
    id: `devex${i}`,
    category: 'DevOps & CI/CD',
    question: `DevOps Q${i}: Explain your experience with Jenkins and GitHub integration as mentioned in your resume.`,
    answer: `I connected Jenkins to my GitHub repository using the GitHub plugin and a webhook. Whenever code is pushed to the main branch, GitHub sends a payload to Jenkins, triggering a build pipeline. The pipeline pulls the latest code, runs necessary tests, and deplaves it to the target Linux server using SSH.`,
    difficulty: i % 2 === 0 ? 'Intermediate' : 'Advanced'
  });
}
