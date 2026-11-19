import { useState, useEffect } from 'react';
import { TextField } from '../../../shared/components/TextField.jsx';
import { Button } from '../../../shared/components/Button.jsx';
import { companyDataInsertRequestSchema } from '../../../api/v1/schemas/company.schema.js';
import { useAddCompanyRecord } from '../hooks/useAddCompanyRecord.js';
import { mapAddRecordError } from '../mappers/errorMapper.js';

export function AddRecordCard() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [serverError, setServerError] = useState('');

  const mutation = useAddCompanyRecord();

  useEffect(() => {
    if (!successMessage) return;
    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 8000);
    return () => clearTimeout(timer);
  }, [successMessage]);

  const handleTitleChange = (e) => {
    if (successMessage) setSuccessMessage('');
    if (serverError) setServerError('');
    setTitle(e.target.value);
    if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
  };

  const handleContentChange = (e) => {
    if (successMessage) setSuccessMessage('');
    if (serverError) setServerError('');
    setContent(e.target.value);
    if (errors.content) setErrors((prev) => ({ ...prev, content: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setServerError('');

    const validationResult = companyDataInsertRequestSchema.safeParse({ title, content });
    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title?.[0] || '',
        content: fieldErrors.content?.[0] || '',
      });
      return;
    }

    setErrors({});

    try {
      await mutation.mutateAsync({
        title: title.trim(),
        content: content.trim(),
      });
      setTitle('');
      setContent('');
      setSuccessMessage('Record saved.');
    } catch (err) {
      setServerError(mapAddRecordError(err));
    }
  };

  return (
    <section className="company-data-card" aria-labelledby="add-record-heading">
      <h2 id="add-record-heading" className="company-data-card__title">
        Add a record
      </h2>
      <p className="company-data-card__sub">
        Type or paste one piece of information.
      </p>

      {successMessage && (
        <div className="company-data-banner company-data-banner--success" role="status">
          {successMessage}
        </div>
      )}
      {serverError && (
        <div className="company-data-banner company-data-banner--error" role="alert">
          {serverError}
        </div>
      )}

      <form className="company-data-form" onSubmit={handleSubmit} noValidate>
        <TextField
          id="add-record-title"
          label="Title"
          placeholder="e.g. Return policy"
          value={title}
          onChange={handleTitleChange}
          error={errors.title}
        />

        <div className="text-field">
          <label className="text-field__label" htmlFor="add-record-content">
            Content
          </label>
          <textarea
            id="add-record-content"
            className={`text-field__input text-field__textarea${errors.content ? ' text-field__input--error' : ''}`}
            placeholder="Paste or type the details here"
            value={content}
            onChange={handleContentChange}
            aria-invalid={Boolean(errors.content)}
            aria-describedby={errors.content ? 'add-record-content-error' : undefined}
          />
          {errors.content && (
            <p className="text-field__error" id="add-record-content-error">
              {errors.content}
            </p>
          )}
        </div>

        <div className="company-data-form__actions">
          <Button
            type="submit"
            className="company-data-btn"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : 'Save record'}
          </Button>
        </div>
      </form>
    </section>
  );
}
