const res = await fetch('http://localhost:4000/api/bibliotheques', { method: 'GET' });
console.log('STATUS', res.status);
const text = await res.text();
console.log('BODY', text);
