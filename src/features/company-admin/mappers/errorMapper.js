export function sanitizeHeaders(headers) {
  if (!Array.isArray(headers)) return [];
  return headers
    .map((name) => (typeof name === 'string' ? name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 60) : ''))
    .filter((name) => name.length > 0)
    .slice(0, 20);
}

export function parseCsvLine(line, delimiter) {
  let delim = delimiter;
  if (!delim) {
    if (!line.includes(',') && line.includes(';')) delim = ';';
    else if (!line.includes(',') && line.includes('\t')) delim = '\t';
    else delim = ',';
  }
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delim && !inQuotes) {
      result.push(current.trim().replace(/^['"\s]+|['"\s]+$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^['"\s]+|['"\s]+$/g, ''));
  return result;
}

export async function readCsvHeaderRow(file) {
  if (!file || typeof file.slice !== 'function') return [];
  try {
    const slice = file.slice(0, 8192);
    let text = '';
    if (typeof slice.text === 'function') {
      text = await slice.text();
    } else if (typeof FileReader !== 'undefined') {
      text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result || '');
        reader.onerror = () => reject(reader.error);
        reader.readAsText(slice, 'utf-8');
      });
    } else if (typeof slice.arrayBuffer === 'function') {
      const arrayBuffer = await slice.arrayBuffer();
      text = new TextDecoder('utf-8').decode(arrayBuffer);
    }
    text = (text || '').replace(/^\ufeff/, '');
    const firstLine = text.split(/\r\n|\r|\n/)[0] || '';
    if (!firstLine.trim()) return [];
    const headers = parseCsvLine(firstLine);
    return sanitizeHeaders(headers);
  } catch {
    return [];
  }
}

export function autoDetectCsvColumns(headers) {
  if (!Array.isArray(headers) || headers.length === 0) {
    return { detectedTitle: '', detectedContent: '' };
  }

  const titleKeywords = [
    'title',
    'name',
    'heading',
    'header',
    'subject',
    'topic',
    'question',
    'prompt',
    'faq',
    'query',
    'article',
    'summary',
    'item',
    'task',
    'policy',
    'headline',
    'key',
  ];

  const contentKeywords = [
    'content',
    'body',
    'text',
    'description',
    'details',
    'detail',
    'notes',
    'note',
    'answer',
    'response',
    'solution',
    'explanation',
    'message',
    'data',
    'info',
    'information',
    'value',
    'overview',
    'definition',
  ];

  let detectedTitle = '';
  let detectedContent = '';

  const normalize = (str) =>
    String(str)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim();

  for (const h of headers) {
    const norm = normalize(h);
    const words = norm.split(/\s+/);
    if (titleKeywords.some((k) => norm === k || words.includes(k))) {
      detectedTitle = h;
      break;
    }
  }

  for (const h of headers) {
    if (h === detectedTitle) continue;
    const norm = normalize(h);
    const words = norm.split(/\s+/);
    if (contentKeywords.some((k) => norm === k || words.includes(k))) {
      detectedContent = h;
      break;
    }
  }

  if (headers.length === 2) {
    if (!detectedTitle && !detectedContent) {
      detectedTitle = headers[0];
      detectedContent = headers[1];
    } else if (detectedTitle && !detectedContent) {
      detectedContent = headers.find((h) => h !== detectedTitle) || '';
    } else if (!detectedTitle && detectedContent) {
      detectedTitle = headers.find((h) => h !== detectedContent) || '';
    }
  } else if (headers.length > 2) {
    if (!detectedTitle) {
      detectedTitle = headers.find((h) => h !== detectedContent) || headers[0] || '';
    }
    if (!detectedContent) {
      detectedContent = headers.find((h) => h !== detectedTitle) || headers[1] || '';
    }
  } else if (headers.length === 1) {
    if (!detectedTitle) detectedTitle = headers[0];
  }

  return { detectedTitle, detectedContent };
}

export function extractAvailableHeaders(errorMessage) {
  if (!errorMessage || typeof errorMessage !== 'string') return [];
  const match = errorMessage.match(/Available headers:\s*\[(.*?)\]/i);
  if (!match) return [];
  const inside = match[1];
  const items = inside.split(',').map((item) => {
    return item.replace(/^['"\s]+|['"\s]+$/g, '').trim();
  });
  return sanitizeHeaders(items);
}

export function isMissingColumnsError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = (error.code || '').toLowerCase();
  return (
    error.status === 400 &&
    (msg.includes('missing required columns') ||
      msg.includes('available headers') ||
      msg.includes('needs a title column') ||
      code.includes('missing_columns'))
  );
}

export function formatMissingColumnsMessage(names) {
  if (Array.isArray(names) && names.length > 0) {
    const namesStr = names.join(', ');
    return `Your file needs a title column and a content column. Found: ${namesStr}. Enter them below and try again.`;
  }
  return 'Your file needs a title column and a content column. Enter the column names below and try again.';
}

export async function mapCsvImportError(error, file) {
  if (!error) return { message: '', foundHeaders: [] };

  if (isMissingColumnsError(error)) {
    let headers = Array.isArray(error?.details?.found_columns) ? error.details.found_columns : [];
    if (headers.length === 0) {
      headers = extractAvailableHeaders(error.message);
    }
    if (headers.length === 0 && file) {
      headers = await readCsvHeaderRow(file);
    }
    return {
      message: formatMissingColumnsMessage(headers),
      foundHeaders: headers,
      isMissingColumns: true,
    };
  }

  if (error.status === 403) {
    return { message: "You don't have access to this page.", foundHeaders: [] };
  }

  if (error.status === 413) {
    return {
      message: 'File size exceeds the server limit. Please upload a smaller file.',
      foundHeaders: [],
    };
  }

  if (error.status === 422) {
    return {
      message: 'Unable to process the file. Please check the file contents and try again.',
      foundHeaders: [],
    };
  }

  if (error.status === 429) {
    const seconds = error.retryAfterSeconds;
    const retryText = seconds ? ` Please try again in ${seconds} seconds.` : ' Please try again later.';
    return {
      message: `Too many requests.${retryText}`,
      foundHeaders: [],
    };
  }

  if (error.status === 0 || error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
    return {
      message: 'Network error. Please check your connection and retry.',
      foundHeaders: [],
    };
  }

  if (error.status === 400) {
    return {
      message: 'Invalid CSV file or column mapping. Please verify and try again.',
      foundHeaders: [],
    };
  }

  return {
    message: error.message || 'An unexpected error occurred while importing. Please try again.',
    foundHeaders: [],
  };
}

export function mapAddRecordError(error) {
  if (!error) return '';

  if (error.status === 403) {
    return "You don't have access to this page.";
  }

  if (error.status === 429) {
    const seconds = error.retryAfterSeconds;
    const retryText = seconds ? ` Please try again in ${seconds} seconds.` : ' Please try again later.';
    return `Too many requests.${retryText}`;
  }

  if (error.status === 413) {
    return 'Content exceeds the allowed size limit. Please shorten your content.';
  }

  if (error.status === 422 || error.status === 400) {
    return 'Invalid record data. Please verify the title and content.';
  }

  if (error.status === 0 || error.name === 'TypeError' || error.message?.includes('Failed to fetch')) {
    return 'Network error. Please check your connection and retry.';
  }

  return error.message || 'Failed to save record. Please try again.';
}
