import { QuizConfig } from './quiz-config';
import { Question } from './question';

export class Quiz {
    name: string;
    id: string;
    description: string;
    config?: QuizConfig;
    questions: Question[];
}
