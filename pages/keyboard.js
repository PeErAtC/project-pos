import React, { useState, useRef } from 'react';

const Keyboard = ({ onKeyPress, onClose }) => {
  const [language, setLanguage] = useState('EN');
  const [shift, setShift] = useState(false);
  const [height, setHeight] = useState(250); // Default height
  const containerRef = useRef(null);

  const layouts = {
    EN: [
      shift
        ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P']
        : ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
      shift
        ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L']
        : ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
      shift
        ? ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
        : ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
      ['SHIFT', '123', 'SPACE', 'TH', 'DELETE', 'CLOSE'],
    ],
    TH: [
      shift
        ? ['\u0E20', '\u0E16', '\u0E38', '\u0E36', '\u0E04', '\u0E15', '\u0E08', '\u0E02', '\u0E0A']
        : ['\u0E1E', '\u0E19', '\u0E17', '\u0E01', '\u0E34', '\u0E04', '\u0E2D', '\u0E41', '\u0E44', '\u0E02'],
      shift
        ? ['\u0E08', '\u0E1C', '\u0E1A', '\u0E22', '\u0E13', '\u0E2B', '\u0E27', '\u0E2C', '\u0E07']
        : ['\u0E40', '\u0E41', '\u0E2B', '\u0E1D', '\u0E1A', '\u0E22', '\u0E27', '\u0E2C', '\u0E07'],
      ['SHIFT', '123', 'SPACE', 'EN', 'DELETE', 'CLOSE'],
    ],
    NUM: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['ABC', '0', 'DELETE', 'CLOSE'],
    ],
  };

  const handleKeyPress = (key) => {
    if (key === 'CLOSE') {
      onClose();
    } else if (key === 'SPACE') {
      onKeyPress(' ');
    } else if (key === 'DELETE') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
          range.deleteContents();
        } else {
          onKeyPress('DELETE');
        }
      } else {
        onKeyPress('DELETE');
      }
    } else if (key === '123') {
      setLanguage('NUM');
    } else if (key === 'ABC') {
      setLanguage('EN');
    } else if (key === 'TH') {
      setLanguage('TH');
    } else if (key === 'EN') {
      setLanguage('EN');
    } else if (key === 'SHIFT') {
      setShift(!shift);
    } else {
      onKeyPress(key);
    }
  };

  const handleDrag = (e) => {
    const newHeight = window.innerHeight - e.clientY;
    if (newHeight >= 150 && newHeight <= 250) { // Limit height range
      setHeight(newHeight);
    }
  };

  return (
    <div
      ref={containerRef}
      style={{ ...styles.keyboardContainer, height: `${height}px` }}
    >
      <div
        style={styles.dragBar}
        onMouseDown={(e) => {
          e.preventDefault();
          window.addEventListener('mousemove', handleDrag);
          window.addEventListener('mouseup', () => {
            window.removeEventListener('mousemove', handleDrag);
          });
        }}
      ></div>
      {layouts[language].map((row, rowIndex) => (
        <div key={rowIndex} style={styles.keyboardRow}>
          {row.map((key) => (
            <button
              key={key}
              style={styles.keyButton}
              onClick={() => handleKeyPress(key)}
              className="keyButton"
            >
              {key === 'SHIFT' ? 'เปลี่ยนอักษร' :
               key === 'SPACE' ? 'เว้นวรรค' :
               key === 'DELETE' ? 'ลบ' :
               key === 'CLOSE' ? 'ปิด' :
               key === '123' ? 'ตัวเลข' :
               key === 'EN' ? 'อังกฤษ' :
               key === 'TH' ? 'ไทย' : key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};

const styles = {
  keyboardContainer: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
    backgroundColor: '#f5ecec',
    borderTop: '2px solid #ccc',
    zIndex: 1000,
    boxShadow: '0 -2px 5px rgba(0, 0, 0, 0.2)',
    transition: 'height 0.3s ease',
    borderRadius: '10px 10px 0 0',
  },
  dragBar: {
    width: '100%',
    height: '10px',
    backgroundColor: '#ccc',
    cursor: 'ns-resize',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
  },
  keyboardRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  keyButton: {
    backgroundColor: '#a8fc97',
    border: '1px solid #bbb',
    borderRadius: '8px',
    padding: '12px 18px',
    margin: '0 6px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    userSelect: 'none', // Disable text selection
  },
  keyButtonActive: {
    backgroundColor: '#ddd',
    transform: 'scale(0.95)',  // Adds the effect of shrinking the button when clicked
  },
};

export default Keyboard;
