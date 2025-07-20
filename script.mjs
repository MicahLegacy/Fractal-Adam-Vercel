document.getElementById('reflect-button').addEventListener('click', async () => {
  const userInput = document.getElementById('user-input').value;
  if (!userInput) return;

  const chat = document.getElementById('chat');
  const userDiv = document.createElement('div');
  userDiv.className = 'user-message';
  userDiv.textContent = userInput;
  chat.appendChild(userDiv);

  const aiDiv = document.createElement('div');
  aiDiv.className = 'ai-message loading';
  aiDiv.textContent = 'Thinking...';
  chat.appendChild(aiDiv);

  try {
    const res = await fetch('/api/reflect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput })
    });

    const data = await res.json();
    aiDiv.classList.remove('loading');
    aiDiv.innerHTML = marked.parse(data.response);
  } catch (err) {
    aiDiv.classList.remove('loading');
    aiDiv.textContent = '⚠️ Error generating response.';
    console.error('Reflect error:', err);
  }

  document.getElementById('user-input').value = '';
  chat.scrollTop = chat.scrollHeight;
});
