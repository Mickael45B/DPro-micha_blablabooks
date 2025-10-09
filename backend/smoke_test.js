// smoke_test.js - small smoke tests for local GraphQL server
const URL = 'http://localhost:4000/graphql';

async function post(query, variables = {}){
	try{
		const res = await fetch(URL, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ query, variables }),
		});
		const text = await res.text();
		let json;
		try { json = JSON.parse(text); } catch(e) { json = { raw: text }; }
		return { status: res.status, body: json };
	} catch(err){
		return { error: err.message };
	}
}

(async ()=>{
	console.log('Running smoke tests against', URL);

	const introspectionQ = `query { __schema { queryType { name } mutationType { name } } }`;
	const r1 = await post(introspectionQ);
	console.log('\nINTROSPECTION:\n', JSON.stringify(r1, null, 2));

	const getUsersQ = `query { getUsers { totalCount users { id_user name email } } }`;
	const r2 = await post(getUsersQ);
	console.log('\nGET_USERS:\n', JSON.stringify(r2, null, 2));

	// exit with non-zero code if errors
	if ((r1 && r1.error) || (r2 && r2.error) || (r1 && r1.body && r1.body.errors) || (r2 && r2.body && r2.body.errors)){
		process.exitCode = 2;
	} else {
		process.exitCode = 0;
	}
})();

