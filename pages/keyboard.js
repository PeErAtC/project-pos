import React, { useState } from 'react';

const DraggableKeyboard = ({ onKeyPress, onClose }) => {
  const [language, setLanguage] = useState('EN');
  const [shift, setShift] = useState(false);
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState('ALPHA'); // ALPHA or NUMERIC
  const [activeKey, setActiveKey] = useState(null); // Track active key for effect

  const layouts = {
    ALPHA: {
      EN: [
        shift ? ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'] : ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
        shift ? ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'] : ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
        shift ? ['Z', 'X', 'C', 'V', 'B', 'N', 'M'] : ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
        ['SHIFT', 'SPACE', 'DELETE', 'CLOSE'],
      ],
      TH: [
        shift
          ? ['๐', '“', '”', 'ะ', 'ฯ', 'ๆ', 'ํ', '๎', '์', '฿']
          : ['ก', 'ข', 'ฃ', 'ค', 'ฅ', 'ฆ', 'ง', 'จ', 'ฉ', 'ช'],
        shift
          ? ['ุ', 'ู', 'ิ', 'ี', 'ึ', '่', '้', '๊', '๋', '์']
          : ['ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด'],
        shift
          ? ['แ', 'โ', 'ใ', 'ไ', 'เ', 'ำ', 'า', 'ฯ', '็', 'ฦ']
          : ['ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ'],
        ['SHIFT', 'SPACE', 'DELETE', 'CLOSE'],
      ],
    },
    NUMERIC: [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['ALPHA', '0', 'DELETE', 'CLOSE'],
    ],
  };

  const handleDragStart = (e) => {
    if (e.target.className === 'drag-bar') {
      setIsDragging(true);
      const offsetX = e.clientX - position.x;
      const offsetY = e.clientY - position.y;
      setPosition((prev) => ({ ...prev, offsetX, offsetY }));
    }
  };

  const handleDragMove = (e) => {
    if (isDragging) {
      const newX = e.clientX - position.offsetX;
      const newY = e.clientY - position.offsetY;
      setPosition((prev) => ({ ...prev, x: newX, y: newY }));
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleKeyPress = (key) => {
    setActiveKey(key); // Activate key effect
    setTimeout(() => setActiveKey(null), 150); // Remove effect after 150ms

    if (key === 'CLOSE') {
      onClose();
    } else if (key === 'SPACE') {
      onKeyPress(' ');
    } else if (key === 'DELETE') {
      onKeyPress('DELETE');
    } else if (key === 'TH') {
      setLanguage('TH');
      setMode('ALPHA');
    } else if (key === 'EN') {
      setLanguage('EN');
      setMode('ALPHA');
    } else if (key === 'SHIFT') {
      setShift(!shift);
    } else if (key === '123') {
      setMode('NUMERIC');
    } else if (key === 'ALPHA') {
      setMode('ALPHA');
    } else {
      onKeyPress(key);
    }
  };

  const currentLayout = mode === 'NUMERIC' ? layouts.NUMERIC : layouts.ALPHA[language];

  return (
    <div
      style={{
        ...styles.keyboardContainer,
        transform: `translate(${position.x}px, ${position.y}px)`,
      }}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
    >
      <div
        className="drag-bar"
        style={styles.dragBar}
        onMouseDown={handleDragStart}
      ></div>
      {currentLayout.map((row, rowIndex) => (
        <div key={rowIndex} style={styles.keyboardRow}>
          {row.map((key) => (
            <button
              key={key}
              style={{
                ...styles.keyButton,
                ...(key === 'DELETE' ? styles.deleteButton : {}),
                ...(key === 'CLOSE' ? styles.closeButton : {}),
                ...(key === 'SPACE' ? styles.spaceButton : {}),
                ...(key === 'SHIFT' ? styles.shiftButton : {}),
                ...(activeKey === key ? styles.activeKey : {}), // Apply active effect
              }}
              onClick={() => handleKeyPress(key)}
            >
              {key === 'SPACE'
                ? '' // ไม่มีข้อความในปุ่ม SPACE
                : key === 'SHIFT'
                ? '⇧'
                : key === 'DELETE'
                ? '⌫'
                : key === 'CLOSE'
                ? '⏎'
                : key}
            </button>
          ))}
        </div>
      ))}
      <div style={styles.languageSwitchRow}>
        <button style={styles.languageButton} onClick={() => handleKeyPress('TH')}>
          ไทย
        </button>
        <button style={styles.languageButton} onClick={() => handleKeyPress('EN')}>
          EN
        </button>
        <button style={styles.languageButton} onClick={() => handleKeyPress('123')}>
          123
        </button>
      </div>
    </div>
  );
};

const styles = {
  keyboardContainer: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    border: '2px solid #ddd',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '10px',
    zIndex: 1000,
  },
  dragBar: {
    height: '10px',
    width: '100%',
    backgroundColor: '#ccc',
    cursor: 'move',
    marginBottom: '5px',
    borderRadius: '5px',
  },
  keyboardRow: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '10px',
  },
  keyButton: {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '10px 15px',
    margin: '3px',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s, transform 0.1s',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  deleteButton: {
    backgroundColor: '#e74c3c', // สีแดง
    color: '#fff',
  },
  closeButton: {
    backgroundColor: '#2ecc71', // สีเขียว
    color: '#fff',
  },
  shiftButton: {
    backgroundColor: '#347cae',
    color: '#fff',
  },
  spaceButton: {
    flexGrow: 1,
    padding: '10px 80px', // ความกว้างพิเศษสำหรับ SPACE
  },
  activeKey: {
    transform: 'scale(0.95)', // Shrink effect
    backgroundColor: '#e0e0e0',
  },
  languageSwitchRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  languageButton: {
    backgroundColor: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.2s',
  },
};
export default DraggableKeyboard;
