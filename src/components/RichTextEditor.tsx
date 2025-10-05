import React, { useRef, useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Link2 as LinkIcon, X } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

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
  const [showImageUrlModal, setShowImageUrlModal] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append('image', file);

        try {
          const response = await fetch(`${API_BASE_URL}/forum/upload-image.php`, {
            method: 'POST',
            credentials: 'include',
            body: formData
          });

          const data = await response.json();

          if (data.success && data.url) {
            const quill = quillRef.current?.getEditor();
            if (quill) {
              const range = quill.getSelection();
              quill.insertEmbed(range?.index || 0, 'image', data.url);
            }
          } else {
            alert(data.message || 'Error al subir la imagen');
          }
        } catch (error) {
          console.error('Error uploading image:', error);
          alert('Error al subir la imagen');
        }
      }
    };
  };

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      const quill = quillRef.current?.getEditor();
      if (quill) {
        const range = quill.getSelection();
        quill.insertEmbed(range?.index || 0, 'image', imageUrl);
        setImageUrl('');
        setShowImageUrlModal(false);
      }
    }
  };

  const modules = useMemo(() => ({
    toolbar: readOnly ? false : {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image', 'video'],
        ['clean']
      ],
      handlers: {
        image: imageHandler
      }
    }
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
    <>
      <div className={`rich-text-editor ${readOnly ? 'readonly' : ''}`}>
        {!readOnly && (
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setShowImageUrlModal(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 rounded-lg text-blue-300 text-sm transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>Insertar imagen desde URL</span>
            </button>
          </div>
        )}
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

      {showImageUrlModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-blue-500/30 p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Insertar Imagen desde URL</h3>
              <button
                onClick={() => {
                  setShowImageUrlModal(false);
                  setImageUrl('');
                }}
                className="text-blue-300 hover:text-blue-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-blue-300 text-sm font-medium mb-2">
                  URL de la imagen
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/imagen.jpg"
                  className="w-full px-4 py-3 bg-slate-700/40 border border-blue-600/30 rounded-xl text-white placeholder-blue-300 focus:outline-none focus:border-blue-500 transition-colors"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      insertImageFromUrl();
                    }
                  }}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={insertImageFromUrl}
                  disabled={!imageUrl.trim()}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 rounded-xl text-white font-medium transition-colors"
                >
                  Insertar
                </button>
                <button
                  onClick={() => {
                    setShowImageUrlModal(false);
                    setImageUrl('');
                  }}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 rounded-xl text-white font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RichTextEditor;
