import { useState, useEffect } from 'react';

export const useTypingEffect = (text: string, speed: number = 30) => {
  const [displayedText, setDisplayedText] = useState('');
  
  useEffect(() => {
    let i = 0;

    const type = () => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i < text.length) {
        setTimeout(type, speed);
      }
    };

    // Reset and start typing
    setDisplayedText('');
    if (text) {
      setTimeout(type, speed);
    }

    // Cleanup
    return () => {};
  }, [text, speed]);

  return displayedText;
};
