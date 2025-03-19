import React from 'react';
import { Editor } from '@tiptap/react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import QuestionButton from './QuestionButton';

interface ToolbarProps {
  editor: Editor | null;
  onGenerateExplanation: () => void;
  isGenerating: boolean;
  activeTab: 'notes' | 'explanation';
  setActiveTab: (tab: 'notes' | 'explanation') => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  onGenerateExplanation,
  isGenerating,
  activeTab,
  setActiveTab,
}) => {
  if (!editor) return null;

  return (
    <div className="border-t border-gray-200">
      <div className="flex items-center px-4 py-1" style={{ backgroundColor: 'rgb(225, 225, 225)' }}>
        <div className="flex-1 flex items-center space-x-2">
          <select
            onChange={e => {
              const value = e.target.value;
              if (value === 'normal') {
                editor.chain().focus().setParagraph().run();
              } else {
                editor.chain().focus().toggleHeading({ level: parseInt(value) }).run();
              }
            }}
            value={
              editor.isActive('heading', { level: 1 })
                ? '1'
                : editor.isActive('heading', { level: 2 })
                ? '2'
                : editor.isActive('heading', { level: 3 })
                ? '3'
                : 'normal'
            }
            className="h-8 px-2 rounded border border-gray-300"
          >
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
            <option value="normal">Normal</option>
          </select>

          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            B
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            style={{ fontStyle: 'italic' }}
          >
            I
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded ${editor.isActive('underline') ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
            style={{ textDecoration: 'underline' }}
          >
            U
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded ${
              editor.isActive('orderedList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
          >
            1.
          </button>

          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded ${
              editor.isActive('bulletList') ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
          >
            •
          </button>

          <div className="flex items-center space-x-1 border border-gray-300 rounded">
            <button
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              className={`p-1.5 ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align left"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              className={`p-1.5 ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align center"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              className={`p-1.5 ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              title="Align right"
            >
              <AlignRight className="w-4 h-4" />
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200 mx-2" />
          
          <QuestionButton
            onGenerateExplanation={onGenerateExplanation}
            disabled={isGenerating}
          />
        </div>

        <div className="flex space-x-4 ml-4">
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-1 px-3 rounded-md text-sm font-medium ${
              activeTab === 'notes'
                ? 'bg-[#F0F0F0] text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('explanation')}
            className={`py-1 px-3 rounded-md text-sm font-medium ${
              activeTab === 'explanation'
                ? 'bg-[#F0F0F0] text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Explanation
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;