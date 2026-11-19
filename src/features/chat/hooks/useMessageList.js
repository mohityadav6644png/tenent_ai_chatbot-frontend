import { useEffect, useRef } from 'react';

export function useMessageList(messages) {
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo?.({
      top: listRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  return listRef;
}
