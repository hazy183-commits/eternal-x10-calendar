import './privatePreviewNotice.css';

const notice = document.createElement('aside');
notice.className = 'private-preview-notice';
notice.innerHTML = '<strong>Prywatna wersja testowa</strong><span>Podgląd funkcji jest prywatny. Przełączniki publikacji i zapisy danych klanu działają na stronie publicznej.</span><a href="https://orzelbialy.eu" target="_blank" rel="noopener">Otwórz wersję publiczną</a><form method="post" action="/__preview-logout"><button type="submit">Zamknij dostęp do podglądu</button></form>';
document.body.prepend(notice);
