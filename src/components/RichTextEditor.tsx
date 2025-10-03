import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe aquí...',
  readOnly = false
}) => {
  const quillRef = useRef<ReactQuill>(null);

  const modules = useMemo(() => ({
    toolbar: readOnly ? false : [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      ['clean']
    ]
  }), [readOnly]);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'color', 'background',
    'blockquote', 'code-block',
    'link', 'image', 'video'
  ];

  return (
    <div className={`rich-text-editor ${readOnly ? 'readonly' : ''}`}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />
      <style>{`
        .rich-text-editor .ql-toolbar {
          background: rgba(51, 65, 85, 0.4);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-radius: 0.75rem 0.75rem 0 0;
        }

        .rich-text-editor .ql-container {
          background: rgba(51, 65, 85, 0.4);
          border: 1px solid rgba(59, 130, 246, 0.3);
          border-top: none;
          border-radius: 0 0 0.75rem 0.75rem;
          font-size: 1rem;
          min-height: 200px;
        }

        .rich-text-editor .ql-editor {
          color: #e0f2fe;
          min-height: 200px;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #93c5fd;
          font-style: normal;
        }

        .rich-text-editor .ql-stroke {
          stroke: #93c5fd;
        }

        .rich-text-editor .ql-fill {
          fill: #93c5fd;
        }

        .rich-text-editor .ql-picker-label {
          color: #93c5fd;
        }

        .rich-text-editor .ql-picker-options {
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(59, 130, 246, 0.3);
        }

        .rich-text-editor .ql-picker-item:hover {
          background: rgba(59, 130, 246, 0.2);
          color: #ffffff;
        }

        .rich-text-editor .ql-active {
          color: #60a5fa !important;
        }

        .rich-text-editor .ql-active .ql-stroke {
          stroke: #60a5fa !important;
        }

        .rich-text-editor .ql-active .ql-fill {
          fill: #60a5fa !important;
        }

        .rich-text-editor.readonly .ql-container {
          border: none;
          background: transparent;
        }

        .rich-text-editor.readonly .ql-editor {
          padding: 0;
        }

        .rich-text-editor .ql-editor a {
          color: #60a5fa;
          text-decoration: underline;
        }

        .rich-text-editor .ql-editor img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }

        .rich-text-editor .ql-editor blockquote {
          border-left: 4px solid #60a5fa;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          color: #bfdbfe;
        }

        .rich-text-editor .ql-editor code,
        .rich-text-editor .ql-editor pre {
          background: rgba(30, 41, 59, 0.6);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0.25rem;
          padding: 0.25rem 0.5rem;
          color: #fde047;
          font-family: 'Courier New', monospace;
        }

        .rich-text-editor .ql-editor pre {
          padding: 1rem;
          margin: 1rem 0;
        }

        .rich-text-editor .ql-editor ul,
        .rich-text-editor .ql-editor ol {
          padding-left: 1.5rem;
          margin: 0.5rem 0;
        }

        .rich-text-editor .ql-editor li {
          margin: 0.25rem 0;
        }

        .rich-text-editor .ql-toolbar button:hover {
          color: #60a5fa !important;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #60a5fa !important;
        }

        .rich-text-editor .ql-toolbar button:hover .ql-fill {
          fill: #60a5fa !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
