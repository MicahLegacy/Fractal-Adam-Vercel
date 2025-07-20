import { glossary } from '../glossary.mjs';

// Wait for DOM to load
window.addEventListener('DOMContentLoaded', () => {
  const chatHistory = document.getElementById('chat-history');
  const inputField = document.getElementById('userInput');
  const button = document.getElementById('reflect-button');

  const glossaryRegex = new RegExp(
    glossary.map(({ symbol }) => `\\b${symbol}\\b`).join('|'),
    'gi'
  );

  function highlightGlossary(text) {
    return text.replace(glossaryRegex, (match) => {
      const entry = glossary.find(g => g.symbol.toLowerCase() === match.toLowerCase());
      if (entry) {
        return `<span class="glossary-term" title="${entry.meaning}">${match}</span>`;
      }
      return match;
    });
  }

  function appendMessage(sender, message) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerHTML = `<strong>${sender === 'user' ? 'You' : 'Fractal Adam'}:</strong> ${message}`;
    chatHistory.appendChild(messageDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  button.addEventListener('click', async () => {
    const userInput = inputField.value.trim();
    if (!userInput) return;

    appendMessage('user', userInput);
    inputField.value = '';

    const responseDiv = document.createElement('div');
    responseDiv.classList.add('message', 'ai');
    responseDiv.innerHTML = `<strong>Fractal Adam:</strong> <span class="loading">...</span>`;
    chatHistory.appendChild(responseDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userInput }),
      });

      if (!response.ok) throw new Error('Server error');
      const data = await response.json();

      const rawHTML = marked.parse(data.answer);
      const highlighted = highlightGlossary(rawHTML);
      responseDiv.innerHTML = `<strong>Fractal Adam:</strong> ${highlighted}`;
      chatHistory.scrollTop = chatHistory.scrollHeight;
    } catch (err) {
      console.error('Client error:', err);
      responseDiv.innerHTML = `<strong>Fractal Adam:</strong> <em>Error generating response.</em>`;
    }
  });
});
