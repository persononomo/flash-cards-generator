document.getElementById('generateButton').addEventListener('click', function() {
    const wordPairs = document.getElementById('wordPairs').value;
    const pairs = wordPairs.split('\n').map(pair => pair.split(' - '));

    fetch('YOUR_API_ENDPOINT', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ word_pairs: pairs })
    })
        .then(response => response.json())
        .then(data => {
            const pdfFrame = document.getElementById('pdfFrame');
            pdfFrame.style.display = 'block';
            pdfFrame.src = 'data:application/pdf;base64,' + data.pdf;
        })
        .catch(error => console.error('Error:', error));
});
