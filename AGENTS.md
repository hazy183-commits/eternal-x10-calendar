# Wdrażanie nowych funkcji

**Obowiązkowa kolejność dla każdej nowości i zmiany wyglądu: propozycja w rozmowie → wyraźna zgoda właściciela na test → prywatny podgląd → decyzja właściciela w panelu. Nie wdrażaj żadnej nowości bezpośrednio jako aktywnej na publicznej stronie ani nie omijaj podglądu.**

- Najpierw przedstaw propozycję nowej funkcji w rozmowie z właścicielem. Dopiero po jego wyraźnej zgodzie dodaj ją do prywatnej wersji testowej na gałęzi `preview/owner-releases` i do listy „Nowości i podgląd”. Pominięte lub odrzucone propozycje nie trafiają na tę listę. Zgoda na dodanie do testów nie jest zgodą na włączenie funkcji dla klanu.
- Dodaj dla niej osobną pozycję w **Panel administratora → Panel główny → Nowości i podgląd**, z własnym linkiem do podglądu i przełącznikiem Włącz/Wyłącz. Rejestr funkcji jest w `src/siteFeatures.js`.
- Nowe funkcje mają domyślnie wyłączony stan publiczny. Właściciel po sprawdzeniu wybiera, czy je włączyć. Podgląd, jego akceptacja ani wdrożenie kodu z wyłączoną funkcją nie mogą zmieniać stanów innych pozycji.
- Przed przekazaniem podglądu sprawdź izolację nowej funkcji i dotychczasowe działanie strony przy wyłączonym przełączniku. Dla funkcji z zapisem danych stosuj osobne dane testowe i egzekwuj przełącznik również po stronie serwera, jeśli funkcja korzysta z API lub bazy.
- Włączanie i wyłączanie pojedynczej pozycji ma działać z panelu właściciela bez promowania całego wdrożenia testowego.
