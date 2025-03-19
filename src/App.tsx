import React, { useState, useCallback, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import Document from '@tiptap/extension-document';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Heading from '@tiptap/extension-heading';
import TextAlign from '@tiptap/extension-text-align';
import {
  ChevronLeft,
  Star,
  Share2,
  Lock,
  History,
  Save,
  CheckCircle2,
  Download,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
import * as NotesAPI from './api';
import { ConceptExtension } from './extensions/ConceptExtension';
import Toolbar from './components/Toolbar';

interface Concept {
  text: string;
  explanation: string;
  tag: string;
  from: number;
  to: number;
}

const App: React.FC = () => {
  const [title, setTitle] = useState('Untitled Document');
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [activeTab, setActiveTab] = useState<'notes' | 'explanation'>('notes');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isNotificationExiting, setIsNotificationExiting] = useState(false);
  const [lastGeneratedText, setLastGeneratedText] = useState('');
  const userId = "3"; // Hardcoded for demo
  const filename = "Untitled.md"; // Hardcoded for demo

  const editor = useEditor({
    extensions: [
      Document,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
      BulletList,
      OrderedList,
      ListItem,
      Heading.configure({
        levels: [1, 2, 3],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      ConceptExtension.configure({
        HTMLAttributes: {
          class: 'concept-mark',
        },
      }),
    ],
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const marks = editor.state.doc.rangeHasMark(from, to, editor.schema.marks.concept);
      
      if (marks) {
        const node = editor.state.doc.nodeAt(from);
        if (node) {
          const mark = node.marks.find(m => m.type.name === 'concept');
          if (mark) {
            const concept = concepts.find(c => c.tag === mark.attrs.tag);
            if (concept?.explanation) {
              setSelectedConcept(concept);
              setActiveTab('explanation');
            }
          }
        }
      }
    },
  });

  // Helper function to strip HTML tags
  const stripHtml = (html: string) => {
    return html.replace(/<[^>]*>/g, '');
  };

  const handleDownloadPDF = async () => {
    if (!editor) return;
    
    const element = document.createElement('div');
    element.innerHTML = editor.getHTML();
    element.className = 'pdf-content';
    
    const opt = {
      margin: 1,
      filename: `${title}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    
    await html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    const loadContent = async () => {
      const response = await NotesAPI.getFileInfo(userId, filename);
      if (response.success && response.content && editor) {
        const conceptRegex = /<Concept><(\w+)>(.*?)<\/\1><\/Concept>/g;
        let match;
        const newConcepts: Concept[] = [];
        let processedContent = response.content;
        
        // Create a stripped version of content for position calculation
        const strippedContent = stripHtml(response.content);
        
        // Find all concepts and calculate their positions in stripped content
        while ((match = conceptRegex.exec(response.content)) !== null) {
          const [fullMatch, tag, text] = match;
          
          // Find the real position in stripped content
          const beforeMatch = stripHtml(response.content.substring(0, match.index));
          const startPos = beforeMatch.length;
          const endPos = startPos + text.length;
          
          newConcepts.push({
            text,
            tag,
            explanation: '',
            from: startPos,
            to: endPos,
          });
        }

        // Replace all concept tags with their text content
        processedContent = processedContent.replace(conceptRegex, '$2');

        // Set the processed content in the editor
        editor.commands.setContent(processedContent);

        // Apply concept marks
        requestAnimationFrame(() => {
          const doc = editor.state.doc;
          let textPos = 0;
          
          doc.descendants((node, pos) => {
            if (node.isText) {
              const text = node.text || '';
              newConcepts.forEach(concept => {
                const conceptStart = concept.from;
                const conceptEnd = concept.to;
                
                if (conceptStart >= textPos && conceptEnd <= textPos + text.length) {
                  const from = pos + (conceptStart - textPos);
                  const to = pos + (conceptEnd - textPos);
                  
                  editor
                    .chain()
                    .setTextSelection({ from, to })
                    .setConcept({ tag: concept.tag })
                    .run();
                }
              });
              textPos += text.length;
            }
            return true;
          });

          // Reset selection
          editor.commands.setTextSelection(0);
        });

        // Get explanations for existing concepts
        const explanationsResponse = await NotesAPI.getExplanationsPerConcept(userId, filename);
        if (explanationsResponse.success) {
          const conceptsWithExplanations = newConcepts.map(concept => ({
            ...concept,
            explanation: explanationsResponse.explanations.find(exp => exp.tag === concept.tag)?.explanation || '',
          }));
          setConcepts(conceptsWithExplanations);
        } else {
          setConcepts(newConcepts);
        }
      }
    };

    if (editor) {
      loadContent();
    }
  }, [editor]);

  // Autosave functionality
  useEffect(() => {
    if (!editor) return;

    // Set up autosave timer (every 2 minutes)
    const autoSaveInterval = setInterval(() => {
      handleSave();
    }, 2 * 60 * 1000);

    return () => {
      clearInterval(autoSaveInterval);
    };
  }, [editor]);

  const handleGenerateExplanation = async () => {
    if (!editor) return;

    const { from, to } = editor.state.selection;
    if (from === to) return;

    const selectedText = editor.state.doc.textBetween(from, to);
    setIsGenerating(true);
    setLastGeneratedText(selectedText);

    // Apply temporary styling
    editor.chain().focus().setConcept().run();

    const response = await NotesAPI.generateConceptExplanation(
      userId,
      filename,
      selectedText
    );

    if (response.success) {
      const newConcept: Concept = {
        text: selectedText,
        explanation: response.explanation,
        tag: response.tag,
        from,
        to,
      };

      // Update the mark with the concept tag
      editor
        .chain()
        .setTextSelection({ from, to })
        .setConcept({ tag: response.tag })
        .run();

      setConcepts(prev => [...prev, newConcept]);
      setSelectedConcept(newConcept);
      
      // Show success notification with animation
      setIsNotificationExiting(false);
      setShowSuccess(true);
      
      // Handle notification exit animation
      setTimeout(() => {
        setIsNotificationExiting(true);
        setTimeout(() => {
          setShowSuccess(false);
          setIsNotificationExiting(false);
        }, 300); // Match animation duration
      }, 2700); // Show for 2.7s before starting exit animation

      // Autosave after explanation generation
      setTimeout(() => {
        handleSave();
      }, 3000);
    }
    
    setIsGenerating(false);
  };

  const handleSave = async () => {
    if (!editor) return;
    
    setIsSaving(true);
    try {
      const content = editor.getHTML();
      
      // Convert the content to the required format with concept tags
      let finalContent = content;
      concepts.forEach(concept => {
        const conceptRegex = new RegExp(
          `<span[^>]*data-concept-tag="${concept.tag}"[^>]*>(.*?)</span>`,
          'g'
        );
        finalContent = finalContent.replace(
          conceptRegex,
          `<Concept><${concept.tag}>$1</${concept.tag}></Concept>`
        );
      });

      const response = await NotesAPI.saveFile(userId, filename, finalContent);
      if (response.success) {
        const saveButton = document.getElementById('save-button');
        if (saveButton) {
          saveButton.classList.add('bg-green-500');
          setTimeout(() => {
            saveButton.classList.remove('bg-green-500');
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Error saving:', error);
    }
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(238, 238, 238)' }}>
      {/* Success Notification */}
      {showSuccess && (
        <div className={`fixed bottom-4 right-4 bg-[#EEEEEE] text-gray-800 px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 z-50 ${isNotificationExiting ? 'notification-exit' : 'notification-enter'}`}>
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div>
            <p className="font-medium">Explanation generated successfully!</p>
            <p className="text-sm text-gray-600 mt-0.5">"{lastGeneratedText}"</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b z-50">
        <div className="flex items-center justify-between px-4 h-16" style={{ backgroundColor: 'rgb(238, 238, 238)' }}>
          <div className="flex items-center space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium text-gray-900 border-0 focus:ring-0 focus:outline-none bg-transparent"
                placeholder="Untitled"
              />
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Star className="w-4 h-4" />
                <span>Starred</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadPDF}
              className="p-2 hover:bg-gray-100 rounded-full"
              title="Download as PDF"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              id="save-button"
              onClick={handleSave}
              disabled={isSaving}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
            >
              <Save className={`w-5 h-5 ${isSaving ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <History className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Share2 className="w-5 h-5 text-gray-600" />
            </button>
            <button className="flex items-center px-4 py-2 bg-[#F0F0F0] text-gray-600 rounded-full hover:bg-gray-200">
              <Lock className="w-4 h-4 mr-2" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <Toolbar
          editor={editor}
          onGenerateExplanation={handleGenerateExplanation}
          isGenerating={isGenerating}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>

      {/* Main Content */}
      <div className="pt-32">
        {activeTab === 'notes' ? (
          <div className="max-w-4xl mx-auto bg-white shadow-sm min-h-[calc(100vh-10rem)]">
            <EditorContent
              editor={editor}
              className="min-h-[calc(100vh-10rem)] prose max-w-none"
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {selectedConcept ? (
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {selectedConcept.text}
                  <span className="text-sm font-normal text-gray-500 ml-2">Tag: {selectedConcept.tag}</span>
                </h2>
                <div className="prose prose-lg max-w-none">
                  <div className="text-gray-600 whitespace-pre-wrap">{selectedConcept.explanation}</div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-sm text-center">
                <p className="text-gray-500">Select text and generate an explanation to view it here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;