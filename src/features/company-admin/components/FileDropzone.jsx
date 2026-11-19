import { useState } from 'react';

export function FileDropzone({ onFileSelected, inputRef }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) {
      onFileSelected(selected);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  };

  return (
    <div className="import-field-group">
      <span className="import-field-label" id="file-dropzone-label">
        File
      </span>
      <div
        className={`import-dropzone${isDragging ? ' is-dragging' : ''}`}
        tabIndex={0}
        role="button"
        aria-labelledby="file-dropzone-label"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={handleKeyDown}
        onClick={() => inputRef.current?.click()}
      >
        <p className="import-dropzone__main-text">Drop a CSV file here</p>
        <p className="import-dropzone__sub-text">or choose a file from your computer</p>
        <button
          type="button"
          className="import-dropzone__choose-btn"
          onClick={(e) => {
            e.stopPropagation();
            inputRef.current?.click();
          }}
        >
          Choose file
        </button>
      </div>
    </div>
  );
}
