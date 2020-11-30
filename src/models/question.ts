import {Option} from './option';

export class Question {
  name: string;
  questionTypeId: number;
  options: Option[];
  answered: boolean;
}
