import React from 'react';
import { HelpCircle } from 'lucide-react';

interface QuestionButtonProps {
  onGenerateExplanation: () => void;
  disabled: boolean;
}

const QuestionButton: React.FC<QuestionButtonProps> = ({ onGenerateExplanation, disabled }) => {
  return (
    <button
      onClick={onGenerateExplanation}
      disabled={disabled}
      className="question-button p-1.5 rounded hover:bg-gray-200 transition-colors"
      title="Generate explanation for selected text"
    >
      <HelpCircle className={`w-5 h-5 text-gray-600 ${disabled ? 'opacity-50' : ''}`} />
    </button>
  );
};

export default QuestionButton;