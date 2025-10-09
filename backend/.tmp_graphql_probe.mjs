const res = await fetch('http://localhost:4000/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __typename }' }),
});
const text = await res.text();
console.log('STATUS', res.status);
console.log('BODY', text);
