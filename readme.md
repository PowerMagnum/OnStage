# OnStage

**OnStage** è un progetto che permette di gestire schermi pubblicitari in tempo reale. Con OnStage, è possibile modificare le diapositive mostrate, gestire le informazioni di visualizzazione e abilitare lo scorrimento automatico delle slide.

## Caratteristiche principali

- **Gestione delle diapositive**: Modifica, aggiungi o rimuovi diapositive per gli schermi pubblicitari in tempo reale.
- **Configurazione delle informazioni di visualizzazione**: Personalizza le informazioni mostrate sugli schermi.
- **Scorrimento automatico**: Attiva o disattiva lo scorrimento automatico delle diapositive.

## Requisiti

- Node.js (versione LTS consigliata)
- NPM (Node Package Manager)

## Installazione

1. Clona questo repository nel tuo ambiente locale:
    ```bash
    git clone git@github.com:PowerMagnum/OnStage.git
    cd OnStage
    ```

2. Installa le dipendenze necessarie eseguendo:
    ```bash
    npm install
    ```

3. Avvia l'applicazione:
    ```bash
    node .
    ```

4. Il servizio sarà hostato sulla porta `8080` per impostazione predefinita. È possibile modificare la porta nel file `main.js` se necessario.

## Accesso all'area amministrativa

Per accedere all'area amministrativa e gestire le diapositive, è necessario utilizzare i codici di accesso. Questi codici sono hardcodificati nell'array `codes` all'interno del file `main.js` (quello di default è `00000000`).

## Configurazione della porta

Se si desidera eseguire OnStage su una porta diversa dalla `8080`, è possibile modificarla nell'ultima riga del file `main.js`:

