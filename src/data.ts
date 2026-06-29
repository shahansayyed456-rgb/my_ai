import { Question } from './types';
import { linuxQuestions } from './data-linux';
import { awsQuestions } from './data-aws';
import { ciscoQuestions } from './data-cisco';
import { devopsQuestions } from './data-devops';
import { webQuestions } from './data-web';
import { scenarioQuestions } from './data-scenarios';
import { hrQuestions } from './data-hr';
import { resumeQuestions } from './data-resume';
import { linuxQuestionsExtended } from './data-linux-extended';
import { awsQuestionsExtended } from './data-aws-extended';
import { ciscoQuestionsExtended } from './data-cisco-extended';
import { devopsQuestionsExtended } from './data-devops-extended';

export const interviewQuestions: Question[] = [
  ...hrQuestions,
  ...resumeQuestions,
  ...linuxQuestions,
  ...linuxQuestionsExtended,
  ...awsQuestions,
  ...awsQuestionsExtended,
  ...ciscoQuestions,
  ...ciscoQuestionsExtended,
  ...devopsQuestions,
  ...devopsQuestionsExtended,
  ...webQuestions,
  ...scenarioQuestions
];


