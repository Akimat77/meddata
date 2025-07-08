// frontend/src/components/ShareModal.tsx

import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import styles from './ShareModal.module.css';

interface ShareModalProps {
  token: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ token, onClose }) => {
  const shareUrl = `${window.location.origin}/view/${token}`;
  
  // Состояние для обратной связи по кнопке "Копировать"
  const [copyText, setCopyText] = useState('Копировать');

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopyText('Скопировано!');
      setTimeout(() => setCopyText('Копировать'), 2000); // Возвращаем текст кнопки через 2 секунды
    });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>Поделиться с врачом</h3>
        <p className={styles.instructions}>
          Покажите этот QR-код врачу. Доступ к вашим данным будет открыт на 10 минут.
        </p>
        <div className={styles.qrCodeContainer}>
          <QRCodeSVG value={shareUrl} size={256} />
        </div>

        {/* --- НАЧАЛО НОВОГО БЛОКА --- */}
        <div className={styles.linkContainer}>
          <p className={styles.linkTitle}>Или поделитесь ссылкой напрямую:</p>
          <div className={styles.linkBox}>
            <span className={styles.urlText}>{shareUrl}</span>
            <button onClick={handleCopy} className={styles.copyButton}>{copyText}</button>
          </div>
        </div>
        {/* --- КОНЕЦ НОВОГО БЛОКА --- */}
        
        <div style={{marginTop: '2rem'}}>
          <button onClick={onClose} className={styles.closeButton}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};